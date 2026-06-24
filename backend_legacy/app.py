"""
Mohiyat AI — FastAPI Backend (Web MVP)
=======================================
Endpoints:
  POST /scan           → Upload & freemium analysis (Zero Storage)
  POST /scan/premium   → Premium deep analysis (after payment)
  GET  /health         → Container health check
  POST /webhook/payme  → Payme payment webhook
  POST /webhook/click  → Click payment webhook
"""

import json
import logging
import os
import tempfile
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client

from config import get_settings
from document_processor import compute_file_hash, extract_text, validate_file
from llm_router import LLMRouter, LLMTier
from prompts import build_freemium_prompt, build_premium_prompt

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mohiyat")

settings = get_settings()
llm_router: Optional[LLMRouter] = None
supabase = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm_router, supabase
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    llm_router = LLMRouter()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    logger.info("LLM Router and Supabase client initialized")
    yield
    logger.info("Shutting down")


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fetch_legal_bundles(domain: Optional[str] = None) -> list[dict]:
    query = supabase.table("legal_bundles").select("*")
    if domain:
        query = query.eq("domain", domain)
    return query.execute().data or []


def parse_llm_response(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        cleaned = "\n".join(lines)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM JSON, returning raw text")
        return {
            "short_title": "Tahlil natijasi",
            "blind_spots": [{"title": "Tahlil natijasi", "severity": "medium", "section_ref": "Umumiy"}],
            "risk_score": 50,
            "summary": cleaned[:500],
        }


# =============================================================================
# ENDPOINTS
# =============================================================================


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.post("/scan")
async def scan_document(file: UploadFile = File(...), user_id: Optional[str] = Form(None)):
    """
    FREEMIUM SCAN — Zero Storage Pipeline
    1. Save to tmpfs → 2. Extract text → 3. Gemini Flash → 4. Delete file → 5. Return hook
    """
    file_bytes = await file.read()
    error = validate_file(file.filename, file.content_type, len(file_bytes), settings.MAX_FILE_SIZE_MB)
    if error:
        raise HTTPException(status_code=400, detail=error)

    file_hash = compute_file_hash(file_bytes)
    temp_path = None

    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir="/tmp") as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        logger.info(f"Processing: {file.filename} ({len(file_bytes)} bytes)")
        text, page_count = extract_text(temp_path, file.filename)

        if page_count > settings.MAX_PAGES_FREE:
            raise HTTPException(status_code=402, detail={
                "code": "PAGE_LIMIT",
                "message": f"Tekin rejada faqat {settings.MAX_PAGES_FREE} sahifa",
                "page_count": page_count,
            })

        bundles = fetch_legal_bundles()
        system_inst, user_prompt = build_freemium_prompt(text, bundles)
        llm_result = await llm_router.route(prompt=user_prompt, system_instruction=system_inst, tier=LLMTier.FREEMIUM)
        analysis = parse_llm_response(llm_result["response_text"])

        session_data = {
            "user_id": user_id,
            "file_name": file.filename,
            "file_hash": file_hash,
            "page_count": page_count,
            "detected_domain": analysis.get("detected_domain"),
            "short_title": analysis.get("short_title", "Shartnoma"),
            "blind_spots": analysis.get("blind_spots", []),
            "risk_score": analysis.get("risk_score", 50),
            "full_report": None,  # THE LOCK
            "llm_model_used": llm_result["model_used"],
            "processing_ms": llm_result["processing_ms"],
            "status": "completed",
        }

        result = supabase.table("scan_sessions").insert(session_data).execute()
        session = result.data[0] if result.data else session_data

        return JSONResponse(content={
            "session_id": session.get("id"),
            "blind_spots": analysis.get("blind_spots", []),
            "risk_score": analysis.get("risk_score", 50),
            "summary": analysis.get("summary", ""),
            "page_count": page_count,
            "processing_ms": llm_result["processing_ms"],
            "model_used": llm_result["model_used"],
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Tahlil jarayonida xatolik yuz berdi")
    finally:
        # ── ZERO STORAGE GUARANTEE ──
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info(f"Temp file purged: {temp_path}")


@app.post("/scan/premium/{session_id}")
async def premium_analysis(session_id: str):
    """Premium analysis — triggered after payment confirmation."""
    txn = supabase.table("transactions").select("*").eq("session_id", session_id).eq("status", "confirmed").execute()
    if not txn.data:
        raise HTTPException(status_code=403, detail="To'lov tasdiqlanmagan")

    session = supabase.table("scan_sessions").select("*").eq("id", session_id).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Sessiya topilmadi")

    session_data = session.data[0]
    bundles = fetch_legal_bundles(domain=session_data.get("detected_domain")) or fetch_legal_bundles()

    system_inst, user_prompt = build_premium_prompt(
        json.dumps(session_data.get("blind_spots", []), ensure_ascii=False), bundles
    )
    llm_result = await llm_router.route(prompt=user_prompt, system_instruction=system_inst, tier=LLMTier.PREMIUM)
    full_report = parse_llm_response(llm_result["response_text"])

    supabase.table("scan_sessions").update({
        "full_report": full_report,
        "status": "unlocked",
        "llm_model_used": llm_result["model_used"],
    }).eq("id", session_id).execute()

    return {"status": "unlocked", "session_id": session_id}


# =============================================================================
# PAYMENT WEBHOOKS
# =============================================================================


@app.post("/webhook/payme")
async def payme_webhook(request: Request):
    body = await request.json()
    logger.info(f"Payme webhook: {json.dumps(body)[:200]}")
    try:
        method = body.get("method")
        params = body.get("params", {})
        if method == "PerformTransaction":
            account = params.get("account", {})
            session_id = account.get("session_id")
            if not session_id:
                return JSONResponse(content={"error": {"code": -31050, "message": "Session not found"}})
            supabase.table("transactions").insert({
                "session_id": session_id,
                "user_id": account.get("user_id"),
                "provider": "payme",
                "provider_txn_id": params.get("id"),
                "amount_uzs": params.get("amount", 0) // 100,
                "status": "confirmed",
                "webhook_payload": body,
            }).execute()
            await premium_analysis(session_id)
            return JSONResponse(content={"result": {"state": 2, "transaction": params.get("id")}})
        return JSONResponse(content={"result": {}})
    except Exception as e:
        logger.error(f"Payme error: {e}", exc_info=True)
        return JSONResponse(content={"error": {"code": -31008, "message": str(e)}})


@app.post("/webhook/click")
async def click_webhook(request: Request):
    body = await request.json()
    logger.info(f"Click webhook: {json.dumps(body)[:200]}")
    try:
        if body.get("action") == 1:
            session_id = body.get("merchant_trans_id")
            if not session_id:
                return JSONResponse(content={"error": -5, "error_note": "Session not found"})
            supabase.table("transactions").insert({
                "session_id": session_id,
                "provider": "click",
                "provider_txn_id": str(body.get("click_trans_id")),
                "amount_uzs": int(body.get("amount", 0)),
                "status": "confirmed",
                "webhook_payload": body,
            }).execute()
            await premium_analysis(session_id)
            return JSONResponse(content={"error": 0, "error_note": "Success"})
        return JSONResponse(content={"error": 0, "error_note": "OK"})
    except Exception as e:
        logger.error(f"Click error: {e}", exc_info=True)
        return JSONResponse(content={"error": -9, "error_note": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=True)

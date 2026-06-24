# =============================================================================
# Mohiyat AI — Dockerfile for Hugging Face Spaces
# =============================================================================
# Security: Runs as non-root user (HF Spaces requirement).
# Ephemeral: Container filesystem wipes on restart — Zero Storage guarantee.
# =============================================================================

FROM python:3.11-slim

# ── System dependencies (OCR + PDF rendering) ──────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-uzb \
    tesseract-ocr-rus \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Create non-root user (Hugging Face Spaces security requirement) ─────────
RUN useradd -m -u 1000 mohiyat
USER mohiyat

# ── Set working directory ───────────────────────────────────────────────────
WORKDIR /home/mohiyat/app

# ── Install Python dependencies ────────────────────────────────────────────
COPY --chown=mohiyat:mohiyat requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Copy application code ──────────────────────────────────────────────────
COPY --chown=mohiyat:mohiyat . .

# ── Expose port (HF Spaces expects 7860) ───────────────────────────────────
EXPOSE 7860

# ── Health check ────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/health')"

# ── Launch ──────────────────────────────────────────────────────────────────
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

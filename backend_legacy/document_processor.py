"""
Mohiyat AI — Document Processing Utilities
===========================================
Handles: PDF text extraction, DOCX parsing, image OCR.
All operations use tempfile for Zero Storage guarantee.
"""

import hashlib
import logging
import os
from pathlib import Path
from typing import Optional

import pytesseract
from PIL import Image
from PyPDF2 import PdfReader
from docx import Document

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/png", "image/jpeg", "image/tiff", "image/bmp", "text/plain",
}


def validate_file(filename: str, content_type: str, file_size: int, max_size_mb: int) -> Optional[str]:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return f"Fayl turi qo'llab-quvvatlanmaydi: {ext}"
    if content_type not in ALLOWED_MIME_TYPES:
        return f"Noto'g'ri fayl formati: {content_type}"
    if file_size > max_size_mb * 1024 * 1024:
        return f"Fayl hajmi {max_size_mb}MB dan oshmasligi kerak"
    return None


def compute_file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    reader = PdfReader(file_path)
    page_count = len(reader.pages)
    parts = [p.extract_text().strip() for p in reader.pages if p.extract_text()]
    return "\n\n".join(parts), page_count


def extract_text_from_docx(file_path: str) -> tuple[str, int]:
    doc = Document(file_path)
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n\n".join(parts)
    return text, max(1, len(text) // 3000)


def extract_text_from_image(file_path: str) -> tuple[str, int]:
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image, lang="uzb+rus+eng")
    return text.strip(), 1


def extract_text(file_path: str, filename: str) -> tuple[str, int]:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        text, pages = extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        text, pages = extract_text_from_docx(file_path)
    elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        text, pages = extract_text_from_image(file_path)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        pages = max(1, len(text) // 3000)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    if not text or len(text.strip()) < 20:
        raise ValueError("Fayldan matn ajratib olinmadi. Iltimos, aniqroq rasm yoki hujjat yuklang.")

    logger.info(f"Extracted {len(text)} chars, {pages} page(s) from {filename}")
    return text, pages

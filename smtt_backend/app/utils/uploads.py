"""Strict, reusable validation for user-controlled uploads."""
from pathlib import Path

from flask import current_app

_SIGNATURES = {
    ".pdf": (b"%PDF-",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
}


def validate_upload(storage, allowed_extensions=None):
    """Validate filename extension, magic bytes and size without consuming the stream."""
    if not storage or not storage.filename:
        return False
    extension = Path(storage.filename).suffix.lower()
    allowed = set(allowed_extensions or _SIGNATURES)
    if extension not in allowed or extension not in _SIGNATURES:
        return False

    stream = storage.stream
    position = stream.tell()
    try:
        header = stream.read(12)
        if not any(header.startswith(signature) for signature in _SIGNATURES[extension]):
            return False
        stream.seek(0, 2)
        size = stream.tell()
        return 0 < size <= current_app.config["UPLOAD_MAX_FILE_SIZE"]
    finally:
        stream.seek(position)

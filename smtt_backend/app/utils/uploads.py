"""Validation and storage helpers for user-controlled uploads."""
import mimetypes
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import boto3
from botocore.config import Config
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


@lru_cache(maxsize=8)
def _cached_s3_client(region, endpoint_url):
    return boto3.client(
        "s3",
        region_name=region,
        endpoint_url=endpoint_url,
        config=Config(retries={"total_max_attempts": 3, "mode": "adaptive"}, connect_timeout=5, read_timeout=30),
    )


def _s3_client():
    return _cached_s3_client(current_app.config["S3_REGION"], current_app.config.get("S3_ENDPOINT_URL"))


def _object_key(relative_path):
    relative_path = str(relative_path).replace("\\", "/").lstrip("/")
    prefix = current_app.config.get("S3_PREFIX", "uploads").strip("/")
    return f"{prefix}/{relative_path}" if prefix else relative_path


def save_upload(storage, relative_path, content_type=None):
    """Save a FileStorage object and return its persistent application URL."""
    relative_path = str(relative_path).replace("\\", "/").lstrip("/")
    if current_app.config.get("STORAGE_BACKEND") == "s3":
        storage.stream.seek(0)
        _s3_client().upload_fileobj(
            storage.stream,
            current_app.config["S3_BUCKET"],
            _object_key(relative_path),
            ExtraArgs={
                "ContentType": content_type or storage.mimetype or mimetypes.guess_type(relative_path)[0] or "application/octet-stream",
                "ServerSideEncryption": "AES256",
            },
        )
        return f"/api/uploads/{relative_path}"
    destination = Path(current_app.root_path) / "static" / "uploads" / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    storage.save(destination)
    return f"/static/uploads/{relative_path}"


def save_upload_bytes(content, relative_path, content_type=None):
    class MemoryUpload:
        def __init__(self):
            self.stream = BytesIO(content)
            self.mimetype = content_type

        def save(self, destination):
            Path(destination).write_bytes(content)

    return save_upload(MemoryUpload(), relative_path, content_type)


def delete_upload(url):
    """Delete an upload referenced by either a local or S3 application URL."""
    if not url:
        return
    s3_prefix = "/api/uploads/"
    local_prefix = "/static/uploads/"
    if url.startswith(s3_prefix):
        _s3_client().delete_object(Bucket=current_app.config["S3_BUCKET"], Key=_object_key(url[len(s3_prefix):]))
    elif url.startswith(local_prefix):
        path = Path(current_app.root_path) / "static" / "uploads" / url[len(local_prefix):]
        path.unlink(missing_ok=True)


def presigned_download_url(relative_path):
    return _s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": current_app.config["S3_BUCKET"], "Key": _object_key(relative_path)},
        ExpiresIn=current_app.config["S3_PRESIGNED_URL_EXPIRES"],
    )

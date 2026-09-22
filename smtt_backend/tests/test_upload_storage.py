import io
from pathlib import Path
from unittest.mock import Mock, patch

from flask import Flask
from werkzeug.datastructures import FileStorage

from app.utils.uploads import delete_upload, presigned_download_url, save_upload


def make_app(tmp_path, backend="local"):
    app = Flask(__name__, root_path=str(tmp_path))
    app.config.update(
        STORAGE_BACKEND=backend,
        S3_BUCKET="private-bucket",
        S3_REGION="sa-east-1",
        S3_PREFIX="uploads",
        S3_ENDPOINT_URL=None,
        S3_PRESIGNED_URL_EXPIRES=900,
    )
    return app


def make_file(content=b"%PDF-1.4 test"):
    return FileStorage(stream=io.BytesIO(content), filename="documento.pdf", content_type="application/pdf")


def test_local_storage_keeps_existing_url_contract(tmp_path):
    app = make_app(tmp_path)
    with app.app_context():
        url = save_upload(make_file(), "eventos/documento.pdf")
        assert url == "/static/uploads/eventos/documento.pdf"
        assert (Path(app.root_path) / "static" / "uploads" / "eventos" / "documento.pdf").read_bytes() == b"%PDF-1.4 test"
        delete_upload(url)
        assert not (Path(app.root_path) / "static" / "uploads" / "eventos" / "documento.pdf").exists()


def test_s3_storage_uploads_private_object_and_returns_application_url(tmp_path):
    app = make_app(tmp_path, "s3")
    client = Mock()
    client.generate_presigned_url.return_value = "https://signed.example/documento"
    with app.app_context(), patch("app.utils.uploads.boto3.client", return_value=client):
        url = save_upload(make_file(), "eventos/documento.pdf")
        assert url == "/api/uploads/eventos/documento.pdf"
        _, bucket, key = client.upload_fileobj.call_args.args
        assert bucket == "private-bucket"
        assert key == "uploads/eventos/documento.pdf"
        assert client.upload_fileobj.call_args.kwargs["ExtraArgs"] == {
            "ContentType": "application/pdf",
            "ServerSideEncryption": "AES256",
        }
        assert presigned_download_url("eventos/documento.pdf") == "https://signed.example/documento"
        assert client.generate_presigned_url.call_args.kwargs["ExpiresIn"] == 900
        delete_upload(url)
        client.delete_object.assert_called_once_with(Bucket="private-bucket", Key="uploads/eventos/documento.pdf")
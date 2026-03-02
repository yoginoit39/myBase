import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional
from app.config import get_settings

settings = get_settings()


def _get_client():
    if not settings.R2_ACCESS_KEY_ID:
        raise RuntimeError("R2 storage is not configured. Add R2 credentials to .env")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def upload_file(project_id: str, bucket_path: str, file_data: bytes, content_type: str) -> str:
    client = _get_client()
    key = f"{project_id}/{bucket_path}"
    client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=file_data,
        ContentType=content_type,
    )
    return key


def list_files(project_id: str, prefix: str = "") -> List[Dict]:
    client = _get_client()
    full_prefix = f"{project_id}/{prefix}"
    response = client.list_objects_v2(Bucket=settings.R2_BUCKET_NAME, Prefix=full_prefix)
    files = []
    for obj in response.get("Contents", []):
        files.append({
            "key": obj["Key"].removeprefix(f"{project_id}/"),
            "size": obj["Size"],
            "last_modified": obj["LastModified"].isoformat(),
        })
    return files


def delete_file(project_id: str, file_path: str) -> None:
    client = _get_client()
    key = f"{project_id}/{file_path}"
    client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)


def get_presigned_url(project_id: str, file_path: str, expires: int = 3600) -> str:
    client = _get_client()
    key = f"{project_id}/{file_path}"
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
        ExpiresIn=expires,
    )

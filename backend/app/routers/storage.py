from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.services.auth import get_current_user
from app.services.storage import upload_file, list_files, delete_file, get_presigned_url

router = APIRouter()


def _get_owned_project(project_id: str, user_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/{project_id}/storage/upload")
async def upload(
    project_id: str,
    path: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    try:
        data = await file.read()
        key = upload_file(project_id, path, data, file.content_type or "application/octet-stream")
        return {"key": key, "size": len(data), "content_type": file.content_type}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/{project_id}/storage")
def list_storage(
    project_id: str,
    prefix: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    try:
        return list_files(project_id, prefix)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.delete("/{project_id}/storage/{file_path:path}", status_code=204)
def delete_storage_file(
    project_id: str,
    file_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    try:
        delete_file(project_id, file_path)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/{project_id}/storage/{file_path:path}/url")
def get_file_url(
    project_id: str,
    file_path: str,
    expires: int = 3600,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    try:
        url = get_presigned_url(project_id, file_path, expires)
        return {"url": url}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

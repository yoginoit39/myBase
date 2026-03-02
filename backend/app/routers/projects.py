import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectTable
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectListItem
from app.services.auth import get_current_user
from app.services.project_db import init_project_db
import os

router = APIRouter()


def _project_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description or "",
        api_key=project.api_key,
        created_at=project.created_at,
        table_count=len(project.tables),
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project_id = str(uuid.uuid4()).replace("-", "")[:16]
    api_key = f"mb_{secrets.token_urlsafe(32)}"
    project = Project(
        id=project_id,
        user_id=current_user.id,
        name=body.name,
        description=body.description or "",
        api_key=api_key,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    init_project_db(project_id)
    return _project_response(project)


@router.get("", response_model=List[ProjectListItem])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return [
        ProjectListItem(
            id=p.id,
            name=p.name,
            description=p.description or "",
            created_at=p.created_at,
            table_count=len(p.tables),
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_owned_project(project_id, current_user.id, db)
    return _project_response(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_owned_project(project_id, current_user.id, db)
    db.delete(project)
    db.commit()
    db_file = os.path.join("data/projects", f"{project_id}.db")
    if os.path.exists(db_file):
        os.remove(db_file)


@router.post("/{project_id}/regenerate-key", response_model=ProjectResponse)
def regenerate_key(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = _get_owned_project(project_id, current_user.id, db)
    project.api_key = f"mb_{secrets.token_urlsafe(32)}"
    db.commit()
    db.refresh(project)
    return _project_response(project)


def _get_owned_project(project_id: str, user_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectTable
from app.schemas.table import TableCreate, TableResponse, TableListItem, ColumnDefinition
from app.services.auth import get_current_user
from app.services.project_db import create_table, drop_table, get_row_count

router = APIRouter()


def _get_owned_project(project_id: str, user_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/{project_id}/tables", response_model=TableResponse, status_code=status.HTTP_201_CREATED)
def create_project_table(
    project_id: str,
    body: TableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_owned_project(project_id, current_user.id, db)

    existing = db.query(ProjectTable).filter(
        ProjectTable.project_id == project_id,
        ProjectTable.table_name == body.name,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Table '{body.name}' already exists")

    create_table(project_id, body.name, body.columns)

    pt = ProjectTable(
        project_id=project_id,
        table_name=body.name,
        schema_json=json.dumps([c.model_dump() for c in body.columns]),
    )
    db.add(pt)
    db.commit()
    db.refresh(pt)

    return TableResponse(
        table_name=pt.table_name,
        columns=body.columns,
        row_count=0,
        created_at=pt.created_at,
    )


@router.get("/{project_id}/tables", response_model=List[TableListItem])
def list_project_tables(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    tables = db.query(ProjectTable).filter(ProjectTable.project_id == project_id).all()
    return [
        TableListItem(
            table_name=t.table_name,
            row_count=get_row_count(project_id, t.table_name),
            created_at=t.created_at,
        )
        for t in tables
    ]


@router.get("/{project_id}/tables/{table_name}", response_model=TableResponse)
def get_project_table(
    project_id: str,
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    pt = db.query(ProjectTable).filter(
        ProjectTable.project_id == project_id,
        ProjectTable.table_name == table_name,
    ).first()
    if not pt:
        raise HTTPException(status_code=404, detail="Table not found")

    columns = [ColumnDefinition(**c) for c in json.loads(pt.schema_json)]
    return TableResponse(
        table_name=pt.table_name,
        columns=columns,
        row_count=get_row_count(project_id, table_name),
        created_at=pt.created_at,
    )


@router.delete("/{project_id}/tables/{table_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_table(
    project_id: str,
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_project(project_id, current_user.id, db)
    pt = db.query(ProjectTable).filter(
        ProjectTable.project_id == project_id,
        ProjectTable.table_name == table_name,
    ).first()
    if not pt:
        raise HTTPException(status_code=404, detail="Table not found")

    drop_table(project_id, table_name)
    db.delete(pt)
    db.commit()

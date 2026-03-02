from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
from app.database import get_db
from app.models.project import Project, ProjectTable
from app.services.project_db import query_rows, insert_row, update_row, delete_row

router = APIRouter()


def _get_project_by_key(api_key: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.api_key == api_key).first()
    if not project:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return project


def _require_table(project_id: str, table_name: str, db: Session) -> ProjectTable:
    pt = db.query(ProjectTable).filter(
        ProjectTable.project_id == project_id,
        ProjectTable.table_name == table_name,
    ).first()
    if not pt:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    return pt


@router.get("/{table_name}")
def get_rows(
    table_name: str,
    request: Request,
    select: str = Query("*"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    order_by: Optional[str] = Query(None),
    order_dir: str = Query("asc"),
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db),
):
    project = _get_project_by_key(x_api_key, db)
    _require_table(project.id, table_name, db)

    filters = {}
    reserved = {"select", "limit", "offset", "order_by", "order_dir"}
    for key, val in request.query_params.items():
        if key not in reserved:
            filters[key] = val

    rows = query_rows(
        project.id, table_name,
        filters=filters or None,
        select=select,
        limit=limit,
        offset=offset,
        order_by=order_by,
        order_dir=order_dir,
    )
    return rows


@router.post("/{table_name}", status_code=201)
def create_row(
    table_name: str,
    body: Dict[str, Any],
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db),
):
    project = _get_project_by_key(x_api_key, db)
    _require_table(project.id, table_name, db)
    try:
        row = insert_row(project.id, table_name, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return row


@router.patch("/{table_name}/{row_id}")
def patch_row(
    table_name: str,
    row_id: int,
    body: Dict[str, Any],
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db),
):
    project = _get_project_by_key(x_api_key, db)
    _require_table(project.id, table_name, db)
    try:
        row = update_row(project.id, table_name, row_id, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    return row


@router.delete("/{table_name}/{row_id}", status_code=204)
def remove_row(
    table_name: str,
    row_id: int,
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db),
):
    project = _get_project_by_key(x_api_key, db)
    _require_table(project.id, table_name, db)
    deleted = delete_row(project.id, table_name, row_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Row not found")

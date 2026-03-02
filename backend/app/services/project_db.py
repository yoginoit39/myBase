import re
import os
from typing import List, Dict, Any, Optional
from app.config import get_settings
from app.schemas.table import ColumnDefinition, ColumnType

settings = get_settings()

_IS_PG = settings.DATABASE_URL.startswith(("postgresql://", "postgres://"))

_SQLITE_TYPES = {
    ColumnType.text: "TEXT",
    ColumnType.integer: "INTEGER",
    ColumnType.float_: "REAL",
    ColumnType.boolean: "INTEGER",
    ColumnType.datetime_: "TEXT",
    ColumnType.json: "TEXT",
}

_PG_TYPES = {
    ColumnType.text: "TEXT",
    ColumnType.integer: "INTEGER",
    ColumnType.float_: "DOUBLE PRECISION",
    ColumnType.boolean: "BOOLEAN",
    ColumnType.datetime_: "TIMESTAMPTZ",
    ColumnType.json: "JSONB",
}


def _validate_identifier(name: str) -> None:
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', name):
        raise ValueError(f"Invalid identifier: {name}")


# ── PostgreSQL helpers ────────────────────────────────────────────────────────

def _pg_schema(project_id: str) -> str:
    return "p_" + project_id.replace("-", "_")


def _pg_conn():
    import psycopg2
    import psycopg2.extras
    return psycopg2.connect(settings.DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


# ── SQLite helpers ────────────────────────────────────────────────────────────

def _sqlite_path(project_id: str) -> str:
    return os.path.join(settings.DATA_DIR, f"{project_id}.db")


def _sqlite_conn(project_id: str):
    import sqlite3
    conn = sqlite3.connect(_sqlite_path(project_id))
    conn.row_factory = sqlite3.Row
    return conn


# ── Public API ────────────────────────────────────────────────────────────────

def init_project_db(project_id: str) -> None:
    if _IS_PG:
        schema = _pg_schema(project_id)
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
        finally:
            conn.close()
    else:
        conn = _sqlite_conn(project_id)
        conn.close()


def create_table(project_id: str, table_name: str, columns: List[ColumnDefinition]) -> None:
    _validate_identifier(table_name)
    for col in columns:
        _validate_identifier(col.name)

    if _IS_PG:
        schema = _pg_schema(project_id)
        col_defs = [
            "id SERIAL PRIMARY KEY",
            "created_at TIMESTAMPTZ DEFAULT NOW()",
            "updated_at TIMESTAMPTZ",
        ]
        for col in columns:
            pg_type = _PG_TYPES[col.type]
            nullable = "" if col.nullable else " NOT NULL"
            default = f" DEFAULT {col.default}" if col.default else ""
            col_defs.append(f'"{col.name}" {pg_type}{nullable}{default}')
        ddl = f'CREATE TABLE IF NOT EXISTS "{schema}"."{table_name}" ({", ".join(col_defs)})'
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(ddl)
        finally:
            conn.close()
    else:
        col_defs = [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "created_at TEXT DEFAULT (datetime('now'))",
            "updated_at TEXT",
        ]
        for col in columns:
            sql_type = _SQLITE_TYPES[col.type]
            nullable = "" if col.nullable else " NOT NULL"
            default = f" DEFAULT {col.default}" if col.default else ""
            col_defs.append(f'"{col.name}" {sql_type}{nullable}{default}')
        ddl = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(col_defs)})'
        conn = _sqlite_conn(project_id)
        try:
            conn.execute(ddl)
            conn.commit()
        finally:
            conn.close()


def drop_table(project_id: str, table_name: str) -> None:
    _validate_identifier(table_name)
    if _IS_PG:
        schema = _pg_schema(project_id)
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(f'DROP TABLE IF EXISTS "{schema}"."{table_name}"')
        finally:
            conn.close()
    else:
        conn = _sqlite_conn(project_id)
        try:
            conn.execute(f'DROP TABLE IF EXISTS "{table_name}"')
            conn.commit()
        finally:
            conn.close()


def get_row_count(project_id: str, table_name: str) -> int:
    _validate_identifier(table_name)
    if _IS_PG:
        schema = _pg_schema(project_id)
        conn = _pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(f'SELECT COUNT(*) AS cnt FROM "{schema}"."{table_name}"')
                row = cur.fetchone()
                return row["cnt"] if row else 0
        except Exception:
            return 0
        finally:
            conn.close()
    else:
        conn = _sqlite_conn(project_id)
        try:
            row = conn.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()
            return row[0] if row else 0
        except Exception:
            return 0
        finally:
            conn.close()


def insert_row(project_id: str, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
    _validate_identifier(table_name)
    data.pop("id", None)
    data.pop("created_at", None)
    data.pop("updated_at", None)
    if not data:
        raise ValueError("No data provided")
    for key in data:
        _validate_identifier(key)

    cols = ", ".join(f'"{k}"' for k in data)
    values = list(data.values())

    if _IS_PG:
        schema = _pg_schema(project_id)
        placeholders = ", ".join("%s" for _ in data)
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f'INSERT INTO "{schema}"."{table_name}" ({cols}) VALUES ({placeholders}) RETURNING *',
                        values,
                    )
                    row = cur.fetchone()
                    return dict(row)
        finally:
            conn.close()
    else:
        placeholders = ", ".join("?" for _ in data)
        conn = _sqlite_conn(project_id)
        try:
            cursor = conn.execute(
                f'INSERT INTO "{table_name}" ({cols}) VALUES ({placeholders})', values
            )
            conn.commit()
            row = conn.execute(
                f'SELECT * FROM "{table_name}" WHERE id = ?', (cursor.lastrowid,)
            ).fetchone()
            return dict(row)
        finally:
            conn.close()


def query_rows(
    project_id: str,
    table_name: str,
    filters: Optional[Dict[str, Any]] = None,
    select: str = "*",
    limit: int = 100,
    offset: int = 0,
    order_by: Optional[str] = None,
    order_dir: str = "asc",
) -> List[Dict[str, Any]]:
    _validate_identifier(table_name)

    if select != "*":
        cols = ", ".join(f'"{c.strip()}"' for c in select.split(","))
    else:
        cols = "*"

    direction = "DESC" if order_dir.lower() == "desc" else "ASC"

    if _IS_PG:
        schema = _pg_schema(project_id)
        sql = f'SELECT {cols} FROM "{schema}"."{table_name}"'
        params: list = []
        if filters:
            conditions = []
            for key, val in filters.items():
                _validate_identifier(key)
                conditions.append(f'"{key}" = %s')
                params.append(val)
            sql += " WHERE " + " AND ".join(conditions)
        if order_by:
            _validate_identifier(order_by)
            sql += f' ORDER BY "{order_by}" {direction}'
        sql += " LIMIT %s OFFSET %s"
        params += [limit, offset]
        conn = _pg_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()
    else:
        sql = f'SELECT {cols} FROM "{table_name}"'
        params: list = []
        if filters:
            conditions = []
            for key, val in filters.items():
                _validate_identifier(key)
                conditions.append(f'"{key}" = ?')
                params.append(val)
            sql += " WHERE " + " AND ".join(conditions)
        if order_by:
            _validate_identifier(order_by)
            sql += f' ORDER BY "{order_by}" {direction}'
        sql += " LIMIT ? OFFSET ?"
        params += [limit, offset]
        conn = _sqlite_conn(project_id)
        try:
            rows = conn.execute(sql, params).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()


def update_row(
    project_id: str, table_name: str, row_id: int, data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    _validate_identifier(table_name)
    data.pop("id", None)
    data.pop("created_at", None)
    data.pop("updated_at", None)
    if not data:
        raise ValueError("No data to update")
    for key in data:
        _validate_identifier(key)

    values = list(data.values())

    if _IS_PG:
        schema = _pg_schema(project_id)
        set_clause = ", ".join(f'"{k}" = %s' for k in data) + ', "updated_at" = NOW()'
        values.append(row_id)
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f'UPDATE "{schema}"."{table_name}" SET {set_clause} WHERE id = %s RETURNING *',
                        values,
                    )
                    row = cur.fetchone()
                    return dict(row) if row else None
        finally:
            conn.close()
    else:
        set_clause = ", ".join(f'"{k}" = ?' for k in data) + ', "updated_at" = datetime(\'now\')'
        values.append(row_id)
        conn = _sqlite_conn(project_id)
        try:
            conn.execute(f'UPDATE "{table_name}" SET {set_clause} WHERE id = ?', values)
            conn.commit()
            row = conn.execute(
                f'SELECT * FROM "{table_name}" WHERE id = ?', (row_id,)
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def delete_row(project_id: str, table_name: str, row_id: int) -> bool:
    _validate_identifier(table_name)
    if _IS_PG:
        schema = _pg_schema(project_id)
        conn = _pg_conn()
        try:
            with conn:
                with conn.cursor() as cur:
                    cur.execute(
                        f'DELETE FROM "{schema}"."{table_name}" WHERE id = %s', (row_id,)
                    )
                    return cur.rowcount > 0
        finally:
            conn.close()
    else:
        conn = _sqlite_conn(project_id)
        try:
            cursor = conn.execute(
                f'DELETE FROM "{table_name}" WHERE id = ?', (row_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

"""Zera os registros de producao preservando schema, constraints e RLS."""

import os
import re
import sys

from sqlalchemy import text

from app import create_app, db


CONFIRMATION_PHRASE = "DELETE_ALL_PRODUCTION_DATA"


def quoted_table_name(table):
    schema = table.schema or "public"
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", schema):
        raise RuntimeError(f"Schema inseguro para reset: {schema!r}")
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table.name):
        raise RuntimeError(f"Tabela insegura para reset: {table.name!r}")
    return f'"{schema}"."{table.name}"'


if os.getenv("FLASK_ENV") != "production":
    print("Reset recusado: FLASK_ENV deve ser production.", file=sys.stderr)
    sys.exit(2)

if os.getenv("CONFIRM_DATABASE_RESET") != CONFIRMATION_PHRASE:
    print(
        f"Reset recusado: defina CONFIRM_DATABASE_RESET={CONFIRMATION_PHRASE}.",
        file=sys.stderr,
    )
    sys.exit(2)

app = create_app()

with app.app_context():
    if db.engine.dialect.name != "postgresql":
        print("Reset recusado: o destino nao e PostgreSQL.", file=sys.stderr)
        sys.exit(2)

    tables = list(db.metadata.sorted_tables)
    if not tables:
        print("Reset recusado: nenhuma tabela da aplicacao foi encontrada.", file=sys.stderr)
        sys.exit(2)

    qualified_tables = ", ".join(quoted_table_name(table) for table in tables)
    try:
        db.session.execute(text(f"TRUNCATE TABLE {qualified_tables} RESTART IDENTITY CASCADE"))
        db.session.commit()
        print(f"[SUCCESS] {len(tables)} tabelas foram zeradas; schema e RLS preservados.")
    except Exception as exc:
        db.session.rollback()
        print(f"[ERROR] Reset cancelado e transacao revertida: {exc}", file=sys.stderr)
        sys.exit(1)

"""Zera os registros de producao preservando schema, constraints e RLS."""

import os
import re
import sys

from sqlalchemy import text

from app import create_app, db


CONFIRMATION_PHRASE = "DELETE_ALL_PRODUCTION_DATA"


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

    table_names = [
        row[0] for row in db.session.execute(text("""
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)).all()
    ]
    if not table_names:
        print("Reset recusado: nenhuma tabela public foi encontrada.", file=sys.stderr)
        sys.exit(2)

    for table_name in table_names:
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
            raise RuntimeError(f"Tabela insegura para reset: {table_name!r}")
    qualified_tables = ", ".join(f'"public"."{table_name}"' for table_name in table_names)
    try:
        db.session.execute(text(f"TRUNCATE TABLE {qualified_tables} RESTART IDENTITY CASCADE"))
        db.session.commit()
        print(f"[SUCCESS] {len(table_names)} tabelas foram zeradas; schema e RLS preservados.")
    except Exception as exc:
        db.session.rollback()
        print(f"[ERROR] Reset cancelado e transacao revertida: {exc}", file=sys.stderr)
        sys.exit(1)

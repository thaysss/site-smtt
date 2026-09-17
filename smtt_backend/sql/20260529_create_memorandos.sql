CREATE TABLE IF NOT EXISTS memorandos (
    id SERIAL PRIMARY KEY,
    assunto VARCHAR(160) NOT NULL,
    corpo TEXT NOT NULL,
    remetente_id INTEGER NOT NULL,
    destinatario_id INTEGER NOT NULL,
    criado_em TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lido_em TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_memorandos_remetente_id
    ON memorandos (remetente_id);

CREATE INDEX IF NOT EXISTS ix_memorandos_destinatario_id
    ON memorandos (destinatario_id);

CREATE INDEX IF NOT EXISTS ix_memorandos_criado_em
    ON memorandos (criado_em);

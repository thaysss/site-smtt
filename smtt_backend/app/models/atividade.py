from datetime import datetime, timezone
from app.extensions import db


class AtividadeUsuario(db.Model):
    __tablename__ = 'atividades_usuarios'

    id = db.Column(db.Integer, primary_key=True)
    criado_em = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    usuario_id = db.Column(db.String(64), nullable=False, index=True)
    usuario_nome = db.Column(db.String(150), nullable=False)
    perfil = db.Column(db.String(50), nullable=False)
    metodo = db.Column(db.String(10), nullable=False)
    recurso = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        horario = self.criado_em
        if horario.tzinfo is None:
            horario = horario.replace(tzinfo=timezone.utc)
        return {"id": self.id, "criado_em": horario.isoformat(), "usuario_id": self.usuario_id,
                "usuario_nome": self.usuario_nome, "perfil": self.perfil,
                "metodo": self.metodo, "recurso": self.recurso, "status": self.status}

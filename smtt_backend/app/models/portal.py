# app/models/portal.py
from app.extensions import db
from datetime import datetime
from app.utils.timezone import get_brasilia_time

class AlertaTransito(db.Model):
    __tablename__ = 'alertas_transito'
    
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(255), nullable=False)
    rua_bairro = db.Column(db.String(150), nullable=False)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='Ativo')

    # Uma função para facilitar transformar o resultado em JSON depois
    def to_dict(self):
        return {
            "id": self.id,
            "descricao": self.descricao,
            "rua_bairro": self.rua_bairro,
            "status": self.status,
            "data_inicio": self.data_inicio.strftime("%d/%m/%Y %H:%M") if self.data_inicio else None
        }


class Noticia(db.Model):
    __tablename__ = 'noticias'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(255), nullable=False)
    subtitulo = db.Column(db.String(255))
    conteudo = db.Column(db.Text, nullable=False)
    categoria = db.Column(db.String(100), default='Geral')
    imagem_url = db.Column(db.String(255))
    criado_em = db.Column(db.DateTime, default=get_brasilia_time)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "subtitulo": self.subtitulo,
            "conteudo": self.conteudo,
            "categoria": self.categoria,
            "imagem_url": self.imagem_url,
            "criado_em": self.criado_em.strftime("%d/%m/%Y %H:%M") if self.criado_em else None
        }


class Estatistica(db.Model):
    __tablename__ = 'estatisticas'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    valor = db.Column(db.String(50), nullable=False)
    icone = db.Column(db.String(50), default='fa-chart-simple')
    ordem = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "valor": self.valor,
            "icone": self.icone,
            "ordem": self.ordem
        }
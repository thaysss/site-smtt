"""Restricted bridge for the spreadsheet's Apps Script (no citizen documents)."""
import hmac
import uuid
from datetime import datetime
from flask import Blueprint, current_app, jsonify, request
from app.extensions import db
from app.models.servicos import Protocolo, SolicitacaoEvento

sync_bp = Blueprint('eventos_sync', __name__, url_prefix='/api/integracoes/eventos')
FIELDS = {'nome_solicitante': 150, 'telefone': 20, 'data_evento': 50,
          'local_evento': 255, 'descricao': 2000}


class EventoPlanilha(db.Model):
    __tablename__ = 'eventos_planilha'
    chave = db.Column(db.String(36), primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('solicitacoes_eventos.id', ondelete='SET NULL'), unique=True, nullable=True)
    base = db.Column(db.JSON, nullable=False)


def shared(event):
    return {field: getattr(event, field) or '' for field in FIELDS}


@sync_bp.route('/sincronizar', methods=['POST'])
def sincronizar():
    secret = current_app.config.get('EVENTOS_SYNC_TOKEN', '')
    supplied = request.headers.get('Authorization', '').removeprefix('Bearer ')
    if len(secret) < 32 or not hmac.compare_digest(secret.encode('utf-8'), supplied.encode('utf-8')):
        return jsonify(erro='Integração não autorizada.'), 401
    if request.content_length and request.content_length > 2_000_000:
        return jsonify(erro='Lote muito grande.'), 413
    payload = request.get_json(silent=True) or {}
    rows = payload.get('eventos')
    if not isinstance(rows, list) or len(rows) > 1000:
        return jsonify(erro='Envie até 1000 eventos por lote.'), 400
    seen = set()
    try:
        for row in rows:
            key = row['chave']
            if str(uuid.UUID(key)) != key or key in seen:
                raise ValueError()
            seen.add(key)
            for field, limit in FIELDS.items():
                if not isinstance(row.get(field), str) or len(row[field]) > limit:
                    raise ValueError()
            if not row['nome_solicitante'].strip():
                raise ValueError()
            datetime.strptime(row['data_evento'], '%Y-%m-%dT%H:%M')
    except (ValueError, TypeError, KeyError, AttributeError):
        return jsonify(erro='Evento inválido: confira ID, responsável, data ISO e limites dos campos.'), 400
    # Serialize integration runs across workers. PostgreSQL lock lasts until commit.
    if db.engine.dialect.name == 'postgresql':
        db.session.execute(db.text('SELECT pg_advisory_xact_lock(731953027)'))
    conflicts = []
    for row in rows:
        link = db.session.get(EventoPlanilha, row['chave'])
        incoming = {field: row[field] for field in FIELDS}
        if link is None:
            protocol = Protocolo(numero_protocolo='GS' + uuid.uuid4().hex[:18],
                                 tipo_servico='Solicitação de Evento', status='Em Análise')
            db.session.add(protocol)
            db.session.flush()
            event = SolicitacaoEvento(protocolo_id=protocol.id, cpf_cnpj='', email='',
                                      caminho_arquivo='', **incoming)
            db.session.add(event)
            db.session.flush()
            link = EventoPlanilha(chave=row['chave'], evento_id=event.id, base=incoming)
            db.session.add(link)
        else:
            if link.evento_id is None:
                continue  # Tombstone: a planilha não deve recriar evento excluído.
            event = db.session.query(SolicitacaoEvento).filter_by(id=link.evento_id).with_for_update().one()
            current = shared(event)
            collisions = [f for f in FIELDS if incoming[f] != link.base.get(f, '')
                          and current[f] != link.base.get(f, '') and incoming[f] != current[f]]
            if collisions:
                conflicts.append({'chave': link.chave, 'campos': collisions})
                continue
            for field in FIELDS:
                if incoming[field] != link.base.get(field, ''):
                    setattr(event, field, incoming[field])
            link.base = shared(event)
    db.session.flush()
    links = {link.evento_id: link for link in EventoPlanilha.query.all()}
    result = []
    for event in SolicitacaoEvento.query.order_by(SolicitacaoEvento.id).all():
        link = links.get(event.id)
        if link is None:
            link = EventoPlanilha(chave=str(uuid.uuid4()), evento_id=event.id, base=shared(event))
            db.session.add(link)
        result.append({'chave': link.chave, **shared(event)})
    db.session.commit()
    deleted = [link.chave for link in EventoPlanilha.query.filter_by(evento_id=None).all()]
    response = jsonify(eventos=result, conflitos=conflicts, excluidos=deleted)
    response.headers['Cache-Control'] = 'no-store'
    return response

import logging
from flask import g, request
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from app.extensions import db
from app.models.atividade import AtividadeUsuario
from app.models.servidor import Servidor
from app.models.cidadao import Cidadao
from app.utils.cargos import cargo_das_claims


def registrar_atividade(response):
    # Persist only structured metadata, never bodies, passwords, tokens or query strings.
    if not request.path.startswith('/api/') or request.method == 'OPTIONS':
        return response
    if request.endpoint == 'atividades.listar_atividades':
        return response
    identidade = getattr(g, 'atividade_identidade', None)
    if identidade is None:
        try:
            verify_jwt_in_request(optional=True)
            claims = get_jwt()
        except Exception:
            return response
        if not claims:
            return response
        perfil = cargo_das_claims(claims)
        servidor = bool(perfil or claims.get('tipo') == 'troca_senha_admin')
        try:
            usuario = db.session.get(Servidor if servidor else Cidadao, int(claims['sub']))
        except (ValueError, TypeError, KeyError):
            return response
        if not usuario:
            return response
        identidade = (str(usuario.id), usuario.nome if servidor else usuario.nome_completo,
                      perfil or ('primeiro_acesso' if servidor else 'cidadao'))
    recurso = request.url_rule.rule if request.url_rule else '/api/desconhecido'
    for chave, valor in (request.view_args or {}).items():
        if isinstance(valor, int):
            recurso = recurso.replace('<int:' + chave + '>', str(valor))
    try:
        db.session.add(AtividadeUsuario(usuario_id=identidade[0], usuario_nome=identidade[1],
            perfil=identidade[2], metodo=request.method,
            recurso=recurso[:255],
            status=response.status_code))
        db.session.commit()
    except Exception:
        db.session.rollback()
        logging.getLogger('app.audit').exception('Falha ao registrar atividade do usuário')
    return response

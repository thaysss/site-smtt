from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.models.atividade import AtividadeUsuario
from app.utils.cargos import cargo_das_claims

atividades_bp = Blueprint('atividades', __name__, url_prefix='/api/auth/admin')


@atividades_bp.get('/atividades')
@jwt_required()
def listar_atividades():
    if cargo_das_claims(get_jwt()) != 'administrador':
        return jsonify({"erro": "Acesso negado. Requer privilégios de administrador."}), 403
    pagina = request.args.get('pagina', 1, type=int)
    if pagina is None or pagina < 1:
        return jsonify({"erro": "Página inválida."}), 400
    consulta = AtividadeUsuario.query
    usuario = request.args.get('usuario_id', '').strip()
    if usuario:
        consulta = consulta.filter(AtividadeUsuario.usuario_id == usuario, AtividadeUsuario.perfil != 'cidadao')
    resultado = consulta.order_by(AtividadeUsuario.criado_em.desc(), AtividadeUsuario.id.desc()).paginate(
        page=pagina, per_page=30, error_out=False)
    return jsonify({"itens": [item.to_dict() for item in resultado.items],
                    "pagina": pagina, "paginas": resultado.pages, "total": resultado.total})

# app/routes/auth.py
from flask import Blueprint, request, jsonify
import re
import secrets
from datetime import datetime, timedelta
from app.extensions import db
from app.models.cidadao import Cidadao, CodigoVerificacao
from app.services.email import enviar_codigo_verificacao
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from app.utils.cargos import CARGOS, cargo_das_claims, normalizar_cargo

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
# app/routes/auth.py

@auth_bp.route('/cadastro', methods=['POST'])
def cadastro_cidadao():
    dados = request.get_json(silent=True) or {}
    nome = str(dados.get('nome', '')).strip()
    cpf = re.sub(r'\D', '', str(dados.get('cpf', '')))
    email = str(dados.get('email', '')).strip().lower()
    telefone = str(dados.get('telefone', '')).strip()
    endereco = str(dados.get('endereco', '')).strip()
    senha = dados.get('senha', '')

    if not nome or len(cpf) != 11 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        return jsonify({"erro": "Informe nome, CPF e e-mail válidos."}), 400
    if len(nome) > 150 or len(email) > 100 or len(telefone) > 20 or len(endereco) > 255:
        return jsonify({"erro": "Um ou mais campos excedem o tamanho permitido."}), 400
    if not isinstance(senha, str) or len(senha) < 8 or len(senha) > 128:
        return jsonify({"erro": "A senha deve ter entre 8 e 128 caracteres."}), 400
    if Cidadao.query.filter((Cidadao.cpf == cpf) | (Cidadao.email == email)).first():
        return jsonify({"erro": "Não foi possível concluir o cadastro com os dados informados."}), 400

    CodigoVerificacao.query.filter_by(cpf=cpf, finalidade='cadastro', usado_em=None).update({"usado_em": datetime.now()})
    codigo = f'{secrets.randbelow(1_000_000):06d}'
    verificacao = CodigoVerificacao(
        finalidade='cadastro', cpf=cpf, email=email,
        codigo_hash=generate_password_hash(codigo), expira_em=datetime.now() + timedelta(minutes=10),
        nome_completo=nome, telefone=telefone, endereco=endereco,
        senha_hash=generate_password_hash(senha),
    )
    db.session.add(verificacao)
    db.session.commit()
    if not enviar_codigo_verificacao(email, nome, codigo, 'cadastro'):
        return jsonify({"erro": "Não foi possível enviar o código agora. Tente novamente."}), 503
    return jsonify({"mensagem": "Enviamos um código de verificação para o seu e-mail.", "verificacao_necessaria": True}), 202


def _codigo_ativo(cpf, finalidade):
    return CodigoVerificacao.query.filter_by(cpf=cpf, finalidade=finalidade, usado_em=None).order_by(CodigoVerificacao.id.desc()).first()


@auth_bp.route('/cadastro/confirmar', methods=['POST'])
def confirmar_cadastro():
    dados = request.get_json(silent=True) or {}
    cpf = re.sub(r'\D', '', str(dados.get('cpf', '')))
    codigo = re.sub(r'\D', '', str(dados.get('codigo', '')))
    verificacao = _codigo_ativo(cpf, 'cadastro')
    agora = datetime.now()
    if not verificacao or verificacao.expira_em < agora or verificacao.tentativas >= 5:
        return jsonify({"erro": "Código inválido ou expirado. Solicite um novo código."}), 400
    verificacao.tentativas += 1
    if len(codigo) != 6 or not check_password_hash(verificacao.codigo_hash, codigo):
        db.session.commit()
        return jsonify({"erro": "Código inválido ou expirado."}), 400
    if Cidadao.query.filter((Cidadao.cpf == cpf) | (Cidadao.email == verificacao.email)).first():
        return jsonify({"erro": "Não foi possível concluir o cadastro com os dados informados."}), 400
    cidadao = Cidadao(nome_completo=verificacao.nome_completo, cpf=cpf, email=verificacao.email,
                       telefone=verificacao.telefone, endereco=verificacao.endereco, senha_hash=verificacao.senha_hash)
    verificacao.usado_em = agora
    db.session.add(cidadao)
    db.session.commit()
    return jsonify({"mensagem": "E-mail confirmado. Sua conta foi criada com sucesso!"}), 201


@auth_bp.route('/senha/esqueci', methods=['POST'])
def esqueci_senha():
    dados = request.get_json(silent=True) or {}
    cpf = re.sub(r'\D', '', str(dados.get('cpf', '')))
    email = str(dados.get('email', '')).strip().lower()
    resposta = {"mensagem": "Se os dados estiverem cadastrados, enviaremos um código para o e-mail informado."}
    usuario = Cidadao.query.filter_by(cpf=cpf, email=email).first()
    if not usuario:
        return jsonify(resposta), 200
    CodigoVerificacao.query.filter_by(cpf=cpf, finalidade='recuperacao', usado_em=None).update({"usado_em": datetime.now()})
    codigo = f'{secrets.randbelow(1_000_000):06d}'
    db.session.add(CodigoVerificacao(finalidade='recuperacao', cpf=cpf, email=email,
                   codigo_hash=generate_password_hash(codigo), expira_em=datetime.now() + timedelta(minutes=10)))
    db.session.commit()
    enviar_codigo_verificacao(email, usuario.nome_completo, codigo, 'recuperacao')
    return jsonify(resposta), 200


@auth_bp.route('/senha/redefinir', methods=['POST'])
def redefinir_senha():
    dados = request.get_json(silent=True) or {}
    cpf = re.sub(r'\D', '', str(dados.get('cpf', '')))
    email = str(dados.get('email', '')).strip().lower()
    codigo = re.sub(r'\D', '', str(dados.get('codigo', '')))
    nova_senha = dados.get('nova_senha', '')
    if not isinstance(nova_senha, str) or not 8 <= len(nova_senha) <= 128:
        return jsonify({"erro": "A nova senha deve ter entre 8 e 128 caracteres."}), 400
    verificacao = _codigo_ativo(cpf, 'recuperacao')
    agora = datetime.now()
    if not verificacao or verificacao.email != email or verificacao.expira_em < agora or verificacao.tentativas >= 5:
        return jsonify({"erro": "Código inválido ou expirado. Solicite um novo código."}), 400
    verificacao.tentativas += 1
    if len(codigo) != 6 or not check_password_hash(verificacao.codigo_hash, codigo):
        db.session.commit()
        return jsonify({"erro": "Código inválido ou expirado."}), 400
    usuario = Cidadao.query.filter_by(cpf=cpf, email=email).first()
    if not usuario:
        return jsonify({"erro": "Código inválido ou expirado."}), 400
    usuario.set_senha(nova_senha)
    verificacao.usado_em = agora
    db.session.commit()
    return jsonify({"mensagem": "Senha redefinida com sucesso. Você já pode entrar."}), 200
@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json(silent=True) or {}
    cpf = re.sub(r'\D', '', str(dados.get('cpf', '')))
    senha = dados.get('senha', '')
    if len(cpf) != 11 or not isinstance(senha, str):
        return jsonify({"erro": "CPF ou senha inválidos"}), 401
    usuario = Cidadao.query.filter_by(cpf=cpf).first()
    if usuario and usuario.verificar_senha(senha):
        token = create_access_token(identity=str(usuario.id))
        return jsonify({"token": token, "nome": usuario.nome_completo}), 200
    return jsonify({"erro": "CPF ou senha inválidos"}), 401
# Adicione este import no topo do arquivo auth.py
from app.models.servidor import Servidor

# Adicione estas rotas no final do arquivo auth.py
@auth_bp.route('/admin/cadastro', methods=['POST'])
@jwt_required()
def cadastro_admin():
    claims = get_jwt()
    if cargo_das_claims(claims) != "administrador":
        return jsonify({"erro": "Acesso negado. Requer privilégios de administrador."}), 403

    dados = request.get_json(silent=True) or {}
    nome = str(dados.get('nome', '')).strip()
    matricula = str(dados.get('matricula', '')).strip()
    cargo_chave, cargo = normalizar_cargo(dados.get('cargo', 'analista'))
    senha = dados.get('senha', '')

    if not nome or not matricula or not senha:
        return jsonify({"erro": "Nome, matrícula e senha são obrigatórios."}), 400
    if not cargo_chave:
        return jsonify({"erro": "Cargo inválido.", "cargos": list(CARGOS.values())}), 400
    if len(nome) > 150 or len(matricula) > 20 or len(cargo) > 50:
        return jsonify({"erro": "Um ou mais campos excedem o tamanho permitido."}), 400
    if not isinstance(senha, str) or len(senha) < 8:
        return jsonify({"erro": "A senha deve ter pelo menos 8 caracteres."}), 400
    if Servidor.query.filter_by(matricula=matricula).first():
        return jsonify({"erro": "Matrícula já cadastrada"}), 400

    novo_servidor = Servidor(nome=nome, matricula=matricula, cargo=cargo)
    novo_servidor.set_senha(senha)
    db.session.add(novo_servidor)
    db.session.commit()
    return jsonify({"mensagem": "Servidor cadastrado com sucesso"}), 201

@auth_bp.route('/admin/login', methods=['POST'])
def login_admin():
    dados = request.get_json(silent=True) or {}
    login_recebido = str(dados.get('usuario', '')).strip()
    senha = dados.get('senha', '')
    if not login_recebido or len(login_recebido) > 20 or not isinstance(senha, str):
        return jsonify({"erro": "Matrícula ou senha inválidos"}), 401

    # 2. Procuramos esse valor na coluna 'matricula' do banco de dados
    servidor = Servidor.query.filter_by(matricula=login_recebido).first()

    if servidor and servidor.verificar_senha(senha):
        # Adiciona um "carimbo" no token identificando como admin
        cargo_chave, cargo = normalizar_cargo(servidor.cargo)
        if not cargo_chave:
            return jsonify({"erro": "O cargo deste servidor precisa ser atualizado por um administrador."}), 403
        token = create_access_token(identity=str(servidor.id), additional_claims={"role": cargo_chave, "cargo": cargo_chave})
        return jsonify({"token": token, "nome": servidor.nome, "cargo": cargo, "perfil": cargo_chave}), 200

    return jsonify({"erro": "Matrícula ou senha inválidos"}), 401

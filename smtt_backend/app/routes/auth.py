# app/routes/auth.py
from flask import Blueprint, request, jsonify
import re
from app.extensions import db
from app.models.cidadao import Cidadao
from flask_jwt_extended import create_access_token, jwt_required, get_jwt

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
    if Cidadao.query.filter_by(cpf=cpf).first():
        return jsonify({"erro": "Não foi possível concluir o cadastro com os dados informados."}), 400

    novo_cidadao = Cidadao(nome_completo=nome, cpf=cpf, email=email, telefone=telefone, endereco=endereco)
    novo_cidadao.set_senha(senha)
    db.session.add(novo_cidadao)
    db.session.commit()
    return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201
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
    if claims.get("role") != "admin":
        return jsonify({"erro": "Acesso negado. Requer privilégios de administrador."}), 403

    dados = request.get_json(silent=True) or {}
    nome = str(dados.get('nome', '')).strip()
    matricula = str(dados.get('matricula', '')).strip()
    cargo = str(dados.get('cargo', '')).strip() or 'Analista'
    senha = dados.get('senha', '')

    if not nome or not matricula or not senha:
        return jsonify({"erro": "Nome, matrícula e senha são obrigatórios."}), 400
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
        token = create_access_token(identity=str(servidor.id), additional_claims={"role": "admin"})
        return jsonify({"token": token, "nome": servidor.nome, "cargo": servidor.cargo}), 200

    return jsonify({"erro": "Matrícula ou senha inválidos"}), 401

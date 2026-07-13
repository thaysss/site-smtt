# app/routes/auth.py
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.cidadao import Cidadao
from flask_jwt_extended import create_access_token, jwt_required, get_jwt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
# app/routes/auth.py

@auth_bp.route('/cadastro', methods=['POST'])
def cadastro_cidadao():
    dados = request.get_json()
    
    if Cidadao.query.filter_by(cpf=dados['cpf']).first():
        return jsonify({"erro": "CPF já cadastrado"}), 400
        
    novo_cidadao = Cidadao(
        nome_completo=dados['nome'],
        cpf=dados['cpf'],
        email=dados['email'],
        telefone=dados.get('telefone', ''), # Pega o telefone (vazio se não vier)
        endereco=dados.get('endereco', '')  # Pega o endereço
    )
    novo_cidadao.set_senha(dados['senha'])
    
    db.session.add(novo_cidadao)
    db.session.commit()
    
    return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    usuario = Cidadao.query.filter_by(cpf=dados['cpf']).first()
    
    if usuario and usuario.verificar_senha(dados['senha']):
        # Cria o token JWT com o ID do usuário
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
        
    dados = request.get_json()
    if Servidor.query.filter_by(matricula=dados['matricula']).first():
        return jsonify({"erro": "Matrícula já cadastrada"}), 400
        
    novo_servidor = Servidor(nome=dados['nome'], matricula=dados['matricula'], cargo=dados.get('cargo', 'Analista'))
    novo_servidor.set_senha(dados['senha'])
    db.session.add(novo_servidor)
    db.session.commit()
    return jsonify({"mensagem": "Servidor cadastrado com sucesso"}), 201

@auth_bp.route('/admin/login', methods=['POST'])
def login_admin():
    dados = request.get_json()
    
    # 1. Pegamos a palavra 'usuario' que o React enviou
    login_recebido = dados.get('usuario') 
    
    # 2. Procuramos esse valor na coluna 'matricula' do banco de dados
    servidor = Servidor.query.filter_by(matricula=login_recebido).first()
    
    if servidor and servidor.verificar_senha(dados.get('senha')):
        # Adiciona um "carimbo" no token identificando como admin
        token = create_access_token(identity=str(servidor.id), additional_claims={"role": "admin"})
        return jsonify({"token": token, "nome": servidor.nome, "cargo": servidor.cargo}), 200
        
    return jsonify({"erro": "Matrícula ou senha inválidos"}), 401
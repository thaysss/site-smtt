import os
import re
import requests
# app/routes/servicos.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.servicos import Veiculo, AutoInfracao, RecursoMulta, Protocolo, RecursoAnexo
import random
from datetime import datetime
import uuid
from app.utils.timezone import get_brasilia_time
from app.utils.uploads import save_upload

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def renavam_valido(valor):
    renavam = re.sub(r'\D', '', str(valor or ''))
    if len(renavam) != 11 or len(set(renavam)) == 1:
        return False
    soma = sum(int(numero) * peso for numero, peso in zip(renavam[:10], (3, 2, 9, 8, 7, 6, 5, 4, 3, 2)))
    digito = (soma * 10) % 11
    return int(renavam[-1]) == (0 if digito == 10 else digito)

def consultar_renavam_da_placa(placa):
    token = os.environ.get('APIPLACAS_TOKEN', '').strip()
    if not token or token == 'placeholder':
        return None, 'A validação de RENAVAM está temporariamente indisponível.'
    try:
        response = requests.get(
            f'https://wdapi2.com.br/consulta/{placa}/{token}',
            headers={'Accept': 'application/json', 'User-Agent': 'SMTT-Propria/1.0'},
            timeout=7,
        )
        if response.status_code != 200:
            return None, 'Não foi possível validar a placa e o RENAVAM agora.'
        dados = response.json()
        if isinstance(dados.get('data'), dict):
            dados = dados['data']
        elif isinstance(dados.get('dados'), dict):
            dados = dados['dados']
        renavam = re.sub(r'\D', '', str(dados.get('renavam', '')))
        if renavam:
            renavam = renavam.zfill(11)
        return renavam or None, None
    except (requests.RequestException, ValueError, TypeError):
        return None, 'Não foi possível validar a placa e o RENAVAM agora.'

def allowed_file(arquivo):
    if not arquivo or not arquivo.filename or '.' not in arquivo.filename:
        return False
    extensao = arquivo.filename.rsplit('.', 1)[1].lower()
    if extensao not in ALLOWED_EXTENSIONS:
        return False
    cabecalho = arquivo.stream.read(12)
    arquivo.stream.seek(0)
    assinaturas_validas = (
        extensao == 'pdf' and cabecalho.startswith(b'%PDF-')
    ) or (
        extensao == 'png' and cabecalho.startswith(b'\x89PNG\r\n\x1a\n')
    ) or (
        extensao in {'jpg', 'jpeg'} and cabecalho.startswith(b'\xff\xd8\xff')
    )
    if not assinaturas_validas:
        return False
    arquivo.stream.seek(0, os.SEEK_END)
    tamanho = arquivo.stream.tell()
    arquivo.stream.seek(0)
    return 0 < tamanho <= 10 * 1024 * 1024

servicos_bp = Blueprint('servicos', __name__, url_prefix='/api/servicos')

# ==========================================
# 1. GESTÃO DE VEÍCULOS (Cidadão)
# ==========================================
@servicos_bp.route('/veiculos', methods=['GET'])
@jwt_required()
def listar_meus_veiculos():
    cidadao_id = get_jwt_identity()
    # Busca apenas os veículos vinculados a este cidadão
    veiculos = Veiculo.query.filter_by(cidadao_id=cidadao_id).all()
    
    return jsonify([{"id": v.id, "placa": v.placa, "renavam": v.renavam} for v in veiculos]), 200

@servicos_bp.route('/veiculos', methods=['POST'])
@jwt_required()
def vincular_veiculo():
    dados = request.get_json(silent=True) or {}
    cidadao_id = get_jwt_identity()
    
    placa = re.sub(r'[^A-Z0-9]', '', str(dados.get('placa', '')).upper())
    renavam = re.sub(r'\D', '', str(dados.get('renavam', '')))

    if not re.fullmatch(r'[A-Z]{3}[0-9][A-Z0-9][0-9]{2}', placa):
        return jsonify({"erro": "Informe uma placa válida."}), 400
    if not renavam_valido(renavam):
        return jsonify({"erro": "Informe um RENAVAM válido com 11 dígitos."}), 400

    renavam_api, erro_api = consultar_renavam_da_placa(placa)
    if erro_api:
        return jsonify({"erro": erro_api}), 503
    if not renavam_api:
        return jsonify({"erro": "A consulta da placa não retornou o RENAVAM; o veículo não foi cadastrado."}), 422
    if renavam_api != renavam:
        return jsonify({"erro": "O RENAVAM informado não pertence a esta placa."}), 400
    
    # 1. Procura o veículo APENAS pela placa
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    
    if veiculo:
        # Se o veículo já tem um dono e não é o usuário logado
        if veiculo.cidadao_id and str(veiculo.cidadao_id) != str(cidadao_id):
            return jsonify({"erro": "Este veículo já está vinculado a outro cidadão."}), 400
            
        # Se já está vinculado a este mesmo usuário
        if veiculo.cidadao_id and str(veiculo.cidadao_id) == str(cidadao_id):
            return jsonify({"erro": "Este veículo já está vinculado à sua conta."}), 400
            
        # Verifica se o Renavam confere (caso o banco já tenha um Renavam salvo pelo Detran)
        if veiculo.renavam and veiculo.renavam != renavam:
            return jsonify({"erro": "Renavam incorreto para esta placa."}), 400
            
        # Atualiza os dados: Grava o renavam e vincula o carro ao cidadão
        veiculo.renavam = renavam
        veiculo.cidadao_id = cidadao_id
    else:
        # Se o carro nunca tomou multa e não existe na base, cria ele já vinculado ao cidadão
        veiculo = Veiculo(
            placa=placa, 
            renavam=renavam, 
            cidadao_id=cidadao_id
        )
        db.session.add(veiculo)
        
    db.session.commit()
    return jsonify({"mensagem": "Veículo vinculado com sucesso ao seu perfil!"}), 200


# ==========================================
# 2. CONSULTA DE INFRAÇÕES
# ==========================================
@servicos_bp.route('/infracoes', methods=['GET'])
@jwt_required()
def listar_minhas_infracoes():
    cidadao_id = get_jwt_identity()
    
    # Descobre quais são os carros deste cidadão
    veiculos = Veiculo.query.filter_by(cidadao_id=cidadao_id).all()
    veiculo_ids = [v.id for v in veiculos]
    
    if not veiculo_ids:
        return jsonify([]), 200 # Não tem carros, não tem multas
        
    # Busca multas que pertençam aos carros dele
    infracoes = AutoInfracao.query.filter(AutoInfracao.veiculo_id.in_(veiculo_ids)).all()
    
    lista = []
    for inf in infracoes:
        # Busca se há um recurso associado a esta infração, priorizando o mais recente
        recurso = RecursoMulta.query.filter_by(auto_infracao_id=inf.id).order_by(RecursoMulta.id.desc()).first()
        recurso_info = None
        if recurso:
            recurso_info = {
                "id": recurso.id,
                "tipo_recurso": recurso.tipo_recurso,
                "protocolo": recurso.protocolo.numero_protocolo if recurso.protocolo else None,
                "resultado_julgamento": recurso.resultado_julgamento,
                "justificativa_julgamento": recurso.justificativa_julgamento,
                "anexo_resposta_jari": recurso.anexo_resposta_jari,
                "data_julgamento": recurso.data_julgamento.strftime("%d/%m/%Y") if recurso.data_julgamento else None
            }

        inf_dict = inf.to_dict()
        inf_dict["placa_veiculo"] = inf.veiculo.placa
        inf_dict["recurso"] = recurso_info
        if inf.valor_final:
            inf_dict["valor_final"] = f"{inf.valor_final:.2f}"
        lista.append(inf_dict)
        
    response = jsonify(lista)
    response.headers['Cache-Control'] = 'no-store'
    return response, 200


# ==========================================
# 3. ABERTURA DE RECURSO JARI
# ==========================================
@servicos_bp.route('/infracoes/<int:id>/recurso', methods=['POST'])
@jwt_required()
def abrir_recurso(id):
    cidadao_id = get_jwt_identity()
    infracao = AutoInfracao.query.get_or_404(id)
    
    # Valida se a infração pertence ao cidadão autenticado
    if not infracao.veiculo or str(infracao.veiculo.cidadao_id) != str(cidadao_id):
        return jsonify({"erro": "Acesso negado. Esta infração não pertence a um veículo cadastrado em seu perfil."}), 403
    
    print("DEBUG ABRIR RECURSO:")
    print("request.files:", request.files)
    print("request.form:", request.form)
    
    # Gera um número de protocolo único (Ex: REC202605271234)
    numero_protocolo = f"REC{get_brasilia_time().strftime('%Y%m%d')}{random.randint(1000,9999)}"
    
    # Cria o Protocolo Base
    novo_protocolo = Protocolo(
        numero_protocolo=numero_protocolo,
        cidadao_id=cidadao_id,
        tipo_servico='Recurso JARI',
        status='Em Análise'
    )
    db.session.add(novo_protocolo)
    db.session.flush() # Salva temporariamente para pegar o ID gerado
    
    # Cria o Recurso atrelado à multa e ao protocolo
    import os
    from werkzeug.utils import secure_filename

    try:
        # Lógica para salvar o arquivo do cidadão
        caminho_salvo = None
        arquivo = request.files.get('arquivo_recurso') # Pega o arquivo do React
        
        # Salva numa subpasta 'cidadao' para organizar
        
        if arquivo and arquivo.filename != '':
            if not allowed_file(arquivo):
                raise ValueError("O arquivo de recurso enviado possui uma extensão não permitida. Apenas PDF, PNG, JPG e JPEG são permitidos.")
            ext = arquivo.filename.rsplit('.', 1)[1].lower() if '.' in arquivo.filename else 'pdf'
            nome_seguro = secure_filename(f"req_{numero_protocolo}_{uuid.uuid4().hex}.{ext}")
            caminho_salvo = save_upload(arquivo, f"cidadao/{nome_seguro}")
    
        # Captura o tipo de recurso enviado pelo cidadão
        tipo_recurso = request.form.get('tipo_recurso', 'Defesa Prévia')
    
        # Cria o Recurso vinculando o arquivo
        novo_recurso = RecursoMulta(
            auto_infracao_id=infracao.id,
            protocolo_id=novo_protocolo.id,
            tipo_recurso=tipo_recurso,
            resultado_julgamento='Em Análise',
            arquivo_recurso_cidadao=caminho_salvo  # 👉 Grava o link no banco!
        )
        db.session.add(novo_recurso)
        db.session.flush() # Sincroniza para obter o ID do recurso para os anexos
    
        # Lógica para salvar múltiplos arquivos adicionais
        arquivos_adicionais = []
        for key in request.files:
            if key.startswith('arquivos'):
                arquivos_adicionais.extend(request.files.getlist(key))
                
        for idx, arq in enumerate(arquivos_adicionais):
            if arq and arq.filename != '':
                if not allowed_file(arq):
                    raise ValueError(f"O anexo '{arq.filename}' possui uma extensão não permitida. Apenas PDF, PNG, JPG e JPEG são permitidos.")
                ext = arq.filename.rsplit('.', 1)[1].lower() if '.' in arq.filename else 'pdf'
                nome_seguro_anexo = secure_filename(f"anexo_{numero_protocolo}_{idx}_{uuid.uuid4().hex}.{ext}")
                caminho_salvo_anexo = save_upload(arq, f"cidadao/{nome_seguro_anexo}")
                
                novo_anexo = RecursoAnexo(
                    recurso_id=novo_recurso.id,
                    caminho_arquivo=caminho_salvo_anexo,
                    nome_original=arq.filename
                )
                db.session.add(novo_anexo)
        
        # Atualiza a fase da infração dinamicamente
        infracao.fase_atual = f"Em Análise ({tipo_recurso})"
        
        db.session.commit()
    except ValueError as ve:
        return jsonify({"erro": str(ve)}), 400


    return jsonify({
        "mensagem": "Recurso enviado com sucesso!",
        "protocolo": numero_protocolo
    }), 201

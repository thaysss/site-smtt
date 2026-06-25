# app/routes/admin.py
import os
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models.servicos import Veiculo, AutoInfracao, RecursoMulta, Protocolo, TipoInfracaoCTB, SolicitacaoEvento, SolicitacaoAlvara
from app.models.portal import AlertaTransito, Noticia, Estatistica
from datetime import datetime
from app.utils.timezone import get_brasilia_time
import random

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ==========================================
# 1. INFRAÇÕES (Lançamento de Multas)
# ==========================================
@admin_bp.route('/infracoes', methods=['POST'])
def registrar_infracao():
    dados = request.get_json()
    placa = dados.get('placa', '').upper()
    codigo_ctb = dados.get('codigo_infracao')
    
    # 1. Verifica ou cria o Veículo
    veiculo = Veiculo.query.filter_by(placa=placa).first()
    if not veiculo:
        veiculo = Veiculo(placa=placa)
        db.session.add(veiculo)
        db.session.flush() 
        
    # Atualiza características físicas do veículo se fornecidas
    if dados.get('ano_fabricacao'):
        try:
            veiculo.ano_fabricacao = int(dados.get('ano_fabricacao'))
        except ValueError:
            pass
    if dados.get('marca_modelo'):
        veiculo.marca_modelo = dados.get('marca_modelo')
    if dados.get('cor'):
        veiculo.cor = dados.get('cor')
        
    # 2. Verifica ou cria o TIPO de Infração (Evita erro de Foreign Key no Supabase)
    tipo_infracao = TipoInfracaoCTB.query.filter_by(codigo_infracao=codigo_ctb).first()
    if not tipo_infracao:
        tipo_infracao = TipoInfracaoCTB(
            codigo_infracao=codigo_ctb,
            descricao=dados.get('descricao_infracao', 'Descrição não informada'),
            gravidade=dados.get('gravidade', 'Média'),
            pontos=int(dados.get('pontos', 4)),
            valor_base=float(dados.get('valor_final', 0.00))
        )
        db.session.add(tipo_infracao)
        db.session.flush()

    numero_gerado = f"AIT{random.randint(100000, 999999)}"
    
    try:
        data_hora_infracao = datetime.strptime(dados['data_hora_infracao'], "%Y-%m-%d %H:%M:%S")
        data_vencimento = None
        if dados.get('data_vencimento_defesa'):
            data_vencimento = datetime.strptime(dados['data_vencimento_defesa'], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"erro": "Formato de data inválido."}), 400
        
    # Parse de novas datas adicionais
    data_expedicao = None
    if dados.get('data_expedicao'):
        try:
            data_expedicao = datetime.strptime(dados['data_expedicao'], "%Y-%m-%d").date()
        except ValueError:
            pass
            
    data_vencimento_boleto = None
    if dados.get('data_vencimento_boleto'):
        try:
            data_vencimento_boleto = datetime.strptime(dados['data_vencimento_boleto'], "%Y-%m-%d").date()
        except ValueError:
            pass
    
    # 3. Grava o Auto de Infração
    nova_infracao = AutoInfracao(
        numero_ait=numero_gerado,
        veiculo_id=veiculo.id, 
        data_hora_infracao=data_hora_infracao,
        local_cometimento=dados.get('local_cometimento', 'Local não informado'),
        valor_final=dados.get('valor_final', 0.00),
        codigo_infracao=codigo_ctb,
        data_vencimento_defesa=data_vencimento,
        
        # Novos campos legais, fiscais e medições
        agente_aparelho=dados.get('agente_aparelho'),
        desdobramento=dados.get('desdobramento', '1'),
        medicao_aferida=dados.get('medicao_aferida'),
        medicao_considerada=dados.get('medicao_considerada'),
        medicao_regulamentada=dados.get('medicao_regulamentada'),
        codigo_renainf=dados.get('codigo_renainf'),
        numero_nait=dados.get('numero_nait'),
        numero_nip=dados.get('numero_nip'),
        data_expedicao=data_expedicao,
        linha_digitavel=dados.get('linha_digitavel'),
        nosso_numero=dados.get('nosso_numero'),
        data_vencimento_boleto=data_vencimento_boleto
    )
    
    db.session.add(nova_infracao)
    db.session.commit()
    
    return jsonify({
        "mensagem": "Infração registrada com sucesso pelo equipamento/agente!",
        "numero_ait": numero_gerado
    }), 201


@admin_bp.route('/infracoes', methods=['GET'])
def listar_infracoes():
    infracoes = AutoInfracao.query.order_by(AutoInfracao.criado_em.desc()).all()
    return jsonify([i.to_dict() for i in infracoes]), 200


# ==========================================
# 2. RECURSOS JARI (Análise e Julgamento)
# ==========================================
@admin_bp.route('/recursos', methods=['GET'])
def listar_recursos():
    recursos = RecursoMulta.query.all()
    resultado = []
    
    for r in recursos:
        resultado.append({
            "id": r.id,
            "tipo_recurso": r.tipo_recurso,
            "resultado_julgamento": r.resultado_julgamento,
            "arquivo_recurso_cidadao": r.arquivo_recurso_cidadao,
            "anexos": [{"caminho_arquivo": a.caminho_arquivo, "nome_original": a.nome_original} for a in r.anexos],
            "protocolo": {"numero_protocolo": r.protocolo.numero_protocolo} if r.protocolo else {},
            "infracao": {
                "numero_ait": r.infracao.numero_ait if r.infracao else "N/A",
                "placa_veiculo": r.infracao.veiculo.placa if r.infracao and r.infracao.veiculo else "N/A"
            }
        })
    return jsonify(resultado), 200

@admin_bp.route('/recursos/<int:id>/julgar', methods=['PUT'])
def julgar_recurso(id):
    recurso = RecursoMulta.query.get_or_404(id)
    
    # Como agora enviamos arquivo, usamos request.form em vez de request.get_json()
    decisao = request.form.get('decisao')
    justificativa = request.form.get('justificativa_jari')
    
    # LÓGICA DE UPLOAD DE ARQUIVO
    arquivo = request.files.get('arquivo_resposta')
    if arquivo and arquivo.filename != '':
        # 1. Cria a pasta 'uploads' dentro de 'app/static' caso não exista
        pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(pasta_destino, exist_ok=True)
        
        # 2. Limpa o nome do arquivo (tira espaços e caracteres especiais) e salva
        nome_seguro = secure_filename(f"resposta_{id}_{arquivo.filename}")
        caminho_arquivo = os.path.join(pasta_destino, nome_seguro)
        arquivo.save(caminho_arquivo)
        
        # 3. Guarda o link no banco de dados
        recurso.anexo_resposta_jari = f"/static/uploads/{nome_seguro}"

    # Atualiza as informações normais do julgamento
    recurso.resultado_julgamento = decisao
    recurso.justificativa_julgamento = justificativa
    recurso.data_julgamento = get_brasilia_time().date()
    
    if recurso.protocolo:
        recurso.protocolo.status = 'Concluído'
        
    if recurso.infracao:
        if decisao == 'Deferido':
            recurso.infracao.fase_atual = 'Defesa Deferida (Cancelada)'
        elif decisao == 'Indeferido':
            recurso.infracao.fase_atual = 'Defesa Indeferida'
            
    db.session.commit()
    
    return jsonify({"mensagem": "Julgamento e anexos registrados com sucesso!"}), 200


# ==========================================
# 3. VEÍCULOS (Detran Municipal)
# ==========================================
@admin_bp.route('/veiculos', methods=['POST'])
def registrar_veiculo_frota():
    dados = request.get_json()
    placa = dados.get('placa', '').upper()
    
    if Veiculo.query.filter_by(placa=placa).first():
        return jsonify({"erro": "Este veículo já está cadastrado na frota municipal."}), 400
        
    novo_veiculo = Veiculo(
        placa=placa,
        renavam=dados.get('renavam')
    )
    db.session.add(novo_veiculo)
    db.session.commit()
    
    return jsonify({"mensagem": "Veículo adicionado à base do município com sucesso!"}), 201


# ==========================================
# 4. GESTÃO DE ALERTAS (Vias Interditadas)
# ==========================================
@admin_bp.route('/alertas', methods=['GET'])
def listar_alertas_admin():
    alertas = AlertaTransito.query.order_by(AlertaTransito.id.desc()).all()
    return jsonify([a.to_dict() for a in alertas]), 200

@admin_bp.route('/alertas', methods=['POST'])
def publicar_alerta():
    dados = request.get_json()
    novo_alerta = AlertaTransito(
        rua_bairro=dados.get('rua_bairro'),
        descricao=dados.get('descricao'),
        data_inicio=get_brasilia_time(),
        status='Ativo'
    )
    db.session.add(novo_alerta)
    db.session.commit()
    return jsonify({"mensagem": "Alerta publicado com sucesso!"}), 201

@admin_bp.route('/alertas/<int:alerta_id>/resolver', methods=['PUT'])
def resolver_alerta(alerta_id):
    alerta = AlertaTransito.query.get(alerta_id)
    if not alerta:
        return jsonify({"erro": "Alerta não encontrado"}), 404
        
    alerta.status = 'Resolvido'
    alerta.data_fim = get_brasilia_time()
    db.session.commit()
    return jsonify({"mensagem": "Alerta resolvido e removido do site."}), 200

@admin_bp.route('/alertas/<int:alerta_id>', methods=['DELETE'])
def excluir_alerta(alerta_id):
    alerta = AlertaTransito.query.get(alerta_id)
    if not alerta:
        return jsonify({"erro": "Alerta não encontrado"}), 404
        
    db.session.delete(alerta)
    db.session.commit()
    return jsonify({"mensagem": "Alerta excluído permanentemente do banco."}), 200

# ==========================================
# 5. CONSULTA DE PLACA EXTERNA (APIPlacas / Mock)
# ==========================================
@admin_bp.route('/veiculos/consulta/<placa>', methods=['GET'])
def consultar_placa_externa(placa):
    placa_limpa = placa.upper().replace('-', '').strip()
    
    # Busca o token nas variáveis de ambiente
    token = os.environ.get('APIPLACAS_TOKEN', 'placeholder')
    
    # 1. MOCK / SIMULAÇÃO DE TESTE
    if not token or token == 'placeholder' or token == '':
        print(f"[MOCK] Consultando placa {placa_limpa} sem token configurado.")
        
        # Simulação exata dos carros reais do usuário
        if placa_limpa == "QKV9D21":
            return jsonify({
                "marca_modelo": "I/CHARMING BULL KRC50",
                "cor": "PRETA",
                "ano_fabricacao": 2015,
                "renavam": "1125597916"
            }), 200
        elif placa_limpa == "QKZ1C12":
            return jsonify({
                "marca_modelo": "RENAULT/OROCH 16 EXP42",
                "cor": "CINZA",
                "ano_fabricacao": 2016,
                "renavam": "700320982"
            }), 200
        else:
            # Outros carros com dados realistas
            import random
            modelos = ["FIAT/UNO WAY 1.4", "CHEVROLET/ONIX 1.0T", "HYUNDAI/HB20 S", "TOYOTA/COROLLA XEI", "HONDA/CIVIC EXL"]
            cores = ["BRANCA", "PRETA", "PRATA", "VERMELHA", "AZUL", "CINZA"]
            return jsonify({
                "marca_modelo": random.choice(modelos),
                "cor": random.choice(cores),
                "ano_fabricacao": random.randint(2013, 2025),
                "renavam": f"00{random.randint(100000000, 999999999)}"
            }), 200
            
    # 2. CHAMADA REAL PARA A APIPLACAS
    import requests
    url = f"https://wdapi2.com.br/consulta/{placa_limpa}/{token}"
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=7)
        if response.status_code == 200:
            dados = response.json()
            
            # Normalização dos retornos da APIPlacas
            marca = dados.get('marca', '').strip().upper()
            modelo = dados.get('modelo', '').strip().upper()
            marca_modelo = f"{marca}/{modelo}".strip().replace('  ', ' ') if (marca and modelo) else dados.get('marca_modelo', '').upper()
            
            cor = dados.get('cor', '').strip().upper()
            
            # Tenta pegar ano de fabricação ou ano do modelo
            ano = dados.get('ano', dados.get('ano_fabricacao', dados.get('anoFabricacao')))
            try:
                ano_fabricacao = int(ano) if ano else None
            except (ValueError, TypeError):
                ano_fabricacao = None
                
            renavam = dados.get('renavam', '')
            
            return jsonify({
                "marca_modelo": marca_modelo,
                "cor": cor,
                "ano_fabricacao": ano_fabricacao,
                "renavam": renavam
            }), 200
        else:
            # Caso dê erro de cota ou token inválido, fallback para simulação
            print(f"[APIPlacas ERROR] Código {response.status_code}. Retornando fallback mock.")
            return jsonify({
                "marca_modelo": "FORD/KA SE 1.0",
                "cor": "BRANCA",
                "ano_fabricacao": 2018,
                "renavam": "00827361928"
            }), 200
            
    except Exception as e:
        print(f"[APIPlacas EXCEPTION] {str(e)}. Retornando fallback mock.")
        # Conexão falhou, fallback
        return jsonify({
            "marca_modelo": "VOLKSWAGEN/GOL 1.6",
            "cor": "PRATA",
            "ano_fabricacao": 2017,
            "renavam": "00736182917"
        }), 200


@admin_bp.route('/eventos', methods=['GET'])
def listar_eventos_admin():
    eventos = SolicitacaoEvento.query.order_by(SolicitacaoEvento.id.desc()).all()
    resultado = [e.to_dict() for e in eventos]
    return jsonify(resultado), 200


@admin_bp.route('/eventos/<int:id>/julgar', methods=['PUT'])
def julgar_evento(id):
    evento = SolicitacaoEvento.query.get_or_404(id)
    
    if request.is_json:
        dados = request.get_json()
        decisao = dados.get('decisao')
        parecer = dados.get('justificativa_jari')
    else:
        decisao = request.form.get('decisao')
        parecer = request.form.get('justificativa_jari')
        
    if not decisao:
        return jsonify({"erro": "A decisão é obrigatória."}), 400
        
    evento.resposta_analise = parecer or f"Solicitação avaliada pela equipe e classificada como: {decisao}."
    
    if evento.protocolo:
        evento.protocolo.status = decisao # Ex: 'Aprovado' ou 'Negado'
        
    db.session.commit()
    return jsonify({"mensagem": "Solicitação de evento julgada com sucesso!"}), 200


@admin_bp.route('/alvaras', methods=['GET'])
def listar_alvaras_admin():
    alvaras = SolicitacaoAlvara.query.order_by(SolicitacaoAlvara.id.desc()).all()
    resultado = [a.to_dict() for a in alvaras]
    return jsonify(resultado), 200


@admin_bp.route('/alvaras/<int:id>/julgar', methods=['PUT'])
def julgar_alvara(id):
    alvara = SolicitacaoAlvara.query.get_or_404(id)
    
    # Se vier multipart/form-data
    decisao = request.form.get('decisao')
    parecer = request.form.get('justificativa_jari')
    
    # Se vier JSON
    if not decisao and request.is_json:
        dados = request.get_json()
        decisao = dados.get('decisao')
        parecer = dados.get('justificativa_jari')
        
    if not decisao:
        return jsonify({"erro": "A decisão é obrigatória."}), 400
        
    alvara.resposta_analise = parecer or f"Solicitação avaliada pela equipe e classificada como: {decisao}."
    
    # Salvar arquivo do alvará emitido se aprovado e enviado
    if decisao == 'Aprovado' and 'arquivo_alvara' in request.files:
        file = request.files['arquivo_alvara']
        if file and file.filename != '':
            numero_proto = alvara.protocolo.numero_protocolo if alvara.protocolo else f"ALV{id}"
            nome_seguro = secure_filename(f"emitido_{numero_proto}_{file.filename}")
            pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'emitidos')
            os.makedirs(pasta_destino, exist_ok=True)
            caminho_arquivo = os.path.join(pasta_destino, nome_seguro)
            file.save(caminho_arquivo)
            alvara.caminho_alvara_emitido = f"/static/uploads/emitidos/{nome_seguro}"
            
    if alvara.protocolo:
        alvara.protocolo.status = decisao
        
    db.session.commit()
    return jsonify({"mensagem": "Solicitação de alvará/permissionário julgada com sucesso!"}), 200


@admin_bp.route('/noticias', methods=['GET'])
def listar_noticias_admin():
    noticias = Noticia.query.order_by(Noticia.criado_em.desc()).all()
    return jsonify([n.to_dict() for n in noticias]), 200


@admin_bp.route('/noticias', methods=['POST'])
def criar_noticia_admin():
    titulo = request.form.get('titulo')
    subtitulo = request.form.get('subtitulo', '')
    conteudo = request.form.get('conteudo')
    categoria = request.form.get('categoria', 'Geral')
    
    if not titulo or not conteudo:
        return jsonify({"erro": "Título e Conteúdo são obrigatórios."}), 400
        
    imagem_url = None
    if 'imagem' in request.files:
        file = request.files['imagem']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            ext = os.path.splitext(filename)[1]
            filename = f"news_{int(datetime.now().timestamp())}_{random.randint(1000,9999)}{ext}"
            
            pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'noticias')
            os.makedirs(pasta_destino, exist_ok=True)
            
            file.save(os.path.join(pasta_destino, filename))
            imagem_url = f"/static/uploads/noticias/{filename}"
            
    noticia = Noticia(
        titulo=titulo,
        subtitulo=subtitulo,
        conteudo=conteudo,
        categoria=categoria,
        imagem_url=imagem_url
    )
    db.session.add(noticia)
    db.session.commit()
    
    return jsonify({"mensagem": "Notícia criada com sucesso!", "noticia": noticia.to_dict()}), 201


@admin_bp.route('/noticias/<int:id>', methods=['PUT'])
def editar_noticia_admin(id):
    noticia = Noticia.query.get_or_404(id)
    
    titulo = request.form.get('titulo')
    subtitulo = request.form.get('subtitulo', '')
    conteudo = request.form.get('conteudo')
    categoria = request.form.get('categoria', 'Geral')
    
    if titulo:
        noticia.titulo = titulo
    if subtitulo is not None:
        noticia.subtitulo = subtitulo
    if conteudo:
        noticia.conteudo = conteudo
    if categoria:
        noticia.categoria = categoria
        
    if 'imagem' in request.files:
        file = request.files['imagem']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            ext = os.path.splitext(filename)[1]
            filename = f"news_{int(datetime.now().timestamp())}_{random.randint(1000,9999)}{ext}"
            
            pasta_destino = os.path.join(current_app.root_path, 'static', 'uploads', 'noticias')
            os.makedirs(pasta_destino, exist_ok=True)
            
            file.save(os.path.join(pasta_destino, filename))
            noticia.imagem_url = f"/static/uploads/noticias/{filename}"
            
    db.session.commit()
    return jsonify({"mensagem": "Notícia editada com sucesso!", "noticia": noticia.to_dict()}), 200


@admin_bp.route('/noticias/<int:id>', methods=['DELETE'])
def excluir_noticia_admin(id):
    noticia = Noticia.query.get_or_404(id)
    
    if noticia.imagem_url:
        filepath = os.path.join(current_app.root_path, noticia.imagem_url.lstrip('/'))
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Erro ao deletar imagem física: {e}")
                
    db.session.delete(noticia)
    db.session.commit()
    return jsonify({"mensagem": "Notícia excluída com sucesso!"}), 200

# ==========================================
# 6. GESTÃO DE ESTATÍSTICAS (Painel Admin)
# ==========================================
@admin_bp.route('/estatisticas', methods=['GET'])
def listar_estatisticas_admin():
    estatisticas = Estatistica.query.order_by(Estatistica.ordem.asc(), Estatistica.id.asc()).all()
    return jsonify([e.to_dict() for e in estatisticas]), 200

@admin_bp.route('/estatisticas', methods=['POST'])
def criar_estatistica_admin():
    dados = request.get_json()
    titulo = dados.get('titulo')
    valor = dados.get('valor')
    icone = dados.get('icone', 'fa-chart-simple')
    try:
        ordem = int(dados.get('ordem', 0))
    except (TypeError, ValueError):
        ordem = 0
        
    if not titulo or not valor:
        return jsonify({"erro": "Título e Valor são obrigatórios."}), 400
        
    nova_estatistica = Estatistica(
        titulo=titulo,
        valor=valor,
        icone=icone,
        ordem=ordem
    )
    db.session.add(nova_estatistica)
    db.session.commit()
    return jsonify({"mensagem": "Estatística cadastrada com sucesso!", "estatistica": nova_estatistica.to_dict()}), 201

@admin_bp.route('/estatisticas/<int:id>', methods=['PUT'])
def editar_estatistica_admin(id):
    estatistica = Estatistica.query.get_or_404(id)
    dados = request.get_json()
    
    titulo = dados.get('titulo')
    valor = dados.get('valor')
    icone = dados.get('icone')
    ordem = dados.get('ordem')
    
    if titulo:
        estatistica.titulo = titulo
    if valor:
        estatistica.valor = valor
    if icone:
        estatistica.icone = icone
    if ordem is not None:
        try:
            estatistica.ordem = int(ordem)
        except (TypeError, ValueError):
            pass
            
    db.session.commit()
    return jsonify({"mensagem": "Estatística atualizada com sucesso!", "estatistica": estatistica.to_dict()}), 200

@admin_bp.route('/estatisticas/<int:id>', methods=['DELETE'])
def excluir_estatistica_admin(id):
    estatistica = Estatistica.query.get_or_404(id)
    db.session.delete(estatistica)
    db.session.commit()
    return jsonify({"mensagem": "Estatística excluída com sucesso!"}), 200
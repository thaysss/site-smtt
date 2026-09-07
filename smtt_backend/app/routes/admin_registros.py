"""Edição e exclusão administrativa com campos explicitamente permitidos."""
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from flask import jsonify, request, current_app
import json
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.portal import AlertaTransito, Estatistica, Noticia
from app.models.servicos import AutoInfracao, Protocolo, RecursoMulta, SolicitacaoAlvara, SolicitacaoEvento, Veiculo, RecursoAnexo

RECURSOS = {
    'eventos': (SolicitacaoEvento, 'Solicitações de eventos', 'nome_solicitante cpf_cnpj email telefone data_evento local_evento descricao resposta_analise'),
    'alvaras': (SolicitacaoAlvara, 'Solicitações de alvarás', 'tipo_servico nome_solicitante cpf email telefone placa_veiculo fator_rh tem_auxiliar nome_auxiliar cpf_auxiliar resposta_analise'),
    'recursos': (RecursoMulta, 'Recursos de multas', 'tipo_recurso condutor_indicado_cpf condutor_indicado_cnh justificativa_julgamento'),
    'infracoes': (AutoInfracao, 'Infrações', 'numero_ait data_hora_infracao local_cometimento fase_atual valor_final data_vencimento_defesa agente_aparelho desdobramento medicao_aferida medicao_considerada medicao_regulamentada codigo_renainf numero_nait numero_nip data_expedicao linha_digitavel nosso_numero data_vencimento_boleto'),
    'veiculos': (Veiculo, 'Veículos', 'placa renavam ano_fabricacao marca_modelo cor uf'),
    'alertas': (AlertaTransito, 'Avisos de interdição', 'descricao rua_bairro data_inicio data_fim status'),
    'noticias': (Noticia, 'Notícias e ações', 'titulo subtitulo conteudo categoria'),
    'estatisticas': (Estatistica, 'Estatísticas', 'titulo valor icone ordem'),
    'protocolos': (Protocolo, 'Protocolos', 'numero_protocolo tipo_servico status'),
}
EDITAVEIS = {
    'eventos': 'resposta_analise',
    'alvaras': 'resposta_analise',
    'recursos': 'justificativa_julgamento',
}
ANEXOS = {
    'eventos': {'caminho_arquivo': 'Requerimento do evento'},
    'alvaras': {col.name: col.name.replace('caminho_', '').replace('_', ' ').capitalize() for col in SolicitacaoAlvara.__table__.columns if col.name.startswith('caminho_')},
    'recursos': {'arquivo_recurso_cidadao': 'Requerimento do cidadão', 'anexo_resposta_jari': 'Resposta da JARI'},
}


def anexos_registro(item, recurso):
    result = [{'nome': nome, 'label': label, 'url': getattr(item, nome), 'removivel': item.__table__.columns[nome].nullable} for nome, label in ANEXOS.get(recurso, {}).items()]
    if recurso == 'recursos':
        result.extend({'nome': f'anexo_{anexo.id}', 'label': anexo.nome_original or 'Anexo complementar', 'url': anexo.caminho_arquivo, 'removivel': True} for anexo in item.anexos)
        result.append({'nome': 'novo_anexo', 'label': 'Adicionar anexo complementar', 'url': None, 'removivel': False})
    return result


def preparar_anexos(item, recurso, removidos):
    slots = {slot['nome']: slot for slot in anexos_registro(item, recurso)}
    if not isinstance(removidos, list) or any(not isinstance(nome, str) or nome not in slots or not slots[nome]['removivel'] for nome in removidos):
        raise ValueError('Anexo inválido para remoção. O requerimento obrigatório pode ser substituído.')
    if set(request.files) - set(slots) or set(removidos) & set(request.files):
        raise ValueError('Informe somente os anexos desta solicitação, sem remover e substituir o mesmo arquivo.')
    uploads = []
    for nome, arquivo in request.files.items():
        filename = secure_filename(arquivo.filename or '')
        extension = Path(filename).suffix.lower()
        content = arquivo.read(10 * 1024 * 1024 + 1)
        valid = (extension == '.pdf' and content.startswith(b'%PDF-')) or (extension == '.png' and content.startswith(b'\x89PNG\r\n\x1a\n')) or (extension in ('.jpg', '.jpeg') and content.startswith(b'\xff\xd8\xff'))
        if not valid or len(content) > 10 * 1024 * 1024:
            raise ValueError('Envie arquivos PDF, PNG ou JPEG válidos de até 10 MB.')
        uploads.append((nome, filename, extension, content))
    return uploads


def aplicar_anexo(item, nome, url, filename=None):
    if nome == 'novo_anexo':
        db.session.add(RecursoAnexo(recurso_id=item.id, caminho_arquivo=url, nome_original=filename[:150]))
    elif nome.startswith('anexo_') and nome != 'anexo_resposta_jari':
        anexo = next(anexo for anexo in item.anexos if nome == f'anexo_{anexo.id}')
        if url is None:
            db.session.delete(anexo)
        else:
            anexo.caminho_arquivo = url
            anexo.nome_original = filename[:150]
    else:
        setattr(item, nome, url)

LABELS = {
    'cpf_cnpj': 'CPF / CNPJ', 'cpf': 'CPF', 'email': 'E-mail', 'descricao': 'Descrição',
    'resposta_analise': 'Resposta da análise', 'numero_ait': 'Número do AIT',
    'data_hora_infracao': 'Data e hora da infração', 'local_cometimento': 'Local da infração',
    'valor_final': 'Valor da multa (R$)', 'data_vencimento_defesa': 'Prazo da defesa',
    'titulo': 'Título', 'subtitulo': 'Subtítulo', 'conteudo': 'Conteúdo', 'icone': 'Ícone',
    'numero_protocolo': 'Número do protocolo', 'tipo_servico': 'Tipo de serviço',
    'justificativa_julgamento': 'Justificativa do julgamento',
}

def campos(model, nomes):
    result = []
    for nome in nomes.split():
        col = model.__table__.columns[nome]
        tipo = col.type.python_type
        result.append({
            'nome': nome, 'label': LABELS.get(nome, nome.replace('_', ' ').capitalize()),
            'tipo': ('checkbox' if tipo is bool else 'datetime-local' if tipo is datetime else 'date' if tipo is date else 'number' if tipo in (int, Decimal) else 'textarea' if isinstance(col.type, db.Text) else 'email' if nome == 'email' else 'text'),
            'obrigatorio': not col.nullable, 'maxLength': getattr(col.type, 'length', None),
            'step': '1' if tipo is int else '0.01',
        })
    return result

def serializar(item, nomes):
    result = {'id': item.id}
    for nome in nomes.split():
        valor = getattr(item, nome)
        result[nome] = valor.isoformat() if isinstance(valor, (date, datetime)) else str(valor) if isinstance(valor, Decimal) else valor
    protocolo = getattr(item, 'protocolo', None)
    result['referencia'] = protocolo.numero_protocolo if protocolo else item.veiculo.placa if isinstance(item, AutoInfracao) and item.veiculo else ''
    return result

def converter(col, valor):
    if valor is None or valor == '':
        if not col.nullable:
            raise ValueError('Campo obrigatório.')
        return None
    tipo = col.type.python_type
    if tipo is bool:
        if not isinstance(valor, bool):
            raise ValueError('Informe sim ou não.')
        return valor
    if tipo is datetime:
        parsed = datetime.fromisoformat(valor)
        if parsed.tzinfo is not None:
            raise ValueError('Informe a data e hora local.')
        return parsed
    if tipo is date:
        return date.fromisoformat(valor)
    if tipo is int:
        if isinstance(valor, bool) or str(int(valor)) != str(valor):
            raise ValueError('Informe um número inteiro.')
        return int(valor)
    if tipo is Decimal:
        result = Decimal(str(valor))
        if not result.is_finite() or result < 0 or result >= Decimal('100000000') or result != result.quantize(Decimal('0.01')):
            raise ValueError('Valor monetário inválido.')
        return result
    if not isinstance(valor, str):
        raise ValueError('Informe um texto.')
    valor = valor.strip()
    if not valor and not col.nullable:
        raise ValueError('Campo obrigatório.')
    limite = getattr(col.type, 'length', None)
    if limite and len(valor) > limite:
        raise ValueError('Texto muito longo.')
    return valor

def excluir_solicitacao(item):
    protocolo = item.protocolo
    db.session.delete(item)
    db.session.flush()
    if protocolo and not any(model.query.filter_by(protocolo_id=protocolo.id).first() for model in (RecursoMulta, SolicitacaoEvento, SolicitacaoAlvara)):
        db.session.delete(protocolo)

def registrar_gestao(bp):
    @bp.route('/registros', methods=['GET'])
    def catalogo_registros():
        return jsonify([{'id': key, 'label': value[1]} for key, value in RECURSOS.items()])

    @bp.route('/registros/<recurso>', methods=['GET'])
    def listar_registros(recurso):
        if recurso not in RECURSOS:
            return jsonify(erro='Categoria não encontrada.'), 404
        model, label, nomes = RECURSOS[recurso]
        return jsonify(label=label, campos=campos(model, EDITAVEIS.get(recurso, nomes)), registros=[dict(serializar(item, nomes), anexos=anexos_registro(item, recurso)) for item in model.query.order_by(model.id.desc()).all()])

    @bp.route('/registros/<recurso>/<int:id>', methods=['PUT', 'DELETE'])
    def alterar_registro(recurso, id):
        if recurso not in RECURSOS:
            return jsonify(erro='Categoria não encontrada.'), 404
        model, _, nomes = RECURSOS[recurso]
        item = db.session.get(model, id)
        if not item:
            return jsonify(erro='Registro não encontrado.'), 404
        arquivos_criados = []
        try:
            if request.method == 'DELETE':
                if isinstance(item, Veiculo) and item.multas_registradas:
                    return jsonify(erro='Exclua primeiro as infrações vinculadas a este veículo.'), 409
                if isinstance(item, AutoInfracao) and item.recurso_jari:
                    return jsonify(erro='Exclua primeiro os recursos vinculados a esta infração.'), 409
                if isinstance(item, Protocolo) and any(m.query.filter_by(protocolo_id=id).first() for m in (RecursoMulta, SolicitacaoEvento, SolicitacaoAlvara)):
                    return jsonify(erro='Exclua primeiro a solicitação vinculada a este protocolo.'), 409
                if isinstance(item, (RecursoMulta, SolicitacaoEvento, SolicitacaoAlvara)):
                    excluir_solicitacao(item)
                else:
                    db.session.delete(item)
            else:
                try:
                    dados = request.get_json(silent=True) if request.is_json else json.loads(request.form.get('dados', '{}'))
                except (ValueError, TypeError):
                    return jsonify(erro='Dados inválidos.'), 400
                if not isinstance(dados, dict):
                    return jsonify(erro='Dados inválidos.'), 400
                removidos = dados.pop('_remover_anexos', [])
                if (not dados and not request.files and not removidos) or set(dados) - set(EDITAVEIS.get(recurso, nomes).split()):
                    return jsonify(erro='Informe somente os campos editáveis do registro.'), 400
                try:
                    uploads = preparar_anexos(item, recurso, removidos)
                except ValueError as exc:
                    return jsonify(erro=str(exc)), 400
                valores = {}
                for nome, valor in dados.items():
                    try:
                        valores[nome] = converter(model.__table__.columns[nome], valor)
                    except (ValueError, TypeError, InvalidOperation, OverflowError):
                        return jsonify(erro=f'Valor inválido para {LABELS.get(nome, nome.replace("_", " "))}.'), 400
                for nome in ('placa', 'placa_veiculo', 'uf', 'numero_ait'):
                    if valores.get(nome):
                        valores[nome] = valores[nome].upper()
                if recurso == 'alertas' and valores.get('status', item.status) not in ('Ativo', 'Resolvido'):
                    return jsonify(erro='Status do aviso deve ser Ativo ou Resolvido.'), 400
                for nome, valor in valores.items():
                    setattr(item, nome, valor)
                if isinstance(item, AlertaTransito):
                    if item.status == 'Ativo':
                        item.data_fim = None
                    elif not item.data_fim:
                        from app.utils.timezone import get_brasilia_time
                        item.data_fim = get_brasilia_time()
                    if item.data_fim and item.data_fim < item.data_inicio:
                        db.session.rollback()
                        return jsonify(erro='O fim do aviso deve ser posterior ao início.'), 400
                for nome in removidos:
                    aplicar_anexo(item, nome, None)
                for nome, filename, extension, content in uploads:
                    pasta = Path(current_app.root_path) / 'static' / 'uploads' / 'revisoes'
                    pasta.mkdir(parents=True, exist_ok=True)
                    destino = pasta / f'{uuid.uuid4().hex}{extension}'
                    arquivos_criados.append(destino)
                    destino.write_bytes(content)
                    aplicar_anexo(item, nome, f'/static/uploads/revisoes/{destino.name}', filename)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            for arquivo in arquivos_criados:
                arquivo.unlink(missing_ok=True)
            return jsonify(erro='Há um valor duplicado ou registros vinculados. Verifique os dados.'), 409
        except Exception:
            db.session.rollback()
            for arquivo in arquivos_criados:
                arquivo.unlink(missing_ok=True)
            raise
        return jsonify(mensagem='Registro excluído.' if request.method == 'DELETE' else 'Alterações salvas.')

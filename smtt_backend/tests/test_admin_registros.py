import unittest
import io
import json
import tempfile
from datetime import datetime
from flask import Flask
from flask_jwt_extended import create_access_token
from sqlalchemy import event
from app.extensions import db, jwt
from app.models.cidadao import Cidadao
from app.routes.admin import admin_bp
from app.models.servicos import Veiculo, AutoInfracao, Protocolo, SolicitacaoEvento, SolicitacaoAlvara, RecursoMulta, RecursoAnexo
from app.models.portal import Estatistica, AlertaTransito, Noticia
from app.routes.admin_registros import RECURSOS


class TestAdminRegistros(unittest.TestCase):
    def setUp(self):
        self.upload_root = tempfile.TemporaryDirectory()
        self.app = Flask(__name__, root_path=self.upload_root.name)
        self.app.config.update(TESTING=True, SQLALCHEMY_DATABASE_URI='sqlite:///:memory:', JWT_SECRET_KEY='test-secret-key-at-least-thirty-two-characters')
        db.init_app(self.app)
        jwt.init_app(self.app)
        self.app.register_blueprint(admin_bp)
        self.context = self.app.app_context()
        self.context.push()
        event.listen(db.engine, 'connect', lambda connection, _: connection.execute('PRAGMA foreign_keys=ON'))
        db.create_all()
        self.client = self.app.test_client()
        self.headers = {'Authorization': 'Bearer ' + create_access_token(identity='1', additional_claims={'role': 'admin'})}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.upload_root.cleanup()

    def request(self, method, resource, id=None, **kwargs):
        path = '/api/admin/registros/' + resource + (f'/{id}' if id is not None else '')
        return getattr(self.client, method)(path, headers=self.headers, **kwargs)

    def seed(self):
        vehicle = Veiculo(placa='ABC1234')
        db.session.add(vehicle)
        db.session.flush()
        fine = AutoInfracao(numero_ait='AIT1', veiculo_id=vehicle.id, data_hora_infracao=datetime(2026, 1, 1), local_cometimento='Centro')
        protocol = Protocolo(numero_protocolo='P1', tipo_servico='Evento')
        db.session.add_all([fine, protocol])
        db.session.flush()
        request = SolicitacaoEvento(protocolo_id=protocol.id, nome_solicitante='Maria', cpf_cnpj='123', email='m@example.com', telefone='123', data_evento='2026-10-01', caminho_arquivo='/static/uploads/test.pdf')
        db.session.add(request)
        db.session.commit()
        return vehicle, fine, protocol, request

    def test_all_categories_require_admin(self):
        citizen = {'Authorization': 'Bearer ' + create_access_token(identity='2')}
        for category in RECURSOS:
            for method, suffix in [('get', ''), ('put', '/1'), ('delete', '/1')]:
                path = '/api/admin/registros/' + category + suffix
                self.assertEqual(getattr(self.client, method)(path).status_code, 401)
                self.assertEqual(getattr(self.client, method)(path, headers=citizen).status_code, 403)
            self.assertEqual(self.request('get', category).status_code, 200)

    def test_edit_request_preserves_upload_and_protocol(self):
        _, _, protocol, item = self.seed()
        response = self.request('put', 'eventos', item.id, json={'resposta_analise': 'Parecer corrigido'})
        self.assertEqual(response.status_code, 200)
        db.session.refresh(item)
        self.assertEqual(item.nome_solicitante, 'Maria')
        self.assertEqual(item.resposta_analise, 'Parecer corrigido')
        self.assertEqual(self.request('put', 'eventos', item.id, json={'nome_solicitante': 'Outro'}).status_code, 400)
        self.assertEqual(item.protocolo_id, protocol.id)
        self.assertEqual(item.caminho_arquivo, '/static/uploads/test.pdf')
        self.assertEqual(self.request('put', 'eventos', item.id, json={'protocolo_id': 99}).status_code, 400)

    def test_invalid_edit_does_not_partially_persist(self):
        _, fine, _, _ = self.seed()
        self.assertEqual(self.request('put', 'infracoes', fine.id, json={'local_cometimento': 'Outro', 'valor_final': '-1'}).status_code, 400)
        self.assertEqual(self.request('put', 'infracoes', fine.id, json={'data_hora_infracao': 'invalid'}).status_code, 400)
        db.session.refresh(fine)
        self.assertEqual(fine.local_cometimento, 'Centro')
        self.assertEqual(self.request('put', 'infracoes', fine.id, json={'valor_final': '0', 'data_hora_infracao': '2026-10-01T12:30:00'}).status_code, 200)

    def test_delete_request_removes_exclusive_protocol(self):
        _, _, protocol, item = self.seed()
        item_id, protocol_id = item.id, protocol.id
        self.assertEqual(self.request('delete', 'protocolos', protocol_id).status_code, 409)
        self.assertEqual(self.request('delete', 'eventos', item_id).status_code, 200)
        self.assertIsNone(db.session.get(SolicitacaoEvento, item_id))
        self.assertIsNone(db.session.get(Protocolo, protocol_id))

    def test_delete_dependencies_in_order(self):
        vehicle, fine, protocol, _ = self.seed()
        appeal = RecursoMulta(auto_infracao_id=fine.id, protocolo_id=protocol.id, tipo_recurso='Defesa')
        db.session.add(appeal)
        db.session.flush()
        attachment = RecursoAnexo(recurso_id=appeal.id, caminho_arquivo='/test.pdf')
        db.session.add(attachment)
        db.session.commit()
        ids = vehicle.id, fine.id, appeal.id, attachment.id, protocol.id
        self.assertEqual(self.request('delete', 'veiculos', ids[0]).status_code, 409)
        self.assertEqual(self.request('delete', 'infracoes', ids[1]).status_code, 409)
        self.assertEqual(self.request('delete', 'recursos', ids[2]).status_code, 200)
        self.assertIsNone(db.session.get(RecursoAnexo, ids[3]))
        self.assertIsNotNone(db.session.get(Protocolo, ids[4]))
        self.assertEqual(self.request('delete', 'infracoes', ids[1]).status_code, 200)
        self.assertEqual(self.request('delete', 'veiculos', ids[0]).status_code, 200)

    def test_duplicate_vehicle_rolls_back(self):
        vehicle, _, _, _ = self.seed()
        db.session.add(Veiculo(placa='XYZ9876'))
        db.session.commit()
        self.assertEqual(self.request('put', 'veiculos', vehicle.id, json={'placa': 'XYZ9876', 'cor': 'Azul'}).status_code, 409)
        db.session.refresh(vehicle)
        self.assertEqual(vehicle.placa, 'ABC1234')
        self.assertIsNone(vehicle.cor)

    def test_remaining_categories_edit_and_delete(self):
        protocol = Protocolo(numero_protocolo='AL1', tipo_servico='Alvará')
        db.session.add(protocol)
        db.session.flush()
        entries = [
            ('alvaras', SolicitacaoAlvara(protocolo_id=protocol.id, tipo_servico='Renovação', nome_solicitante='Maria', cpf='123', email='m@example.com', telefone='123'), {'resposta_analise': 'Parecer atualizado'}),
            ('alertas', AlertaTransito(descricao='Obra', rua_bairro='Centro', data_inicio=datetime(2026, 1, 1)), {'descricao': 'Obra concluída', 'status': 'Resolvido'}),
            ('noticias', Noticia(titulo='Ação', conteudo='Texto'), {'titulo': 'Ação atualizada'}),
            ('estatisticas', Estatistica(titulo='Total', valor='10'), {'valor': '20', 'ordem': '2'}),
        ]
        for category, item, changes in entries:
            db.session.add(item)
            db.session.commit()
            id = item.id
            self.assertEqual(self.request('put', category, id, json=changes).status_code, 200)
            self.assertEqual(self.request('delete', category, id).status_code, 200)
            self.assertIsNone(db.session.get(type(item), id))
        self.assertEqual(self.request('delete', 'eventos', 999).status_code, 404)
        self.assertEqual(self.request('get', 'unknown').status_code, 404)

    def test_only_responses_are_editable_for_requests(self):
        for category, expected in [('eventos', 'resposta_analise'), ('alvaras', 'resposta_analise'), ('recursos', 'justificativa_julgamento')]:
            data = self.request('get', category).get_json()
            self.assertEqual([field['nome'] for field in data['campos']], [expected])

    def test_replace_attachment_preserves_original_data(self):
        _, _, protocol, item = self.seed()
        response = self.request('put', 'eventos', item.id, data={
            'dados': json.dumps({'resposta_analise': 'Corrigido'}),
            'caminho_arquivo': (io.BytesIO(b'%PDF-1.4 test'), 'documento.pdf'),
        })
        self.assertEqual(response.status_code, 200)
        db.session.refresh(item)
        self.assertTrue(item.caminho_arquivo.startswith('/static/uploads/revisoes/'))
        self.assertEqual(item.nome_solicitante, 'Maria')
        self.assertEqual(protocol.status, 'Em Análise')
        self.assertEqual(item.resposta_analise, 'Corrigido')
        self.assertEqual(self.request('put', 'eventos', item.id, json={'_remover_anexos': ['caminho_arquivo']}).status_code, 400)
        self.assertEqual(self.request('put', 'eventos', item.id, json={'caminho_arquivo': '/arbitrary'}).status_code, 400)

    def test_invalid_upload_does_not_change_response(self):
        _, _, _, item = self.seed()
        previous = item.resposta_analise
        response = self.request('put', 'eventos', item.id, data={
            'dados': json.dumps({'resposta_analise': 'Não salvar'}),
            'caminho_arquivo': (io.BytesIO(b'<script>bad</script>'), 'invalid.pdf'),
        })
        self.assertEqual(response.status_code, 400)
        db.session.refresh(item)
        self.assertEqual(item.resposta_analise, previous)
        self.assertEqual(item.caminho_arquivo, '/static/uploads/test.pdf')

    def test_resource_attachments_and_decision_are_preserved(self):
        _, fine, protocol, _ = self.seed()
        appeal = RecursoMulta(auto_infracao_id=fine.id, protocolo_id=protocol.id, tipo_recurso='Defesa', resultado_julgamento='Deferido')
        db.session.add(appeal)
        db.session.commit()
        response = self.request('put', 'recursos', appeal.id, data={
            'dados': json.dumps({'justificativa_julgamento': 'Corrigido'}),
            'novo_anexo': (io.BytesIO(b'%PDF-1.4 test'), 'complemento.pdf'),
            'anexo_resposta_jari': (io.BytesIO(b'%PDF-1.4 test'), 'resposta.pdf'),
        })
        self.assertEqual(response.status_code, 200)
        db.session.refresh(appeal)
        self.assertEqual(appeal.resultado_julgamento, 'Deferido')
        self.assertEqual(len(appeal.anexos), 1)
        slot = f'anexo_{appeal.anexos[0].id}'
        self.assertEqual(self.request('put', 'recursos', appeal.id, json={'_remover_anexos': [slot, 'anexo_resposta_jari']}).status_code, 200)
        db.session.expire_all()
        self.assertEqual(len(appeal.anexos), 0)
        self.assertIsNone(appeal.anexo_resposta_jari)
        self.assertEqual(self.request('put', 'recursos', appeal.id, json={'_remover_anexos': ['anexo_99999']}).status_code, 400)

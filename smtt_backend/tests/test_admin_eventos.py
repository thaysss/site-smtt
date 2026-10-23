import unittest
from io import BytesIO
from unittest.mock import patch
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.servicos import Protocolo, SolicitacaoEvento


class TestAdminEventos(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'JWT_SECRET_KEY': 'test-secret-key-at-least-thirty-two-characters'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def headers(self, cargo):
        token = create_access_token(identity='gestor', additional_claims={'cargo': cargo})
        return {'Authorization': f'Bearer {token}'}

    def dados(self):
        return dict(nome_solicitante='Responsável', cpf_cnpj='123.456.789-01', email='gestor@example.com', telefone='79999999999', data_evento='2026-11-10T14:30', local_evento='Praça central', descricao='Evento cultural', arquivo=(BytesIO(b'%PDF-1.4\nexample'), 'requerimento.pdf'))

    @patch('app.routes.admin.save_upload', return_value='/static/uploads/eventos/teste.pdf')
    def test_criar_e_listar_com_cargos_autorizados(self, upload):
        for cargo in ('administrador', 'supervisor', 'analista'):
            resposta = self.client.post('/api/admin/eventos', data=self.dados(), headers=self.headers(cargo))
            self.assertEqual(resposta.status_code, 201, resposta.get_json())
            registro = resposta.get_json()['registro']
            self.assertLessEqual(len(registro['numero_protocolo']), 20)
            self.assertEqual(registro['status'], 'Em Análise')
            self.assertEqual(registro['cpf_cnpj'], '12345678901')
            self.assertEqual(registro['data_evento'], '2026-11-10T14:30')
        self.assertEqual(SolicitacaoEvento.query.count(), 3)
        self.assertEqual(Protocolo.query.count(), 3)
        self.assertEqual(len(self.client.get('/api/admin/eventos', headers=self.headers('analista')).get_json()), 3)

    def test_bloqueia_sem_permissao(self):
        self.assertEqual(self.client.post('/api/admin/eventos', data=self.dados()).status_code, 401)
        self.assertEqual(self.client.post('/api/admin/eventos', data=self.dados(), headers=self.headers('agente_transito')).status_code, 403)
        self.assertEqual(Protocolo.query.count(), 0)

    @patch('app.routes.admin.save_upload')
    def test_rejeita_dados_e_anexos_invalidos(self, upload):
        for campo, valor in [('data_evento', 'inválida'), ('data_evento', '2026-11-10T14:30+00:00'), ('nome_solicitante', ' '), ('email', 'invalido'), ('cpf_cnpj', '123'), ('local_evento', 'x' * 256), ('arquivo', (BytesIO(b'invalido'), 'teste.pdf')), ('arquivo', None)]:
            dados = self.dados()
            dados[campo] = valor
            resposta = self.client.post('/api/admin/eventos', data=dados, headers=self.headers('supervisor'))
            self.assertEqual(resposta.status_code, 400, resposta.get_json())
        upload.assert_not_called()
        self.assertEqual(Protocolo.query.count(), 0)

    @patch('app.routes.admin.save_upload', side_effect=RuntimeError('storage unavailable'))
    def test_falha_de_upload_desfaz_protocolo(self, upload):
        resposta = self.client.post('/api/admin/eventos', data=self.dados(), headers=self.headers('supervisor'))
        self.assertEqual(resposta.status_code, 500)
        self.assertEqual(Protocolo.query.count(), 0)

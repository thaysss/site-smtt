import unittest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.portal import AlertaTransito


class TestAlertasPeriodo(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', 'JWT_SECRET_KEY': 'test-secret-key-at-least-thirty-two-characters'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        token = create_access_token(identity='admin', additional_claims={'cargo': 'administrador'})
        self.headers = {'Authorization': f'Bearer {token}'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_periodo_brasilia_e_resolucao_preserva_previsao(self):
        dados = {'rua_bairro': 'Centro', 'descricao': 'Interdição', 'interdicao_inicio': '2026-10-01T22:00', 'interdicao_fim': '2026-10-02T06:00'}
        self.assertEqual(self.client.post('/api/admin/alertas', json=dados, headers=self.headers).status_code, 201)
        alerta = AlertaTransito.query.one()
        publico = self.client.get('/api/public/alertas').get_json()[0]
        self.assertEqual(publico['interdicao_inicio'], '01/10/2026 22:00')
        self.assertEqual(publico['interdicao_fim'], '02/10/2026 06:00')
        self.assertEqual(publico['fuso_horario'], 'America/Sao_Paulo')
        self.assertEqual(self.client.put(f'/api/admin/alertas/{alerta.id}/resolver', headers=self.headers).status_code, 200)
        self.assertEqual(alerta.to_dict()['interdicao_fim'], '02/10/2026 06:00')

    def test_rejeita_periodos_invalidos(self):
        for inicio, fim in [('', ''), ('2026-10-01T10:00', '2026-10-01T09:00'), ('2026-10-01T10:00', '2026-10-01T10:00'), ('invalido', '2026-10-01T11:00')]:
            with self.subTest(inicio=inicio, fim=fim):
                resposta = self.client.post('/api/admin/alertas', headers=self.headers, json={'rua_bairro': 'Centro', 'descricao': 'Obras', 'interdicao_inicio': inicio, 'interdicao_fim': fim})
                self.assertEqual(resposta.status_code, 400)
        self.assertEqual(AlertaTransito.query.count(), 0)

    def test_descricao_longa_preservada(self):
        self.assertIsInstance(AlertaTransito.__table__.c.descricao.type, db.Text)
        descricao = 'Interdição temporária para realização de evento. ' * 30
        resposta = self.client.post('/api/admin/alertas', headers=self.headers, json={
            'rua_bairro': 'Avenida João Barbosa Porto', 'descricao': descricao,
            'interdicao_inicio': '2026-10-02T17:00', 'interdicao_fim': '2026-10-03T14:00',
        })
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(AlertaTransito.query.one().descricao, descricao)
        self.assertEqual(self.client.get('/api/public/alertas').get_json()[0]['descricao'], descricao)

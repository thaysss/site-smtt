import unittest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.servidor import Servidor
from app.models.atividade import AtividadeUsuario


class TestAtividades(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        self.admin = Servidor(nome='Administradora', matricula='audit-admin', cargo='Administrador', senha_temporaria=False)
        self.admin.set_senha('senha-original')
        self.servidor = Servidor(nome='Analista', matricula='audit-analista', cargo='Analista', senha_temporaria=False)
        self.servidor.set_senha('senha-original')
        db.session.add_all([self.admin, self.servidor])
        db.session.commit()
        self.headers = {'Authorization': 'Bearer ' + create_access_token(identity=str(self.admin.id), additional_claims={'role': 'administrador'})}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_reset_logged_without_password_and_requires_change(self):
        response = self.client.post(f'/api/auth/admin/servidores/{self.servidor.id}/senha', headers=self.headers,
            json={'nova_senha': 'segredo-temporario', 'confirmar_senha': 'segredo-temporario'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.servidor.senha_temporaria)
        log = AtividadeUsuario.query.one()
        self.assertEqual(log.usuario_nome, 'Administradora')
        self.assertEqual(log.status, 200)
        self.assertNotIn('segredo-temporario', str(log.to_dict()))
        response = self.client.get('/api/auth/admin/atividades', headers=self.headers)
        self.assertEqual(response.json['total'], 1)
        self.assertEqual(AtividadeUsuario.query.count(), 1)

    def test_login_and_failed_authenticated_operation_logged(self):
        response = self.client.post('/api/auth/admin/login', json={'usuario': 'audit-admin', 'senha': 'senha-original'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AtividadeUsuario.query.one().usuario_id, str(self.admin.id))
        response = self.client.post(f'/api/auth/admin/servidores/{self.servidor.id}/senha', headers=self.headers,
            json={'nova_senha': 'curta', 'confirmar_senha': 'curta'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(AtividadeUsuario.query.order_by(AtividadeUsuario.id.desc()).first().status, 400)

    def test_logs_restricted_and_paginated(self):
        for claims in [{}, {'role': 'analista'}, {'tipo': 'troca_senha_admin'}]:
            token = create_access_token(identity=str(self.servidor.id), additional_claims=claims)
            response = self.client.get('/api/auth/admin/atividades', headers={'Authorization': 'Bearer ' + token})
            self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get('/api/auth/admin/atividades').status_code, 401)
        self.client.get('/api/auth/admin/servidores', headers=self.headers)
        response = self.client.get('/api/auth/admin/atividades?pagina=2', headers=self.headers)
        self.assertEqual(response.json['itens'], [])
        self.assertEqual(response.json['total'], 1)
        response = self.client.get('/api/auth/admin/atividades?usuario_id=999', headers=self.headers)
        self.assertEqual(response.json['total'], 0)

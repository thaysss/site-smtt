# tests/test_admin_auth.py
import json
import unittest
from unittest.mock import patch
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.servidor import Servidor
from app.models.servicos import Veiculo
from app.routes.servicos import renavam_valido

class TestAdminAuthentication(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'
        })
        self.client = self.app.test_client()

        # Push application context
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Re-create database tables in memory
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_admin_endpoint_requires_auth(self):
        """Verify that accessing an admin endpoint without a token returns 401."""
        response = self.client.get('/api/admin/alertas')
        self.assertEqual(response.status_code, 401)
        
        data = json.loads(response.data)
        self.assertIn('erro', data)
        self.assertEqual(data['erro'], 'Autenticação necessária.')

    def test_admin_endpoint_rejects_citizen_token(self):
        """Verify that a standard citizen token (no admin role) returns 403 Forbidden."""
        # Generate token without admin claim
        citizen_token = create_access_token(identity="citizen-123")
        headers = {
            'Authorization': f'Bearer {citizen_token}'
        }
        
        response = self.client.get('/api/admin/alertas', headers=headers)
        self.assertEqual(response.status_code, 403)
        
        data = json.loads(response.data)
        self.assertIn('erro', data)
        self.assertIn('Acesso negado', data['erro'])

    def test_admin_endpoint_allows_admin_token(self):
        """Verify that a token with role='admin' claim is allowed access."""
        # Generate token with admin claim
        admin_token = create_access_token(identity="admin-123", additional_claims={"role": "admin"})
        headers = {
            'Authorization': f'Bearer {admin_token}'
        }
        
        response = self.client.get('/api/admin/alertas', headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Should return an empty list of alerts as DB is in-memory and empty
        data = json.loads(response.data)
        self.assertEqual(data, [])

    def test_admin_can_create_another_admin(self):
        token = create_access_token(identity="admin-123", additional_claims={"role": "admin"})
        response = self.client.post('/api/auth/admin/cadastro', headers={
            'Authorization': f'Bearer {token}'
        }, json={
            'nome': 'Nova Administradora',
            'matricula': ' 9876 ',
            'cargo': 'supervisor',
            'senha': 'senha-segura'
        })

        self.assertEqual(response.status_code, 201)
        servidor = Servidor.query.filter_by(matricula='9876').one()
        self.assertEqual(servidor.nome, 'Nova Administradora')
        self.assertEqual(servidor.cargo, 'Supervisor')
        self.assertTrue(servidor.verificar_senha('senha-segura'))

    def test_login_includes_server_profile(self):
        servidor = Servidor(nome='Agente Um', matricula='456', cargo='Agente de Trânsito')
        servidor.set_senha('senha-segura')
        db.session.add(servidor)
        db.session.commit()

        response = self.client.post('/api/auth/admin/login', json={'usuario': '456', 'senha': 'senha-segura'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['perfil'], 'agente_transito')

    def test_analyst_cannot_access_traffic_operations(self):
        token = create_access_token(identity='analista-1', additional_claims={'role': 'analista', 'cargo': 'analista'})
        headers = {'Authorization': f'Bearer {token}'}

        allowed = self.client.get('/api/admin/recursos', headers=headers)
        denied = self.client.get('/api/admin/infracoes', headers=headers)

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(denied.status_code, 403)

    def test_traffic_agent_cannot_access_analysis_operations(self):
        token = create_access_token(identity='agente-1', additional_claims={'role': 'agente_transito', 'cargo': 'agente_transito'})
        headers = {'Authorization': f'Bearer {token}'}

        allowed = self.client.get('/api/admin/infracoes', headers=headers)
        allowed_phase_update = self.client.put('/api/admin/infracoes/999', headers=headers, json={'fase_atual': 'Penalidade'})
        denied = self.client.get('/api/admin/recursos', headers=headers)

        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(allowed_phase_update.status_code, 404)
        self.assertEqual(denied.status_code, 403)

    @patch('requests.get')
    def test_traffic_agent_can_lookup_plate_using_external_api(self, requests_get):
        external_response = requests_get.return_value
        external_response.status_code = 200
        external_response.json.return_value = {
            'marca': 'Fiat', 'modelo': 'Uno', 'cor': 'Prata',
            'ano': '2020', 'renavam': '12345678901', 'uf': 'SE',
        }
        token = create_access_token(identity='agente-1', additional_claims={
            'role': 'agente_transito', 'cargo': 'agente_transito',
        })

        with patch.dict('os.environ', {'APIPLACAS_TOKEN': 'token-de-teste'}):
            response = self.client.get('/api/admin/veiculos/consulta/TNP3G15', headers={
                'Authorization': f'Bearer {token}',
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['marca_modelo'], 'FIAT/UNO')
        requests_get.assert_called_once()

    def test_create_admin_validates_required_fields_and_password(self):
        token = create_access_token(identity="admin-123", additional_claims={"role": "admin"})
        headers = {'Authorization': f'Bearer {token}'}

        missing_fields = self.client.post('/api/auth/admin/cadastro', headers=headers, json={})
        short_password = self.client.post('/api/auth/admin/cadastro', headers=headers, json={
            'nome': 'Servidor', 'matricula': '123', 'senha': 'curta'
        })

        self.assertEqual(missing_fields.status_code, 400)
        self.assertEqual(short_password.status_code, 400)
        self.assertIn('8 caracteres', short_password.get_json()['erro'])

    def test_renavam_check_digit(self):
        self.assertTrue(renavam_valido('12345678900'))
        self.assertFalse(renavam_valido('12345678901'))
        self.assertFalse(renavam_valido('00000000000'))

    @patch('app.routes.servicos.requests.get')
    def test_citizen_vehicle_registration_requires_matching_renavam(self, requests_get):
        requests_get.return_value.status_code = 200
        requests_get.return_value.json.return_value = {'renavam': '12345678900'}
        token = create_access_token(identity='1')
        headers = {'Authorization': f'Bearer {token}'}

        with patch.dict('os.environ', {'APIPLACAS_TOKEN': 'token-de-teste'}):
            mismatch = self.client.post('/api/servicos/veiculos', headers=headers, json={
                'placa': 'TNP3G15', 'renavam': '98765432103',
            })
            success = self.client.post('/api/servicos/veiculos', headers=headers, json={
                'placa': 'TNP3G15', 'renavam': '12345678900',
            })

        self.assertEqual(mismatch.status_code, 400)
        self.assertEqual(success.status_code, 200)
        self.assertEqual(Veiculo.query.filter_by(placa='TNP3G15').one().renavam, '12345678900')

    def test_production_cors_allows_official_frontend(self):
        with patch.dict('os.environ', {
            'FLASK_ENV': 'production',
            'CORS_ALLOWED_ORIGINS': 'https://site-smtt.vercel.app',
        }):
            app = create_app({
                'TESTING': True,
                'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            })
            response = app.test_client().options('/api/auth/admin/login', headers={
                'Origin': 'https://www.smttpropria.com.br',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get('Access-Control-Allow-Origin'),
            'https://www.smttpropria.com.br',
        )

    def test_production_cors_rejects_unknown_origin(self):
        with patch.dict('os.environ', {
            'FLASK_ENV': 'production',
            'CORS_ALLOWED_ORIGINS': 'https://site-smtt.vercel.app',
        }):
            app = create_app({
                'TESTING': True,
                'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            })
            response = app.test_client().options('/api/auth/admin/login', headers={
                'Origin': 'https://example.invalid',
                'Access-Control-Request-Method': 'POST',
            })

        self.assertIsNone(response.headers.get('Access-Control-Allow-Origin'))

if __name__ == '__main__':
    unittest.main()

# tests/test_admin_auth.py
import json
import unittest
from unittest.mock import patch
from datetime import timedelta
from flask_jwt_extended import create_access_token, decode_token
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
        self.assertTrue(servidor.senha_temporaria)

    def test_admin_password_reset_requires_change_on_next_login(self):
        for cargo in ['Analista', 'Administrador']:
            with self.subTest(cargo=cargo):
                servidor = Servidor(nome='Reset', matricula=cargo, cargo=cargo, senha_temporaria=False)
                servidor.set_senha('senha-anterior')
                db.session.add(servidor)
                db.session.commit()
                token = create_access_token(identity='admin-123', additional_claims={'role': 'admin'})
                response = self.client.post(f'/api/auth/admin/servidores/{servidor.id}/senha',
                    headers={'Authorization': f'Bearer {token}'},
                    json={'nova_senha': 'nova-temporaria', 'confirmar_senha': 'nova-temporaria'})
                self.assertEqual(response.status_code, 200)
                self.assertNotIn('senha_hash', response.get_json()['servidor'])
                self.assertTrue(servidor.senha_temporaria)
                self.assertFalse(servidor.verificar_senha('senha-anterior'))
                old = self.client.post('/api/auth/admin/login', json={'usuario': cargo, 'senha': 'senha-anterior'})
                self.assertEqual(old.status_code, 401)
                login = self.client.post('/api/auth/admin/login', json={'usuario': cargo, 'senha': 'nova-temporaria'})
                self.assertTrue(login.get_json()['troca_senha_obrigatoria'])
                changed = self.client.post('/api/auth/admin/primeiro-acesso/senha',
                    headers={'Authorization': "Bearer " + login.get_json()['token_troca_senha']},
                    json={'nova_senha': 'senha-definitiva', 'confirmar_senha': 'senha-definitiva'})
                self.assertEqual(changed.status_code, 200)
                self.assertFalse(servidor.senha_temporaria)

    def test_password_reset_rejects_unauthorized_and_invalid_requests(self):
        servidor = Servidor(nome='Reset', matricula='reset', cargo='Analista', senha_temporaria=False)
        servidor.set_senha('senha-anterior')
        db.session.add(servidor)
        db.session.commit()
        url = f'/api/auth/admin/servidores/{servidor.id}/senha'
        body = {'nova_senha': 'nova-temporaria', 'confirmar_senha': 'nova-temporaria'}
        self.assertEqual(self.client.post(url, json=body).status_code, 401)
        for claims in [{}, {'role': 'analista'}, {'role': 'supervisor'}, {'role': 'agente_transito'}, {'tipo': 'troca_senha_admin'}]:
            token = create_access_token(identity='1', additional_claims=claims)
            self.assertEqual(self.client.post(url, headers={'Authorization': f'Bearer {token}'}, json=body).status_code, 403)
        token = create_access_token(identity='admin-123', additional_claims={'role': 'admin'})
        headers = {'Authorization': f'Bearer {token}'}
        for invalid in [{}, [], ['senha'], {'nova_senha': 12345678}, {'nova_senha': 'curta'},
                        {'nova_senha': 'x' * 129}, {'nova_senha': 'nova-temporaria', 'confirmar_senha': 'diferente'}]:
            self.assertEqual(self.client.post(url, headers=headers, json=invalid).status_code, 400)
            self.assertTrue(servidor.verificar_senha('senha-anterior'))
            self.assertFalse(servidor.senha_temporaria)
        self.assertEqual(self.client.post('/api/auth/admin/servidores/999/senha', headers=headers, json=body).status_code, 404)

    def test_login_includes_server_profile(self):
        servidor = Servidor(nome='Agente Um', matricula='456', cargo='Agente de Trânsito', senha_temporaria=False)
        servidor.set_senha('senha-segura')
        db.session.add(servidor)
        db.session.commit()

        response = self.client.post('/api/auth/admin/login', json={'usuario': '456', 'senha': 'senha-segura'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['perfil'], 'agente_transito')
        claims = decode_token(response.get_json()['token'])
        self.assertEqual(claims['exp'] - claims['iat'], 8 * 60 * 60)

    def test_expired_admin_session_is_rejected(self):
        token = create_access_token(
            identity='admin-expired',
            additional_claims={'role': 'administrador'},
            expires_delta=timedelta(seconds=-1),
        )
        response = self.client.get('/api/admin/alertas', headers={
            'Authorization': f'Bearer {token}',
        })
        self.assertEqual(response.status_code, 401)

    def test_first_admin_login_requires_password_change(self):
        servidor = Servidor(nome='Primeiro Acesso', matricula='789', cargo='Analista', senha_temporaria=True)
        servidor.set_senha('senha-temporaria')
        db.session.add(servidor)
        db.session.commit()

        response = self.client.post('/api/auth/admin/login', json={
            'usuario': '789', 'senha': 'senha-temporaria',
        })

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['troca_senha_obrigatoria'])
        self.assertIn('token_troca_senha', data)
        claims = decode_token(data['token_troca_senha'])
        self.assertEqual(claims['exp'] - claims['iat'], 15 * 60)
        self.assertNotIn('token', data)

        blocked = self.client.get('/api/admin/alertas', headers={
            'Authorization': f"Bearer {data['token_troca_senha']}",
        })
        self.assertEqual(blocked.status_code, 403)

    def test_admin_can_change_temporary_password_and_receive_full_token(self):
        servidor = Servidor(nome='Primeiro Acesso', matricula='790', cargo='Analista', senha_temporaria=True)
        servidor.set_senha('senha-temporaria')
        db.session.add(servidor)
        db.session.commit()
        token = create_access_token(identity=str(servidor.id), additional_claims={'tipo': 'troca_senha_admin'})

        response = self.client.post('/api/auth/admin/primeiro-acesso/senha', headers={
            'Authorization': f'Bearer {token}',
        }, json={'nova_senha': 'nova-senha-segura', 'confirmar_senha': 'nova-senha-segura'})

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.get_json())
        self.assertEqual(response.get_json()['perfil'], 'analista')
        db.session.refresh(servidor)
        self.assertFalse(servidor.senha_temporaria)
        self.assertTrue(servidor.verificar_senha('nova-senha-segura'))

    def test_first_access_rejects_temporary_password_reuse(self):
        servidor = Servidor(nome='Primeiro Acesso', matricula='791', cargo='Analista', senha_temporaria=True)
        servidor.set_senha('senha-temporaria')
        db.session.add(servidor)
        db.session.commit()
        token = create_access_token(identity=str(servidor.id), additional_claims={'tipo': 'troca_senha_admin'})

        response = self.client.post('/api/auth/admin/primeiro-acesso/senha', headers={
            'Authorization': f'Bearer {token}',
        }, json={'nova_senha': 'senha-temporaria', 'confirmar_senha': 'senha-temporaria'})

        self.assertEqual(response.status_code, 400)
        self.assertTrue(servidor.senha_temporaria)

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

    def test_admin_can_list_and_update_servers(self):
        servidor = Servidor(nome='Servidor Antigo', matricula='100', cargo='Analista', senha_temporaria=False)
        servidor.set_senha('senha-segura')
        db.session.add(servidor)
        db.session.commit()
        token = create_access_token(identity='admin-externo', additional_claims={'role': 'administrador'})
        headers = {'Authorization': f'Bearer {token}'}

        listed = self.client.get('/api/auth/admin/servidores', headers=headers)
        updated = self.client.put(f'/api/auth/admin/servidores/{servidor.id}', headers=headers, json={
            'nome': 'Servidor Atualizado',
            'matricula': '101',
            'cargo': 'supervisor',
        })

        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.get_json()[0]['matricula'], '100')
        self.assertEqual(updated.status_code, 200)
        db.session.refresh(servidor)
        self.assertEqual(servidor.nome, 'Servidor Atualizado')
        self.assertEqual(servidor.matricula, '101')
        self.assertEqual(servidor.cargo, 'Supervisor')

    def test_server_update_rejects_duplicate_registration(self):
        primeiro = Servidor(nome='Primeiro', matricula='200', cargo='Analista', senha_temporaria=False)
        segundo = Servidor(nome='Segundo', matricula='201', cargo='Supervisor', senha_temporaria=False)
        primeiro.set_senha('senha-segura')
        segundo.set_senha('senha-segura')
        db.session.add_all([primeiro, segundo])
        db.session.commit()
        token = create_access_token(identity='admin-externo', additional_claims={'role': 'administrador'})

        response = self.client.put(f'/api/auth/admin/servidores/{segundo.id}', headers={
            'Authorization': f'Bearer {token}',
        }, json={'nome': 'Segundo', 'matricula': '200', 'cargo': 'supervisor'})

        self.assertEqual(response.status_code, 400)
        self.assertIn('Matrícula', response.get_json()['erro'])

    def test_admin_cannot_change_own_role(self):
        servidor = Servidor(nome='Administrador', matricula='300', cargo='Administrador', senha_temporaria=False)
        servidor.set_senha('senha-segura')
        db.session.add(servidor)
        db.session.commit()
        token = create_access_token(identity=str(servidor.id), additional_claims={'role': 'administrador'})

        response = self.client.put(f'/api/auth/admin/servidores/{servidor.id}', headers={
            'Authorization': f'Bearer {token}',
        }, json={'nome': 'Administrador', 'matricula': '300', 'cargo': 'analista'})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(servidor.cargo, 'Administrador')

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

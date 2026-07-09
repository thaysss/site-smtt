# tests/test_admin_auth.py
import json
import unittest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db

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

if __name__ == '__main__':
    unittest.main()

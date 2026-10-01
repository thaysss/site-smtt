from app import create_app, _rate_limit_buckets


def test_invalid_json():
    client = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'}).test_client()
    for body in ('[]', '"text"', '123', 'null', '{broken'):
        response = client.post('/api/auth/login', data=body, content_type='application/json')
        assert response.status_code == 400
        assert response.headers['X-Request-ID'] != '-'


def test_forwarded_header_cannot_bypass_rate_limit():
    _rate_limit_buckets.clear()
    client = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'}).test_client()
    try:
        for index in range(8):
            response = client.post('/api/auth/login', json={'cpf': 'invalid'}, headers={'X-Forwarded-For': f'192.0.2.{index}'})
            assert response.status_code == 401
        response = client.post('/api/auth/login', json={'cpf': 'invalid'}, headers={'X-Forwarded-For': '192.0.2.99'})
        assert response.status_code == 429
        assert response.headers['X-Request-ID'] != '-'
    finally:
        _rate_limit_buckets.clear()

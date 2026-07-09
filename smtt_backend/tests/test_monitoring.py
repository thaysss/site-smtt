# tests/test_monitoring.py
import json
import logging
import unittest
from flask import g
from app import create_app
from app.extensions import db
from app.utils.cache import cache_instance

class TestMonitoringAndDebugging(unittest.TestCase):
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
        cache_instance.clear()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_request_id_tracing(self):
        """Rule 1: Every endpoint must have a unique Request ID for traceability."""
        # Case A: Request without X-Request-ID (server generates it)
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertIn('X-Request-ID', response.headers)
        request_id_1 = response.headers['X-Request-ID']
        self.assertTrue(len(request_id_1) > 0)

        # Case B: Request with custom X-Request-ID (server carries it over)
        custom_id = "test-custom-request-id-123"
        response2 = self.client.get('/health', headers={'X-Request-ID': custom_id})
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(response2.headers.get('X-Request-ID'), custom_id)

    def test_health_check_endpoint(self):
        """Rule 4: Every service must have a Health Check with detailed status."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('details', data)
        self.assertIn('database', data['details'])
        self.assertIn('cache', data['details'])
        self.assertIn('system', data['details'])
        self.assertIn('uptime_seconds', data['details'])
        
        system_details = data['details']['system']
        self.assertIn('cpu_percent', system_details)
        self.assertIn('memory', system_details)
        self.assertIn('disk', system_details)

    def test_performance_metrics_endpoint(self):
        """Rule 7: Every service must have performance metrics like timing, memory, and CPU."""
        response = self.client.get('/metrics')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('process', data)
        self.assertIn('database', data)
        self.assertIn('cache', data)
        
        proc_metrics = data['process']
        self.assertIn('cpu_percent', proc_metrics)
        self.assertIn('memory_rss_bytes', proc_metrics)
        self.assertIn('threads_count', proc_metrics)

    def test_cache_hit_miss_tracking(self):
        """Rule 6: Every cache must have Hit/Miss Tracking."""
        metrics_before = cache_instance.get_metrics()
        self.assertEqual(metrics_before['hits'], 0)
        self.assertEqual(metrics_before['misses'], 0)

        # Trigger miss
        val1 = cache_instance.get("non-existent-key")
        self.assertIsNone(val1)
        
        metrics_after_miss = cache_instance.get_metrics()
        self.assertEqual(metrics_after_miss['hits'], 0)
        self.assertEqual(metrics_after_miss['misses'], 1)
        self.assertEqual(metrics_after_miss['hit_ratio'], 0.0)

        # Trigger hit
        cache_instance.set("existent-key", "some-value", timeout=10)
        val2 = cache_instance.get("existent-key")
        self.assertEqual(val2, "some-value")
        
        metrics_after_hit = cache_instance.get_metrics()
        self.assertEqual(metrics_after_hit['hits'], 1)
        self.assertEqual(metrics_after_hit['misses'], 1)
        self.assertEqual(metrics_after_hit['hit_ratio'], 0.5)

    def test_exception_handler_and_stack_trace(self):
        """Rule 2: Every error must have a complete Stack Trace with text."""
        # Create a dummy endpoint that raises an error
        @self.app.route('/test-error')
        def cause_error():
            raise ValueError("Test error message")

        response = self.client.get('/test-error')
        self.assertEqual(response.status_code, 500)
        
        data = json.loads(response.data)
        self.assertEqual(data['error'], 'ValueError')
        self.assertEqual(data['message'], 'Test error message')
        self.assertIn('request_id', data)
        self.assertIn('stack_trace', data)
        
        # Verify stack trace contains the text
        self.assertIn('ValueError: Test error message', data['stack_trace'])
        self.assertIn('cause_error', data['stack_trace'])

    def test_exception_handler_hides_stack_trace_in_production(self):
        """Verify that stack trace is omitted and error is sanitized when FLASK_ENV=production."""
        import os
        from unittest.mock import patch
        
        with patch.dict(os.environ, {"FLASK_ENV": "production"}):
            prod_app = create_app({
                'TESTING': True,
                'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'
            })
            
            @prod_app.route('/test-prod-error')
            def cause_prod_error():
                raise ValueError("Secret database credentials leaked")
                
            prod_client = prod_app.test_client()
            response = prod_client.get('/test-prod-error')
            
            self.assertEqual(response.status_code, 500)
            data = json.loads(response.data)
            
            self.assertEqual(data['message'], "Erro interno do servidor. Por favor, contate o suporte.")
            self.assertNotIn('stack_trace', data)
            self.assertIn('request_id', data)

if __name__ == '__main__':
    unittest.main()

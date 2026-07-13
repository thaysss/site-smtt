# app/routes/health.py
import time
import logging
import psutil
from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db
from app.utils.cache import cache_instance
from flask_jwt_extended import jwt_required, get_jwt

health_bp = Blueprint('health', __name__)

# Start timestamp will be set when the app starts
app_start_time = time.time()

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Detailed health check endpoint verifying db, cache, and system resource status."""
    status = "healthy"
    details = {}

    # 1. Check Database connection
    db_start = time.time()
    try:
        db.session.execute(text("SELECT 1"))
        db_elapsed = (time.time() - db_start) * 1000
        details["database"] = {
            "status": "up",
            "latency_ms": round(db_elapsed, 2)
        }
    except Exception as e:
        status = "unhealthy"
        details["database"] = {
            "status": "down",
            "error": str(e)
        }

    # 2. Check Cache functionality
    cache_start = time.time()
    try:
        cache_instance.set("health_check_ping", "ok", timeout=5)
        val = cache_instance.get("health_check_ping")
        cache_elapsed = (time.time() - cache_start) * 1000
        if val == "ok":
            details["cache"] = {
                "status": "up",
                "latency_ms": round(cache_elapsed, 2)
            }
        else:
            status = "unhealthy"
            details["cache"] = {
                "status": "degraded",
                "error": "Cache write/read mismatch"
            }
    except Exception as e:
        status = "unhealthy"
        details["cache"] = {
            "status": "down",
            "error": str(e)
        }

    # 3. System Metrics
    try:
        cpu_usage = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        details["system"] = {
            "cpu_percent": cpu_usage,
            "memory": {
                "percent": memory.percent,
                "used_mb": round(memory.used / (1024 * 1024), 2),
                "total_mb": round(memory.total / (1024 * 1024), 2)
            },
            "disk": {
                "percent": disk.percent,
                "used_gb": round(disk.used / (1024 * 1024 * 1024), 2),
                "total_gb": round(disk.total / (1024 * 1024 * 1024), 2)
            }
        }
    except Exception as e:
        details["system"] = {
            "status": "error",
            "error": str(e)
        }

    # 4. Service Uptime
    uptime_sec = time.time() - app_start_time
    details["uptime_seconds"] = round(uptime_sec, 2)

    code = 200 if status == "healthy" else 503
    return jsonify({
        "status": status,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "details": details
    }), code

@health_bp.route('/metrics', methods=['GET'])
@jwt_required()
def metrics():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"erro": "Acesso negado. Requer privilégios de administrador."}), 403
        
    """Performance metrics endpoint returning detailed process, db pool, and cache stats."""
    import psutil
    process = psutil.Process()
    memory_info = process.memory_info()
    cpu_percent = psutil.cpu_percent(interval=None)
    
    cache_metrics = cache_instance.get_metrics()
    
    db_metrics = {
        "pool_size": 0,
        "checked_in": 0,
        "checked_out": 0
    }
    if hasattr(db.engine, 'pool') and db.engine.pool is not None:
        db_metrics = {
            "pool_size": db.engine.pool.size(),
            "checked_in": db.engine.pool.checkedin(),
            "checked_out": db.engine.pool.checkedout()
        }

    return jsonify({
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "process": {
            "cpu_percent": cpu_percent,
            "memory_rss_bytes": memory_info.rss,
            "memory_vms_bytes": memory_info.vms,
            "threads_count": process.num_threads(),
            "open_files": len(process.open_files()) if hasattr(process, 'open_files') else 0
        },
        "cache": cache_metrics,
        "database": db_metrics
    }), 200

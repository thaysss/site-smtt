# app/utils/logging_setup.py
import contextvars
import json
import logging
import time
import traceback
from flask import has_request_context, request, g
from sqlalchemy.engine import Engine
from sqlalchemy import event

# Thread-safe request ID context variable
request_id_var = contextvars.ContextVar('request_id', default='-')

class JSONFormatter(logging.Formatter):
    """Custom formatter to output JSON formatted logs."""
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get()
        }

        # Add Flask request context if active
        if has_request_context():
            log_data.update({
                "path": request.path,
                "method": request.method,
                "ip": request.remote_addr
            })
            if hasattr(g, 'request_id'):
                log_data["request_id"] = g.request_id

        # Capturing traceback if present
        if record.exc_info:
            log_data["stack_trace"] = "".join(traceback.format_exception(*record.exc_info))
        elif hasattr(record, "stack_trace"):
            log_data["stack_trace"] = record.stack_trace

        # Log extra dictionary attributes
        for key, value in record.__dict__.items():
            if key not in [
                "args", "asctime", "created", "exc_info", "exc_text", 
                "filename", "funcName", "levelname", "levelno", "lineno", 
                "module", "msecs", "msg", "name", "pathname", "process", 
                "processName", "relativeCreated", "stack_info", "thread", 
                "threadName"
            ]:
                log_data[key] = value

        return json.dumps(log_data)

def setup_logging():
    """Initializes JSON logging for the application and root logger."""
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(stream_handler)
    root_logger.setLevel(logging.INFO)

    # Prevent Werkzeug request logs from cluttering the JSON stream (since we log requests manually)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)

# Register SQLAlchemy event listeners globally for the Engine class
db_logger = logging.getLogger("app.db")

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Store query start time on execution context
    context._query_start_time = time.time()

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    if hasattr(context, "_query_start_time"):
        duration = time.time() - context._query_start_time
        db_logger.info(
            "SQL query executed successfully",
            extra={
                "query": statement,
                "parameters": str(parameters),
                "duration_ms": round(duration * 1000, 2)
            }
        )

@event.listens_for(Engine, "handle_error")
def handle_dbapi_error(exception_context):
    db_logger.error(
        f"SQL query failed: {str(exception_context.original_exception)}",
        extra={
            "query": exception_context.statement,
            "parameters": str(exception_context.parameters),
            "error": str(exception_context.original_exception)
        }
    )

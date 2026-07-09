# app/utils/alerts.py
import os
import json
import time
import logging
import threading
import psutil

alert_logger = logging.getLogger("app.alert")

class AlertManager:
    """Manages system health alerts based on configurable thresholds."""
    def __init__(self, config_path=None):
        if config_path is None:
            # Fallback relative to project root
            self.config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "alerts_config.json")
        else:
            self.config_path = config_path
            
        self.config = {
            "max_cpu_percent": 85.0,
            "max_memory_percent": 90.0,
            "max_db_latency_ms": 1000.0
        }
        self.load_config()

    def load_config(self):
        """Loads thresholds from JSON config file if available."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    self.config.update(json.load(f))
            except Exception as e:
                alert_logger.error(f"Failed to load alert config: {str(e)}", exc_info=True)

    def check_system_metrics(self):
        """Checks CPU and Memory and logs structured warnings/alerts if thresholds are breached."""
        self.load_config()  # Dynamic config reloading

        cpu = psutil.cpu_percent(interval=None)
        if cpu > self.config["max_cpu_percent"]:
            alert_logger.warning(
                f"ALERT: CPU usage ({cpu}%) exceeded threshold ({self.config['max_cpu_percent']}%)",
                extra={
                    "alert_type": "high_cpu",
                    "metric_value": cpu,
                    "threshold": self.config["max_cpu_percent"]
                }
            )

        memory = psutil.virtual_memory()
        if memory.percent > self.config["max_memory_percent"]:
            alert_logger.warning(
                f"ALERT: Memory usage ({memory.percent}%) exceeded threshold ({self.config['max_memory_percent']}%)",
                extra={
                    "alert_type": "high_memory",
                    "metric_value": memory.percent,
                    "threshold": self.config["max_memory_percent"]
                }
            )

    def check_db_latency(self, latency_ms):
        """Checks database latency during operations or health checks."""
        if latency_ms > self.config["max_db_latency_ms"]:
            alert_logger.warning(
                f"ALERT: Database latency ({latency_ms}ms) exceeded threshold ({self.config['max_db_latency_ms']}ms)",
                extra={
                    "alert_type": "high_db_latency",
                    "metric_value": latency_ms,
                    "threshold": self.config["max_db_latency_ms"]
                }
            )

# Global singleton manager
alert_manager = AlertManager()

def start_alert_monitor(interval_sec=60):
    """Starts the alert monitor background thread."""
    def run_monitor():
        # Short initial delay to let app boot
        time.sleep(5)
        while True:
            try:
                alert_manager.check_system_metrics()
            except Exception as e:
                alert_logger.error(f"Alert monitoring loop failure: {str(e)}", exc_info=True)
            time.sleep(interval_sec)

    monitor_thread = threading.Thread(target=run_monitor, name="AlertMonitorThread", daemon=True)
    monitor_thread.start()

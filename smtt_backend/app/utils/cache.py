# app/utils/cache.py
import time
import logging
import threading

cache_logger = logging.getLogger("app.cache")

class SimpleCache:
    """A thread-safe in-memory cache implementation with TTL and hit/miss tracking."""
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        with self._lock:
            if key in self._cache:
                expiry, value = self._cache[key]
                if expiry is None or expiry > time.time():
                    self.hits += 1
                    cache_logger.info(
                        f"Cache Hit for key: {key}",
                        extra={
                            "cache_event": "hit", 
                            "key": key, 
                            "hits": self.hits, 
                            "misses": self.misses
                        }
                    )
                    return value
                else:
                    # Key expired, clean it up
                    del self._cache[key]
            
            self.misses += 1
            cache_logger.info(
                f"Cache Miss for key: {key}",
                extra={
                    "cache_event": "miss", 
                    "key": key, 
                    "hits": self.hits, 
                    "misses": self.misses
                }
            )
            return None

    def set(self, key, value, timeout=300):
        with self._lock:
            expiry = time.time() + timeout if timeout is not None else None
            self._cache[key] = (expiry, value)
            cache_logger.info(
                f"Cache Set for key: {key}",
                extra={"cache_event": "set", "key": key, "timeout": timeout}
            )

    def delete(self, key):
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                cache_logger.info(
                    f"Cache Delete for key: {key}",
                    extra={"cache_event": "delete", "key": key}
                )

    def clear(self):
        with self._lock:
            self._cache.clear()
            cache_logger.info(
                "Cache Cleared",
                extra={"cache_event": "clear"}
            )

    def get_metrics(self):
        with self._lock:
            total = self.hits + self.misses
            hit_ratio = (self.hits / total) if total > 0 else 0.0
            return {
                "hits": self.hits,
                "misses": self.misses,
                "hit_ratio": round(hit_ratio, 4),
                "keys_count": len(self._cache)
            }

# Singleton instance for the application
cache_instance = SimpleCache()

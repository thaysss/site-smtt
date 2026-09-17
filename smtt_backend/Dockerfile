FROM python:3.11-slim

WORKDIR /app

# Install system packages required for compiling libraries (like psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
RUN useradd --create-home --uid 10001 app && chown -R app:app /app

USER app

EXPOSE 5000

# Run using gunicorn with JSON logging enabled in stdout
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "2", "--timeout", "60", "run:app"]

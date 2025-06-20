# ---- Build Stage ----
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies required for building
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create venv and install Python dependencies
RUN python -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Production Stage ----
FROM python:3.11-slim AS production

WORKDIR /app

# Install only runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /app/venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Copy app code
COPY app ./app

# Create directory for thumbnails
RUN mkdir -p /thumbnails && chmod 777 /thumbnails

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set ownership for required directories
RUN chown -R appuser:appuser /app /thumbnails

# Set Python path
ENV PYTHONPATH=/app

EXPOSE 8001

# Switch to non-root user
USER appuser

# Entrypoint/command is set by docker-compose for API or worker 

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code, data fixtures, and bootstrap scripts
COPY backend /app/backend
COPY data /app/data
COPY scripts /app/scripts

# Run bootstrap data in quickstart mode during image build to cache representative benchmark cases
RUN python /app/backend/scripts/bootstrap_data.py --mode quickstart || true

EXPOSE 8000

ENV PYTHONPATH=/app

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

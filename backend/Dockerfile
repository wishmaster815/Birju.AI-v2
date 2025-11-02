# ---------- 1. Use lightweight Python base ----------
FROM python:3.10-slim

# ---------- 2. Set working directory ----------
WORKDIR /app

# ---------- 3. Prevent Python from writing pyc files / buffering ----------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ---------- 4. Copy dependency files ----------
COPY requirements.txt .
COPY runtime.txt .

# ---------- 5. Install system dependencies ----------
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# ---------- 6. Install Python dependencies ----------
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# ---------- 7. Copy application code ----------
COPY . .

# ---------- 8. Expose port ----------
EXPOSE 8000

# ---------- 9. Load environment variables ----------
# (In Cloud Run, these can be set in the dashboard, but .env helps local runs)
ENV ENV_FILE=.env

# ---------- 10. Run the FastAPI app ----------
# Gunicorn is used for production-grade serving
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "app:app", "--bind", "0.0.0.0:8080", "--timeout", "120"]

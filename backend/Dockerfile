FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -Ls https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

COPY pyproject.toml uv.lock ./


RUN uv sync

ENV PATH="/app/.venv/bin:$PATH"

COPY . .

EXPOSE 10000

CMD gunicorn -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:$PORT --timeout 120
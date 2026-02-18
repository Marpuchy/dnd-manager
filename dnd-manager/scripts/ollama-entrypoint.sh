#!/bin/sh
set -eu

MODEL="${OLLAMA_MODEL:-llama3.1:8b}"
BIND_ADDRESS="${OLLAMA_BIND_ADDRESS:-0.0.0.0:11434}"
SKIP_PULL="${OLLAMA_SKIP_MODEL_PULL:-false}"

echo "[ollama] starting server on ${BIND_ADDRESS}"
OLLAMA_HOST="${BIND_ADDRESS}" ollama serve &
OLLAMA_PID=$!

cleanup() {
  kill "${OLLAMA_PID}" 2>/dev/null || true
  wait "${OLLAMA_PID}" 2>/dev/null || true
}

trap cleanup INT TERM

echo "[ollama] waiting for API"
i=0
until ollama list >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "${i}" -ge 90 ]; then
    echo "[ollama] API did not become ready in time"
    wait "${OLLAMA_PID}"
    exit 1
  fi
  sleep 1
done

if [ "${SKIP_PULL}" = "true" ]; then
  echo "[ollama] skipping model pull"
else
  if ollama show "${MODEL}" >/dev/null 2>&1; then
    echo "[ollama] model already present: ${MODEL}"
  else
    echo "[ollama] pulling model: ${MODEL}"
    ollama pull "${MODEL}"
  fi
fi

wait "${OLLAMA_PID}"

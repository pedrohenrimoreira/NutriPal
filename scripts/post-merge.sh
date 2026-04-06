#!/bin/bash
set -e

echo "==> Installing backend dependencies..."
pip install -r backend/requirements.txt -q

echo "==> Installing mobile dependencies..."
cd mobile && npm install --legacy-peer-deps --no-audit --prefer-offline 2>&1 | tail -5 && cd ..

echo "==> Installing frontend dependencies..."
cd frontend && npm install -q && cd ..

echo "==> Post-merge setup complete."

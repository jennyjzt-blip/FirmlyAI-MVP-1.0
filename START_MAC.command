#!/bin/bash
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then echo "Install Python 3 first."; exit 1; fi
if [ ! -d ".venv" ]; then python3 -m venv .venv || exit 1; fi
source .venv/bin/activate
python3 -m pip install -r requirements.txt || exit 1
echo "Firmly AI running at http://127.0.0.1:5000"
python3 app.py

#!/bin/bash
cd "$(dirname "$0")"
PY=python3
$PY -c "import sys" >/dev/null 2>&1 || PY=python
lsof -ti tcp:8800 2>/dev/null | xargs kill -9 2>/dev/null
($PY -m http.server 8800 >/dev/null 2>&1 &) 
sleep 1
open "http://localhost:8800/index.html"

#!/usr/bin/env bash
cd "$(dirname "$0")" && exec python3 -m http.server 8098 --bind 0.0.0.0

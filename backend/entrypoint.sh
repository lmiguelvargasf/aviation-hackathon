#!/bin/sh
set -e
uv run piccolo migrations forward all
exec uv run uvicorn src.backend:app --host 0.0.0.0 --reload

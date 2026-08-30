import os
import sys

# Add root directory to python path for Vercel Serverless environment
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.server import app

# Vercel ASGI serverless handler export
handler = app

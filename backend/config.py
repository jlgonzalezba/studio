"""
Backend Configuration
Centralized configuration for all backend services.
"""

# Server Configuration
HOST = "127.0.0.1"
PORT = 5000

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:9002",
    "http://localhost:9003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:9002",
    "http://127.0.0.1:9003",
    "http://192.168.0.140:9002",
    "https://www.enertech3.com",
]

# API Configuration
API_PREFIX = "/api"
API_VERSION = "v1"

# File Upload Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = [".las", ".csv", ".txt"]

# Cloudflare R2 Configuration
import os
PORT = int(os.getenv("PORT", 5000))
R2_ACCOUNT_ID = os.getenv("b8535e30d92db719275627e13419d79a")
R2_ACCESS_KEY_ID = os.getenv("dea0fdd18fef5a61e7852ea82eb7665d")
R2_SECRET_ACCESS_KEY = os.getenv("83e2723133007494f48bd68b23b8989f4f612bb44dd8943ba1eedd87b8258600")
R2_BUCKET_NAME = os.getenv("enertech")
R2_REGION = os.getenv("R2_REGION", "auto")  # Default to 'auto' for Cloudflare R2
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else None
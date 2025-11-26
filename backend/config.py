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
R2_ACCESS_KEY_ID = "your_r2_access_key_id"
R2_SECRET_ACCESS_KEY = "your_r2_secret_access_key"
R2_ACCOUNT_ID = "your_account_id"
R2_BUCKET_NAME = "your_bucket_name"
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
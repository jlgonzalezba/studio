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
R2_ACCOUNT_ID = os.getenv("b8535e30d92db719275627e13419d79a")
R2_ACCESS_KEY_ID = os.getenv("3fbdd5682b203f9f446001d92f880321")
R2_SECRET_ACCESS_KEY = os.getenv("fcb2049a62759ec2471e6146d8fc2cf071bfbb34520ee1c58f20c8c07394d85f")
R2_BUCKET_NAME = os.getenv("enertech3-object-rw")
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com" if R2_ACCOUNT_ID else None
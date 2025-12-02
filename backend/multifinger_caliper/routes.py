"""
Multifinger Caliper API Routes
Handles LAS file processing and analysis for multifinger caliper applications.
"""

import io
import lasio
import gzip
import uuid
import boto3
from botocore.client import Config
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

class ProcessCaliperRequest(BaseModel):
    use_centralized: bool = True

class PresignedUrlRequest(BaseModel):
    filename: str

class UploadFromR2Request(BaseModel):
    key: str

# Import LAS processing module
from .las_processor import process_las_data, export_las_curves_to_csv

# Import data management module
from .df_manage import process_caliper_data

# Import configuration
from ..config import (
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME, R2_ENDPOINT_URL
)

# Create router for multifinger caliper endpoints
router = APIRouter(prefix="/api/multifinger-caliper", tags=["multifinger-caliper"])

# Global progress variable for processing
processing_progress = 0

# R2 S3 client
def get_r2_client():
    if not all([R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT_URL]):
        raise HTTPException(status_code=500, detail="R2 configuration not complete")
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4')
    )


@router.post("/get-presigned-url")
async def get_presigned_url(request: PresignedUrlRequest):
    """
    Generate a presigned URL for uploading a file directly to Cloudflare R2.
    """
    if not R2_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="R2 bucket not configured")

    # Generate unique key
    file_extension = request.filename.split('.')[-1] if '.' in request.filename else ''
    unique_key = f"uploads/{uuid.uuid4()}.{file_extension}"

    try:
        s3_client = get_r2_client()
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': unique_key,
                'ContentType': 'application/octet-stream'  # Allow any file type
            },
            ExpiresIn=3600  # 1 hour
        )
        return {"presigned_url": presigned_url, "key": unique_key}
    except Exception as e:
        print(f"[PRESIGNED_URL] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating presigned URL: {str(e)}")


@router.post("/upload-from-r2")
async def upload_from_r2(request: UploadFromR2Request):
    """
    Download file from R2 and process it like the original upload endpoint.
    """
    if not R2_BUCKET_NAME:
        raise HTTPException(status_code=500, detail="R2 bucket not configured")

    try:
        print(f"[UPLOAD_FROM_R2] Downloading file from R2: {request.key}")
        s3_client = get_r2_client()

        # Download file from R2
        response = s3_client.get_object(Bucket=R2_BUCKET_NAME, Key=request.key)
        contents = response['Body'].read()

        print(f"[UPLOAD_FROM_R2] File size: {len(contents)} bytes")

        # Extract filename from key (remove uploads/ prefix)
        filename = request.key.split('/')[-1] if '/' in request.key else request.key

        # Check extension
        if not filename.endswith('.las'):
            raise HTTPException(status_code=400, detail="ERROR: El archivo debe tener la extensión .las")

        # Decompress if .gz
        if filename.endswith('.gz'):
            print("[UPLOAD_FROM_R2] Decompressing .gz file")
            contents = gzip.decompress(contents)
            print(f"[UPLOAD_FROM_R2] Decompressed size: {len(contents)} bytes")

        # Decode content
        decoded_content = None
        encodings_to_try = ['utf-8', 'iso-8859-1', 'latin1', 'cp1252']

        for encoding in encodings_to_try:
            try:
                decoded_content = contents.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if decoded_content is None:
            raise UnicodeDecodeError("No se pudo decodificar el archivo")

        # Process LAS
        file_like_object = io.StringIO(decoded_content)
        las = lasio.read(file_like_object)

        print("[UPLOAD_FROM_R2] Processing LAS data")
        result = process_las_data(las)
        print("[UPLOAD_FROM_R2] LAS data processed successfully")

        # Export CSV
        try:
            print("[UPLOAD_FROM_R2] Exporting CSV")
            csv_paths = export_las_curves_to_csv(las)
            result["csv_exported"] = csv_paths
            print("[UPLOAD_FROM_R2] CSV exported successfully")
        except Exception as e:
            print(f"[UPLOAD_FROM_R2] CSV export error: {e}")
            result["csv_error"] = str(e)

        print("[UPLOAD_FROM_R2] Upload from R2 completed successfully")
        return result

    except UnicodeDecodeError as e:
        print(f"[UPLOAD_FROM_R2] Unicode decode error: {e}")
        raise HTTPException(status_code=400, detail="ERROR: El archivo .las debe estar en formato UTF-8. Convierta el archivo a UTF-8 e intente nuevamente.")
    except ValueError as e:
        print(f"[UPLOAD_FROM_R2] Value error: {e}")
        if "LAS" in str(e):
            raise HTTPException(status_code=400, detail=f"ERROR: Formato LAS inválido - {str(e)}")
        raise HTTPException(status_code=400, detail=f"ERROR: Datos inválidos en el archivo - {str(e)}")
    except Exception as e:
        print(f"[UPLOAD_FROM_R2] General error: {e}")
        error_msg = str(e)
        if "No curves" in error_msg or "empty" in error_msg.lower():
            raise HTTPException(status_code=400, detail="ERROR: El archivo .las no contiene curvas válidas o está vacío.")
        elif "version" in error_msg.lower():
            raise HTTPException(status_code=400, detail="ERROR: Versión LAS no soportada. Solo se soporta LAS 2.0.")
        else:
            raise HTTPException(status_code=500, detail=f"ERROR: Error al procesar el archivo - {error_msg}")


@router.post("/upload")
async def upload_and_process_las(file: UploadFile = File(...)):
    """
    Endpoint para recibir un archivo .las, procesarlo con lasio y
    devolver información específica para multifinger caliper.
    """
    if not file.filename.endswith('.las'):
        raise HTTPException(status_code=400, detail="ERROR: El archivo debe tener la extensión .las")

    try:
        print(f"[UPLOAD] Received file: {file.filename}")
        # Lee el contenido del archivo subido en memoria
        contents = await file.read()
        print(f"[UPLOAD] File size: {len(contents)} bytes")

        # Descomprimir si es .gz
        if file.filename.endswith('.gz'):
            print("[UPLOAD] Decompressing .gz file")
            contents = gzip.decompress(contents)
            print(f"[UPLOAD] Decompressed size: {len(contents)} bytes")

        # Decodifica el contenido (mismo código que antes)
        decoded_content = None
        encodings_to_try = ['utf-8', 'iso-8859-1', 'latin1', 'cp1252']

        for encoding in encodings_to_try:
            try:
                decoded_content = contents.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if decoded_content is None:
            raise UnicodeDecodeError("No se pudo decodificar el archivo")

        # Crea el objeto LAS
        file_like_object = io.StringIO(decoded_content)
        las = lasio.read(file_like_object)

        print("[UPLOAD] Processing LAS data")
        # Procesa con la función mínima
        result = process_las_data(las)
        print("[UPLOAD] LAS data processed successfully")

        # Exportar curvas a CSV automáticamente (original y centralizado)
        try:
            print("[UPLOAD] Exporting CSV")
            csv_paths = export_las_curves_to_csv(las)
            result["csv_exported"] = csv_paths
            print("[UPLOAD] CSV exported successfully")
        except Exception as e:
            print(f"[UPLOAD] CSV export error: {e}")
            result["csv_error"] = str(e)

        print("[UPLOAD] Upload completed successfully")
        return result

    except UnicodeDecodeError as e:
        print(f"[UPLOAD] Unicode decode error: {e}")
        raise HTTPException(status_code=400, detail="ERROR: El archivo .las debe estar en formato UTF-8. Convierta el archivo a UTF-8 e intente nuevamente.")
    except ValueError as e:
        print(f"[UPLOAD] Value error: {e}")
        if "LAS" in str(e):
            raise HTTPException(status_code=400, detail=f"ERROR: Formato LAS inválido - {str(e)}")
        raise HTTPException(status_code=400, detail=f"ERROR: Datos inválidos en el archivo - {str(e)}")
    except Exception as e:
        # Si algo sale mal durante el procesamiento, devuelve un error
        print(f"[UPLOAD] General error: {e}")
        error_msg = str(e)
        if "No curves" in error_msg or "empty" in error_msg.lower():
            raise HTTPException(status_code=400, detail="ERROR: El archivo .las no contiene curvas válidas o está vacío.")
        elif "version" in error_msg.lower():
            raise HTTPException(status_code=400, detail="ERROR: Versión LAS no soportada. Solo se soporta LAS 2.0.")
        else:
            raise HTTPException(status_code=500, detail=f"ERROR: Error al procesar el archivo - {error_msg}")


@router.post("/process-caliper")
async def process_caliper(request: ProcessCaliperRequest):
    """
    Endpoint para procesar datos del caliper más reciente.
    Detecta curvas R y calcula estadísticas para graficar.

    Args:
        request: ProcessCaliperRequest con el parámetro use_centralized
    """
    print(f"[PROCESS] Starting process_caliper with use_centralized={request.use_centralized}")
    global processing_progress
    processing_progress = 0

    try:
        result = process_caliper_data(request.use_centralized)
        print("[PROCESS] process_caliper_data completed")

        if "error" in result:
            print(f"[PROCESS] Error in result: {result['error']}")
            raise HTTPException(status_code=400, detail=f"ERROR: {result['error']}")

        processing_progress = 100
        print("[PROCESS] Process completed successfully")
        return result

    except Exception as e:
        print(f"[PROCESS] Exception: {e}")
        error_msg = str(e)
        raise HTTPException(status_code=500, detail=f"ERROR: Error al procesar datos del caliper - {error_msg}")


@router.get("/progress")
async def get_progress():
    """
    Get current processing progress.
    """
    return {"progress": processing_progress}

@router.get("/health")
async def health_check():
    """
    Health check endpoint for multifinger caliper service.
    """
    return {"status": "healthy", "service": "multifinger-caliper"}
"""
Multifinger Caliper API Routes
Handles LAS file processing and analysis for multifinger caliper applications.
"""

import io
import lasio
import gzip
import boto3
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException, Request
from pydantic import BaseModel
from .config import R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL

class ProcessCaliperRequest(BaseModel):
    use_centralized: bool = True

# Import LAS processing module
from .las_processor import process_las_data, export_las_curves_to_csv

# Import data management module
from .df_manage import process_caliper_data

# Create router for multifinger caliper endpoints
router = APIRouter(prefix="/api/multifinger-caliper", tags=["multifinger-caliper"])

# Global progress variable for processing
processing_progress = 0


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


@router.post("/generate-presigned-url")
async def generate_presigned_url(filename: str):
    """
    Generate a presigned URL for uploading a file to Cloudflare R2.
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            endpoint_url=R2_ENDPOINT_URL
        )

        # Generate unique key
        file_key = f"uploads/{uuid.uuid4()}_{filename}"

        # Generate presigned URL
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': R2_BUCKET_NAME,
                'Key': file_key,
                'ContentType': 'application/octet-stream'
            },
            ExpiresIn=3600  # 1 hour
        )

        return {
            "presigned_url": presigned_url,
            "file_key": file_key
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating presigned URL: {str(e)}")


@router.post("/webhook")
async def r2_webhook(request: Request):
    """
    Handle webhook from Cloudflare R2 when file upload completes.
    """
    try:
        # Get webhook data (adjust based on R2 webhook format)
        data = await request.json()
        print(f"[WEBHOOK] Received webhook: {data}")

        # Extract file key
        file_key = data.get('key') or data.get('object', {}).get('key')
        if not file_key:
            return {"status": "error", "message": "No file key in webhook"}

        # Download file from R2
        s3_client = boto3.client(
            's3',
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            endpoint_url=R2_ENDPOINT_URL
        )

        # Download file
        response = s3_client.get_object(Bucket=R2_BUCKET_NAME, Key=file_key)
        file_content = response['Body'].read()

        print(f"[WEBHOOK] Downloaded file {file_key}, size: {len(file_content)}")

        # Process the file (similar to upload endpoint)
        # Decompress if needed
        if file_key.endswith('.gz'):
            file_content = gzip.decompress(file_content)

        # Process LAS
        decoded_content = file_content.decode('utf-8', errors='ignore')
        file_like_object = io.StringIO(decoded_content)
        las = lasio.read(file_like_object)

        result = process_las_data(las)
        csv_paths = export_las_curves_to_csv(las)
        result["csv_exported"] = csv_paths

        print(f"[WEBHOOK] Processing completed for {file_key}")

        return {"status": "processed", "result": result}

    except Exception as e:
        print(f"[WEBHOOK] Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")


# Global variable to store processed data (in production, use database)
processed_data_store = {}

@router.post("/process-uploaded-file")
async def process_uploaded_file(request: dict):
    """
    Process a file that was uploaded to R2.
    """
    try:
        file_key = request.get('file_key')
        use_centralized = request.get('use_centralized', True)

        if not file_key:
            raise HTTPException(status_code=400, detail="No file_key provided")

        print(f"[PROCESS] Processing file {file_key}")

        # Download from R2
        s3_client = boto3.client(
            's3',
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            endpoint_url=R2_ENDPOINT_URL
        )

        response = s3_client.get_object(Bucket=R2_BUCKET_NAME, Key=file_key)
        file_content = response['Body'].read()

        # Decompress if needed
        if file_key.endswith('.gz'):
            file_content = gzip.decompress(file_content)

        # Process LAS
        decoded_content = file_content.decode('utf-8', errors='ignore')
        file_like_object = io.StringIO(decoded_content)
        las = lasio.read(file_like_object)

        result = process_las_data(las)
        csv_paths = export_las_curves_to_csv(las)
        result["csv_exported"] = csv_paths

        # Process caliper data
        plot_data = process_caliper_data(use_centralized)
        result["plot_data"] = plot_data

        # Store result
        processed_data_store[file_key] = result

        print(f"[PROCESS] Processing completed for {file_key}")

        return result

    except Exception as e:
        print(f"[PROCESS] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/get-processed-data/{file_key}")
async def get_processed_data(file_key: str):
    """
    Get processed data for a file.
    """
    if file_key in processed_data_store:
        return processed_data_store[file_key]
    else:
        raise HTTPException(status_code=404, detail="Data not found")
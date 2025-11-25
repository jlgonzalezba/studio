"""
Multifinger Caliper API Routes
Handles LAS file processing and analysis for multifinger caliper applications.
"""

import io
import lasio
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

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
        # Lee el contenido del archivo subido en memoria
        contents = await file.read()

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

        # Procesa con la función mínima
        result = process_las_data(las)

        # Exportar curvas a CSV automáticamente (original y centralizado)
        try:
            csv_paths = export_las_curves_to_csv(las)
            result["csv_exported"] = csv_paths
        except Exception as e:
            result["csv_error"] = str(e)

        return result

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="ERROR: El archivo .las debe estar en formato UTF-8. Convierta el archivo a UTF-8 e intente nuevamente.")
    except ValueError as e:
        if "LAS" in str(e):
            raise HTTPException(status_code=400, detail=f"ERROR: Formato LAS inválido - {str(e)}")
        raise HTTPException(status_code=400, detail=f"ERROR: Datos inválidos en el archivo - {str(e)}")
    except Exception as e:
        # Si algo sale mal durante el procesamiento, devuelve un error
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
    global processing_progress
    processing_progress = 0

    try:
        result = process_caliper_data(request.use_centralized)

        if "error" in result:
            raise HTTPException(status_code=400, detail=f"ERROR: {result['error']}")

        processing_progress = 100
        return result

    except Exception as e:
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
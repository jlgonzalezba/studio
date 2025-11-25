# Multifinger Caliper Backend Module

Este módulo maneja el procesamiento de archivos LAS para aplicaciones de multifinger caliper.

## Estructura del Módulo

```
backend/multifinger_caliper/
├── __init__.py          # Inicialización del módulo
├── routes.py            # Definición de rutas API
├── utils.py             # Utilidades para procesamiento LAS
└── README.md           # Esta documentación
```

## Endpoints Disponibles

### POST /api/multifinger-caliper/upload
Sube y procesa un archivo .las para análisis de multifinger caliper.

**Parámetros:**
- `file`: Archivo .las (multipart/form-data)

**Respuesta exitosa:**
```json
{
  "point_count": 36,
  "point_format_id": "LAS_2.0",
  "well_name": "WELL_NAME",
  "curves_found": ["DEPT", "RHOB", "GR", "NPHI"],
  "metadata": {
    "well_name": "WELL_NAME",
    "company": "COMPANY",
    "date": "DATE",
    "version": "2.0"
  }
}
```

### GET /api/multifinger-caliper/health
Verifica el estado del servicio.

**Respuesta:**
```json
{
  "status": "healthy",
  "service": "multifinger-caliper"
}
```

## Utilidades Disponibles

### extract_las_metadata(las)
Extrae metadatos del archivo LAS.

### validate_las_curves(las)
Valida y retorna lista de curvas válidas.

### calculate_curve_statistics(las, curve_name)
Calcula estadísticas básicas para una curva específica.

### get_las_file_info(las)
Retorna información completa del archivo LAS.

## Manejo de Errores

El módulo incluye manejo específico de errores para:
- Archivos no .las
- Archivos con encoding incorrecto
- Archivos LAS corruptos o vacíos
- Versiones LAS no soportadas

## Uso en Otras Aplicaciones

Para agregar este módulo a otras aplicaciones:

```python
from backend.multifinger_caliper.routes import router as mfc_router

app.include_router(mfc_router)
```

## Dependencias

- lasio: Para procesamiento de archivos LAS
- fastapi: Framework web
- pydantic: Validación de datos
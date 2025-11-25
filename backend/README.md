# Backend API - Studio

Backend modular para aplicaciones de Studio construido con FastAPI.

## 🏗️ Arquitectura

```
backend/
├── __init__.py              # Paquete Python
├── main.py                  # Punto de entrada principal
├── config.py                # Configuración centralizada
├── multifinger_caliper/     # Módulo Multifinger Caliper
│   ├── __init__.py
│   ├── routes.py           # Rutas API específicas
│   ├── utils.py            # Utilidades del módulo
│   └── README.md           # Documentación del módulo
├── universal_converter/     # Ejemplo: Módulo Universal Converter
│   ├── __init__.py
│   ├── routes.py
│   └── ...
└── README.md               # Esta documentación
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar servidor
```bash
# Desde la raíz del proyecto
python -m uvicorn backend.main:app --host 127.0.0.1 --port 5000 --reload
```

### 3. Acceder a la documentación
- **API Docs**: http://127.0.0.1:5000/docs
- **API ReDoc**: http://127.0.0.1:5000/redoc

## 📚 Aplicaciones Disponibles

### Multifinger Caliper
- **Endpoint**: `/api/multifinger-caliper/`
- **Descripción**: Procesamiento de archivos LAS para análisis de multifinger caliper
- **Documentación**: [Ver README](./multifinger_caliper/README.md)

### Universal Converter (Ejemplo)
- **Endpoint**: `/api/universal-converter/` (comentado)
- **Descripción**: Conversión de unidades entre sistemas de medición
- **Estado**: Deshabilitado por defecto

## 🛠️ Agregar Nueva Aplicación

### 1. Crear estructura de directorios
```bash
mkdir backend/nueva_aplicacion
```

### 2. Crear archivos básicos
```bash
# backend/nueva_aplicacion/__init__.py
# backend/nueva_aplicacion/routes.py
# backend/nueva_aplicacion/utils.py  # opcional
```

### 3. Definir rutas en routes.py
```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/nueva-aplicacion", tags=["nueva-aplicacion"])

@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "nueva-aplicacion"}
```

### 4. Registrar en main.py
```python
# Importar
from .nueva_aplicacion.routes import router as nueva_aplicacion_router

# Registrar
app.include_router(nueva_aplicacion_router)
```

### 5. Actualizar configuración (opcional)
Agregar configuraciones específicas en `config.py` si es necesario.

## ⚙️ Configuración

### Variables de entorno
- `HOST`: Host del servidor (default: 127.0.0.1)
- `PORT`: Puerto del servidor (default: 5000)

### CORS
Configurado para permitir orígenes desde:
- localhost:3000, localhost:5000, localhost:9002
- 127.0.0.1:3000, 127.0.0.1:5000, 127.0.0.1:9002

## 📋 Endpoints Globales

- `GET /`: Health check básico
- `GET /docs`: Documentación automática de la API
- `GET /redoc`: Documentación alternativa
- `GET /openapi.json`: Esquema OpenAPI

## 🔧 Desarrollo

### Agregar dependencias
1. Agregar al `requirements.txt`
2. Ejecutar `pip install -r requirements.txt`

### Testing
```bash
# Test básico
curl http://127.0.0.1:5000/

# Test con aplicación específica
curl http://127.0.0.1:5000/api/multifinger-caliper/health
```

### Logs
Los logs se muestran en la consola donde se ejecuta el servidor.

## 📖 Convenciones

- **Nombres de módulos**: snake_case (ej: `multifinger_caliper`)
- **URLs de API**: kebab-case (ej: `/api/multifinger-caliper/`)
- **Tags de documentación**: kebab-case
- **Respuestas de error**: Prefijo "ERROR:" para errores específicos
- **Health checks**: Endpoint `/health` en cada módulo

## 🚀 Despliegue

### Producción
```bash
# Sin --reload para mejor rendimiento
uvicorn backend.main:app --host 0.0.0.0 --port 5000
```

### Docker (ejemplo)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "5000"]
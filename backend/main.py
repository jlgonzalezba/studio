from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# --- CORS (Cross-Origin Resource Sharing) ---
# Esto permite que tu frontend (en localhost:3000) pueda hacer peticiones a este backend (en localhost:8000).
origins = [
    "*", # Para depuración, permitimos cualquier origen.
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LÓGICA DE CONVERSIÓN (Extraída de tu app Streamlit) ---

# 1. Factores de conversión
LENGTH = {"metro (m)": 1, "kilómetro (km)": 1000, "centímetro (cm)": 0.01, "milímetro (mm)": 0.001, "micrómetro (µm)": 1e-6, "nanómetro (nm)": 1e-9, "pulgada (in)": 0.0254, "pie (ft)": 0.3048, "yarda (yd)": 0.9144, "milla (mi)": 1609.344, "milla náutica (nmi)": 1852}
MASS = {"kilogramo (kg)": 1, "gramo (g)": 0.001, "miligramo (mg)": 1e-6, "microgramo (µg)": 1e-9, "tonelada métrica (t)": 1000, "tonelada corta EUA (ton US)": 907.18474, "libra (lb)": 0.45359237, "onza (oz)": 0.028349523125}
TIME = {"segundo (s)": 1, "milisegundo (ms)": 1e-3, "microsegundo (µs)": 1e-6, "minuto (min)": 60, "hora (h)": 3600, "día (d)": 86400, "semana (wk)": 604800}
CURRENT = {"ampere (A)": 1, "milliampere (mA)": 1e-3, "microampere (µA)": 1e-6, "kiloampere (kA)": 1e3}
AMOUNT = {"mol (mol)": 1, "milimol (mmol)": 1e-3, "micromol (µmol)": 1e-6}
LUMINOUS = {"candela (cd)": 1, "millicandela (mcd)": 1e-3, "kilocandela (kcd)": 1e3}
TEMP_UNITS = ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"]

# Un mapa para encontrar el diccionario de factores correcto
FACTOR_MAP = {
    "Longitud": LENGTH,
    "Masa": MASS,
    "Tiempo": TIME,
    "Corriente eléctrica": CURRENT,
    "Cantidad de sustancia": AMOUNT,
    "Intensidad luminosa": LUMINOUS,
}

# 2. Funciones de conversión
def to_si(value: float, factors: dict, unit_from: str) -> float:
    return value * factors[unit_from]

def from_si(value_si: float, factors: dict, unit_to: str) -> float:
    return value_si / factors[unit_to]

def convert_linear(value: float, factors: dict, u_from: str, u_to: str) -> float:
    return from_si(to_si(value, factors, u_from), factors, u_to)

def convert_temperature(value: float, u_from: str, u_to: str) -> float:
    if u_from == u_to: return value
    if u_from.startswith("Celsius"): k = value + 273.15
    elif u_from.startswith("Fahrenheit"): k = (value - 32) * 5.0/9.0 + 273.15
    else: k = value
    if u_to.startswith("Celsius"): return k - 273.15
    elif u_to.startswith("Fahrenheit"): return (k - 273.15) * 9.0/5.0 + 32
    else: return k

# --- API (La "Puerta de Entrada" para la web) ---

# Función de formato extraída de tu app Streamlit
def format_number(x: float) -> str:
    if x == 0:
        return "0"
    if abs(x) < 1e-3 or abs(x) >= 1e6:
        return f"{x:.6e}"
    if abs(x) < 1:
        return f"{x:.6f}".rstrip('0').rstrip('.')
    return f"{x:,.6f}".rstrip('0').rstrip('.')

# Define la estructura de los datos que la web debe enviar
class ConversionRequest(BaseModel):
    value: float
    category: str # Ej: "Masa", "Longitud", "Temperatura"
    fromUnit: str
    toUnit: str

# Esta es la URL que tu frontend llamará.
# Cuando llegue una petición a "/api/convert", se ejecutará esta función.
@app.post("/api/convert")
def convert(request: ConversionRequest):
    try:
        # Decide qué función de conversión usar basado en la categoría
        if request.category == "Temperatura":
            result = convert_temperature(request.value, request.fromUnit, request.toUnit)
        else:
            # Busca el diccionario de factores correcto (ej: MASS, LENGTH)
            factors = FACTOR_MAP.get(request.category)
            if not factors:
                # Si la categoría no existe, devuelve un error
                raise ValueError(f"Categoría de conversión no válida: {request.category}")
            
            result = convert_linear(request.value, factors, request.fromUnit, request.toUnit)
        
        formatted_result = format_number(result)
        # Devuelve el resultado en un formato que la web entiende (JSON)
        return {"result": formatted_result}

    except Exception as e:
        # Si algo sale mal (ej: una unidad no existe), devuelve un error claro.
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# --- CORS (Cross-Origin Resource Sharing) ---
# This allows your frontend (e.g., at localhost:3000) to make requests to this backend (at localhost:8000).
# In production, you should restrict this to your frontend's domain.
origins = [
    "*", # For debugging, we allow any origin.
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONVERSION LOGIC (Extracted from your Streamlit app) ---

# 1. Conversion factors
LENGTH = {"meter (m)": 1, "kilometer (km)": 1000, "centimeter (cm)": 0.01, "millimeter (mm)": 0.001, "micrometer (µm)": 1e-6, "nanometer (nm)": 1e-9, "inch (in)": 0.0254, "foot (ft)": 0.3048, "yard (yd)": 0.9144, "mile (mi)": 1609.344, "nautical mile (nmi)": 1852}
MASS = {"kilogram (kg)": 1, "gram (g)": 0.001, "milligram (mg)": 1e-6, "microgram (µg)": 1e-9, "metric ton (t)": 1000, "US short ton (ton US)": 907.18474, "pound (lb)": 0.45359237, "ounce (oz)": 0.028349523125}
TIME = {"second (s)": 1, "millisecond (ms)": 1e-3, "microsecond (µs)": 1e-6, "minute (min)": 60, "hour (h)": 3600, "day (d)": 86400, "week (wk)": 604800}
CURRENT = {"ampere (A)": 1, "milliampere (mA)": 1e-3, "microampere (µA)": 1e-6, "kiloampere (kA)": 1e3}
AMOUNT = {"mole (mol)": 1, "millimole (mmol)": 1e-3, "micromole (µmol)": 1e-6}
LUMINOUS = {"candela (cd)": 1, "millicandela (mcd)": 1e-3, "kilocandela (kcd)": 1e3}
TEMP_UNITS = ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"]

# A map to find the correct factors dictionary
FACTOR_MAP = {
    "Length": LENGTH,
    "Mass": MASS,
    "Time": TIME,
    "Electric Current": CURRENT,
    "Amount of Substance": AMOUNT,
    "Luminous Intensity": LUMINOUS,
}

# 2. Conversion functions
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

# --- API (The "Gateway" for the web) ---

# Formatting function extracted from your Streamlit app
def format_number(x: float) -> str:
    if x == 0:
        return "0"
    if abs(x) < 1e-3 or abs(x) >= 1e6:
        return f"{x:.6e}"
    if abs(x) < 1:
        return f"{x:.6f}".rstrip('0').rstrip('.')
    return f"{x:,.6f}".rstrip('0').rstrip('.')

# Defines the structure of the data the web should send
class ConversionRequest(BaseModel):
    value: float
    category: str # e.g., "Mass", "Length", "Temperature"
    fromUnit: str
    toUnit: str

# This is the URL your frontend will call.
# When a request arrives at "/api/convert", this function will be executed.
@app.post("/api/convert")
def convert(request: ConversionRequest):
    try:
        if request.category == "Temperature":
            result = convert_temperature(request.value, request.fromUnit, request.toUnit)
        else:
            factors = FACTOR_MAP.get(request.category)
            if not factors:
                raise ValueError(f"Invalid conversion category: {request.category}")
            
            result = convert_linear(request.value, factors, request.fromUnit, request.toUnit)
        
        formatted_result = format_number(result)
        
        # KEY LINE! Make sure your code returns the formatted result.
        return {"result": formatted_result}

    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)}
        )
# d:\4. VSCode Projects\studio\backend\main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict

# --- 1. Define the data model for the request ---
# This must match the JSON sent from the frontend
class ConversionRequest(BaseModel):
    value: float
    category: str
    from_unit: str
    to_unit: str

# --- 2. Define conversion factors with English keys ---
# This now matches the CONVERSION_DATA in the React component
CONVERSION_FACTORS: Dict[str, Dict[str, float]] = {
    "Length": {
        "meter (m)": 1, "kilometer (km)": 1000, "centimeter (cm)": 0.01,
        "millimeter (mm)": 0.001, "micrometer (µm)": 1e-6, "nanometer (nm)": 1e-9,
        "inch (in)": 0.0254, "foot (ft)": 0.3048, "yard (yd)": 0.9144,
        "mile (mi)": 1609.344, "nautical mile (nmi)": 1852,
    },
    "Mass": {
        "kilogram (kg)": 1, "gram (g)": 0.001, "milligram (mg)": 1e-6,
        "microgram (µg)": 1e-9, "metric ton (t)": 1000,
        "US short ton (ton US)": 907.18474, "pound (lb)": 0.45359237,
        "ounce (oz)": 0.028349523125,
    },
    "Time": {
        "second (s)": 1, "millisecond (ms)": 1e-3, "microsecond (µs)": 1e-6,
        "minute (min)": 60, "hour (h)": 3600, "day (d)": 86400, "week (wk)": 604800,
    },
    "Electric Current": {
        "ampere (A)": 1, "milliampere (mA)": 1e-3, "microampere (µA)": 1e-6,
        "kiloampere (kA)": 1e3,
    },
    "Amount of Substance": {
        "mole (mol)": 1, "millimole (mmol)": 1e-3, "micromole (µmol)": 1e-6,
    },
    "Luminous Intensity": {
        "candela (cd)": 1, "millicandela (mcd)": 1e-3, "kilocandela (kcd)": 1e3,
    }
}

# --- 3. Conversion logic functions ---
def convert_linear(value: float, factors: dict, u_from: str, u_to: str) -> float:
    value_si = value * factors[u_from]
    return value_si / factors[u_to]

def convert_temperature(value: float, u_from: str, u_to: str) -> float:
    if u_from == u_to:
        return value
    # Convert to Kelvin first
    k = 0.0
    if u_from.startswith("Celsius"):
        k = value + 273.15
    elif u_from.startswith("Fahrenheit"):
        k = (value - 32) * 5.0/9.0 + 273.15
    else:  # Already Kelvin
        k = value
    
    # Convert from Kelvin to target unit
    if u_to.startswith("Celsius"):
        return k - 273.15
    elif u_to.startswith("Fahrenheit"):
        return (k - 273.15) * 9.0/5.0 + 32
    else: # Return Kelvin
        return k

def format_number(x: float) -> str:
    if x == 0:
        return "0"
    if abs(x) < 1e-4 or abs(x) >= 1e7:
        return f"{x:.6e}"
    return f"{x:.6f}".rstrip('0').rstrip('.')

# --- 4. Create the FastAPI app ---
app = FastAPI()

# --- 5. Configure CORS ---
# This allows your React app (running on http://localhost:3000)
# to make requests to this API (running on http://localhost:8000)
origins = [
    "http://localhost:3000",
    "http://localhost:3001", # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 6. Define the API endpoint ---
@app.post("/api/convert")
async def convert_units(data: ConversionRequest):
    category = data.category
    value = data.value
    unit_from = data.from_unit
    unit_to = data.to_unit
    
    try:
        if category == "Temperature":
            result = convert_temperature(value, unit_from, unit_to)
        else:
            factors = CONVERSION_FACTORS.get(category)
            if not factors:
                raise HTTPException(
                    status_code=400,
                    detail={"error": f"Invalid conversion category: '{category}'"}
                )
            result = convert_linear(value, factors, unit_from, unit_to)
        
        return {"result": format_number(result)}

    except KeyError as e:
        # This happens if a unit is not found in the factors dictionary
        raise HTTPException(
            status_code=400,
            detail={"error": f"Invalid unit for this category: {e}"}
        )
    except Exception as e:
        # Generic error for any other issues
        raise HTTPException(
            status_code=500,
            detail={"error": f"An unexpected error occurred: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    print("Starting Uvicorn server for development...")
    # This allows running the app directly with `python main.py`
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

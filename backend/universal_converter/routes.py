"""
Universal Converter API Routes
Example module showing how to structure a new backend application.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

# Create router for universal converter endpoints
router = APIRouter(prefix="/api/universal-converter", tags=["universal-converter"])


class ConversionRequest(BaseModel):
    """Request model for unit conversions."""
    value: float
    from_unit: str
    to_unit: str
    category: str  # length, weight, temperature, etc.


class ConversionResponse(BaseModel):
    """Response model for conversion results."""
    original_value: float
    original_unit: str
    converted_value: float
    converted_unit: str
    category: str


# Simple conversion factors (example implementation)
CONVERSION_FACTORS = {
    "length": {
        "meters_feet": 3.28084,
        "feet_meters": 0.3048,
        "meters_inches": 39.3701,
        "inches_meters": 0.0254,
    },
    "weight": {
        "kg_lbs": 2.20462,
        "lbs_kg": 0.453592,
    }
}


@router.post("/convert", response_model=ConversionResponse)
async def convert_units(request: ConversionRequest):
    """
    Convert units between different measurement systems.

    Example: Convert 100 meters to feet
    """
    try:
        # Find conversion factor
        conversion_key = f"{request.from_unit}_{request.to_unit}"

        if request.category not in CONVERSION_FACTORS:
            raise HTTPException(
                status_code=400,
                detail=f"ERROR: Category '{request.category}' not supported"
            )

        if conversion_key not in CONVERSION_FACTORS[request.category]:
            raise HTTPException(
                status_code=400,
                detail=f"ERROR: Conversion from {request.from_unit} to {request.to_unit} not supported"
            )

        factor = CONVERSION_FACTORS[request.category][conversion_key]
        converted_value = request.value * factor

        return ConversionResponse(
            original_value=request.value,
            original_unit=request.from_unit,
            converted_value=round(converted_value, 4),
            converted_unit=request.to_unit,
            category=request.category
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ERROR: Conversion failed - {str(e)}"
        )


@router.get("/categories")
async def get_supported_categories():
    """
    Get list of supported conversion categories.
    """
    return {
        "categories": list(CONVERSION_FACTORS.keys()),
        "total_categories": len(CONVERSION_FACTORS)
    }


@router.get("/units/{category}")
async def get_units_for_category(category: str):
    """
    Get supported units for a specific category.
    """
    if category not in CONVERSION_FACTORS:
        raise HTTPException(
            status_code=404,
            detail=f"ERROR: Category '{category}' not found"
        )

    # Extract unique units from conversion keys
    conversions = CONVERSION_FACTORS[category]
    units = set()
    for conversion in conversions.keys():
        from_unit, to_unit = conversion.split("_")
        units.add(from_unit)
        units.add(to_unit)

    return {
        "category": category,
        "units": sorted(list(units)),
        "conversions_available": len(conversions)
    }


@router.get("/health")
async def health_check():
    """
    Health check endpoint for universal converter service.
    """
    return {"status": "healthy", "service": "universal-converter"}
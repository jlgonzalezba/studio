"""
Utility functions for Multifinger Caliper processing.
"""

import lasio
from typing import Dict, List, Any


def extract_las_metadata(las: lasio.LASFile) -> Dict[str, Any]:
    """
    Extract metadata from LAS file for multifinger caliper analysis.

    Args:
        las: LAS file object from lasio

    Returns:
        Dictionary with extracted metadata
    """
    metadata = {
        "well_name": las.well.WELL.value if hasattr(las.well, 'WELL') else "Unknown",
        "company": las.well.COMP.value if hasattr(las.well, 'COMP') else "Unknown",
        "date": las.well.DATE.value if hasattr(las.well, 'DATE') else "Unknown",
        "version": las.version.VERS.value if hasattr(las.version, 'VERS') else "Unknown",
    }
    return metadata


def validate_las_curves(las: lasio.LASFile) -> List[str]:
    """
    Validate and return list of valid curves in LAS file.

    Args:
        las: LAS file object from lasio

    Returns:
        List of valid curve names
    """
    valid_curves = []
    for curve in las.curves:
        if hasattr(curve, 'data') and len(curve.data) > 0:
            valid_curves.append(curve.mnemonic)
    return valid_curves


def calculate_curve_statistics(las: lasio.LASFile, curve_name: str) -> Dict[str, float]:
    """
    Calculate basic statistics for a specific curve.

    Args:
        las: LAS file object from lasio
        curve_name: Name of the curve to analyze

    Returns:
        Dictionary with statistical measures
    """
    try:
        curve = las.curves[curve_name]
        data = curve.data

        stats = {
            "count": len(data),
            "min": float(data.min()),
            "max": float(data.max()),
            "mean": float(data.mean()),
            "std": float(data.std()),
        }
        return stats
    except KeyError:
        raise ValueError(f"Curve '{curve_name}' not found in LAS file")
    except Exception as e:
        raise ValueError(f"Error calculating statistics for curve '{curve_name}': {str(e)}")


def get_las_file_info(las: lasio.LASFile) -> Dict[str, Any]:
    """
    Get comprehensive information about LAS file.

    Args:
        las: LAS file object from lasio

    Returns:
        Dictionary with file information
    """
    info = {
        "metadata": extract_las_metadata(las),
        "curves": validate_las_curves(las),
        "total_curves": len(las.curves),
        "data_points": sum(len(curve.data) for curve in las.curves if hasattr(curve, 'data')),
    }
    return info
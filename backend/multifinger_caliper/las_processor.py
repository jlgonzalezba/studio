"""
LAS File Processing Module - Versión mínima
Contiene process_las_data(las) y export_las_curves_to_csv(las)
"""

import lasio
import csv
import os
import math
from typing import Dict, List, Any, Tuple

# Import utilities
from .utils import get_las_file_info, validate_las_curves


def process_las_data(las: lasio.LASFile) -> Dict[str, Any]:
    """
    Función mínima que procesa el objeto LAS ya creado.

    Args:
        las: LASFile object from lasio (ya creado en routes.py)

    Returns:
        Dictionary with processed LAS data
    """
    # Usa las utilidades para extraer información
    file_info = get_las_file_info(las)
    valid_curves = validate_las_curves(las)

    # Calcula el número total de puntos de datos
    total_points = file_info["data_points"]

    # Determina el formato del punto basado en la versión LAS
    version = file_info["metadata"]["version"]
    point_format_id = f"LAS_{version}" if version != "Unknown" else "LAS_2.0"

    return {
        "point_count": total_points,
        "point_format_id": point_format_id,
        "well_name": file_info["metadata"]["well_name"],
        "curves_found": valid_curves,
        "metadata": file_info["metadata"]
    }


def taubin_circle_fit(points: List[Tuple[float, float]]) -> Tuple[float, float, float]:
    """
    Ajuste robusto de círculo usando el método de Taubin.
    Minimiza la suma de distancias algebraicas al cuadrado.

    Args:
        points: Lista de tuplas (x, y) - puntos en coordenadas cartesianas

    Returns:
        Tupla (center_x, center_y, radius) - parámetros del círculo ajustado
    """
    if len(points) < 3:
        # Fallback a centroide simple
        center_x = sum(x for x, y in points) / len(points)
        center_y = sum(y for x, y in points) / len(points)
        radius = sum(math.sqrt((x - center_x)**2 + (y - center_y)**2) for x, y in points) / len(points)
        return center_x, center_y, radius

    # Extraer coordenadas
    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]
    n = len(points)

    # Calcular centroides
    x_mean = sum(x_coords) / n
    y_mean = sum(y_coords) / n

    # Centrar los puntos
    x_centered = [x - x_mean for x in x_coords]
    y_centered = [y - y_mean for y in y_coords]

    # Resolver el sistema lineal usando SVD
    # Matriz de diseño para el método de Taubin
    A = []
    B = []

    for i in range(n):
        x = x_centered[i]
        y = y_centered[i]
        A.append([x, y, 1])
        B.append(-(x**2 + y**2))

    # Resolver A * [a, b, c] = B usando SVD
    # donde el círculo es: a*x + b*y + c = -(x² + y²)
    # equivalente a: x² + y² + a*x + b*y + c = 0
    # con centro en (-a/2, -b/2) y radio sqrt((a²+b²)/4 - c)

    try:
        # Implementación simple de SVD para este caso específico
        # Usar eliminación gaussiana para resolver el sistema sobredeterminado
        AT = [[row[i] for row in A] for i in range(3)]  # Transpuesta de A
        ATA = [[sum(AT[i][k] * AT[j][k] for k in range(n)) for j in range(3)] for i in range(3)]
        ATB = [sum(AT[i][k] * B[k] for k in range(n)) for i in range(3)]

        # Resolver ATA * params = ATB usando eliminación gaussiana
        params = gaussian_elimination(ATA, ATB)

        if params:
            a, b, c = params
            # Centro del círculo
            center_x = -a/2 + x_mean
            center_y = -b/2 + y_mean
            # Radio
            radius = math.sqrt((a**2 + b**2)/4 - c)

            return center_x, center_y, radius
        else:
            # Fallback si la eliminación gaussiana falla
            center_x = x_mean
            center_y = y_mean
            radius = sum(math.sqrt((x - center_x)**2 + (y - center_y)**2) for x, y in zip(x_coords, y_coords)) / n
            return center_x, center_y, radius

    except Exception as e:
        print(f"[TAUBIN] Error en ajuste: {e}, usando fallback")
        # Fallback a centroide
        center_x = x_mean
        center_y = y_mean
        radius = sum(math.sqrt((x - center_x)**2 + (y - center_y)**2) for x, y in zip(x_coords, y_coords)) / n
        return center_x, center_y, radius


def gaussian_elimination(A, B):
    """
    Resuelve sistema lineal A*x = B usando eliminación gaussiana.
    Para matrices 3x3.
    """
    n = len(A)
    # Crear matriz aumentada
    augmented = [A[i] + [B[i]] for i in range(n)]

    # Eliminación hacia adelante
    for i in range(n):
        # Encontrar pivote
        max_row = i
        for k in range(i+1, n):
            if abs(augmented[k][i]) > abs(augmented[max_row][i]):
                max_row = k

        # Intercambiar filas
        augmented[i], augmented[max_row] = augmented[max_row], augmented[i]

        # Hacer cero los elementos debajo del pivote
        for k in range(i+1, n):
            factor = augmented[k][i] / augmented[i][i] if augmented[i][i] != 0 else 0
            for j in range(i, n+1):
                augmented[k][j] -= factor * augmented[i][j]

    # Sustitución hacia atrás
    x = [0] * n
    for i in range(n-1, -1, -1):
        if augmented[i][i] == 0:
            return None  # Sistema singular
        x[i] = augmented[i][n]
        for j in range(i+1, n):
            x[i] -= augmented[i][j] * x[j]
        x[i] /= augmented[i][i]

    return x


def apply_taubin_centralization(r_values: List[float]) -> List[float]:
    """
    Aplica centralización usando ajuste robusto de círculo (método de Taubin).
    Encuentra el círculo que mejor se ajusta a las mediciones y centraliza.

    Args:
        r_values: Lista de valores radiales (R01, R02, ..., RN)

    Returns:
        Lista de valores radiales centralizados
    """
    if not r_values or len(r_values) < 3:
        return r_values

    num_points = len(r_values)

    # Convertir a coordenadas cartesianas
    points_cartesian = []
    for i, r in enumerate(r_values):
        if r is not None and r > 0:
            angle = 2 * math.pi * i / num_points
            x = r * math.cos(angle)
            y = r * math.sin(angle)
            points_cartesian.append((x, y))

    if len(points_cartesian) < 3:
        return r_values

    # Aplicar ajuste de círculo usando método de Taubin
    center_x, center_y, fitted_radius = taubin_circle_fit(points_cartesian)

    print(f"[TAUBIN] Círculo ajustado - Centro: ({center_x:.3f}, {center_y:.3f}), Radio: {fitted_radius:.3f}")

    # Recalcular radios desde el centro del círculo ajustado
    centralized_r_values = []
    for i, r in enumerate(r_values):
        if r is not None and r > 0:
            angle = 2 * math.pi * i / num_points
            x_orig = r * math.cos(angle)
            y_orig = r * math.sin(angle)

            dx = x_orig - center_x
            dy = y_orig - center_y
            new_r = math.sqrt(dx**2 + dy**2)
            centralized_r_values.append(new_r)
        else:
            centralized_r_values.append(r)

    return centralized_r_values


def export_las_curves_to_csv(las: lasio.LASFile, output_path: str = None) -> Dict[str, str]:
    """
    Exporta todas las curvas del archivo LAS a dos archivos CSV:
    1. Archivo original con los datos tal cual
    2. Archivo centralizado (espacio reservado para algoritmo de centralización)

    Args:
        las: LASFile object from lasio
        output_path: Ruta donde guardar el CSV (opcional)

    Returns:
        Dict con las rutas de ambos archivos CSV creados
    """
    # Nombre por defecto basado en el pozo
    well_name = las.well.WELL.value if hasattr(las.well, 'WELL') else "unknown_well"

    # Crear directorio exports en la raíz del proyecto
    exports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "exports")
    exports_dir = os.path.abspath(exports_dir)
    os.makedirs(exports_dir, exist_ok=True)

    # Definir rutas para ambos archivos
    original_path = os.path.join(exports_dir, f"{well_name}_curves.csv")
    centralized_path = os.path.join(exports_dir, f"{well_name}_curves_centralized.csv")
    decentralized_path = os.path.join(exports_dir, f"{well_name}_curves_decentralized.csv")

    # Obtener todas las curvas válidas
    valid_curves = []
    for curve in las.curves:
        if hasattr(curve, 'data') and len(curve.data) > 0:
            valid_curves.append(curve)

    if not valid_curves:
        raise ValueError("No se encontraron curvas válidas en el archivo LAS")

    # Crear lista de datos para CSV
    csv_data = []

    # Headers (nombres de las curvas)
    headers = [curve.mnemonic for curve in valid_curves]
    csv_data.append(headers)

    # Datos de las curvas
    num_rows = len(valid_curves[0].data)
    for i in range(num_rows):
        row = []
        for curve in valid_curves:
            value = curve.data[i]
            # Convertir valores nulos (-999.25) a vacío
            if value == -999.25 or str(value).lower() in ['nan', 'inf', '-inf']:
                row.append("")  # Celda vacía para valores nulos
            else:
                row.append(str(value))
        csv_data.append(row)

    # Escribir archivo CSV ORIGINAL
    with open(original_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(csv_data)

    print(f"[CSV] Archivo CSV original creado: {original_path}")
    print(f"[CSV] Curvas exportadas: {len(valid_curves)}")
    print(f"[CSV] Filas de datos: {num_rows}")

    # Crear archivo CSV CENTRALIZADO con algoritmo de Elipse Excéntrica aplicado
    centralized_data = [csv_data[0]]  # Copiar headers

    # Identificar columnas R para aplicar el algoritmo
    r_columns_indices = []
    for i, header in enumerate(csv_data[0]):
        if header and header.startswith('R') and header[1:].isdigit():
            r_columns_indices.append(i)

    print(f"[CENTRALIZATION] Aplicando algoritmo de Elipse Excéntrica a {len(r_columns_indices)} columnas R")

    # Procesar cada fila aplicando el algoritmo de centralización
    for row in csv_data[1:]:  # Saltar headers
        new_row = row.copy()

        # Extraer valores R de esta fila
        r_values = []
        for idx in r_columns_indices:
            if idx < len(row):
                try:
                    val = row[idx]
                    if val and val != "" and val != "-999.25":
                        r_values.append(float(val))
                    else:
                        r_values.append(None)
                except (ValueError, TypeError):
                    r_values.append(None)
            else:
                r_values.append(None)

        # Aplicar algoritmo de elipse excéntrica
        if r_values and any(v is not None for v in r_values):
            centralized_r_values = apply_taubin_centralization(r_values)

            # Actualizar la fila con los valores centralizados
            for i, idx in enumerate(r_columns_indices):
                if i < len(centralized_r_values) and centralized_r_values[i] is not None:
                    new_row[idx] = str(centralized_r_values[i])

        centralized_data.append(new_row)

    # Agregar comentario indicando que se aplicó el algoritmo

    with open(centralized_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(centralized_data)

    # Crear archivo CSV DESCENTRALIZADO (datos originales sin procesar)
    with open(decentralized_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(csv_data)

    print(f"[CSV] Archivo CSV descentralizado creado: {decentralized_path}")

    return {
        "original_csv": original_path,
        "centralized_csv": centralized_path,
        "decentralized_csv": decentralized_path
    }



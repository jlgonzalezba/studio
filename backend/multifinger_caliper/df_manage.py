import pandas as pd
import os
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional

def get_exports_dir() -> str:
    """Obtiene la ruta del directorio exports"""
    exports_dir = os.path.join(os.path.dirname(__file__), "..", "..", "exports")
    return os.path.abspath(exports_dir)

def get_latest_csv_dataframe(use_centralized: bool = True) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
    """
    Obtiene el DataFrame del archivo CSV más reciente en exports/

    Args:
        use_centralized: Si True, busca archivos centralizados; si False, busca archivos originales

    Returns:
        Tuple[DataFrame, filename] o (None, None) si no hay archivos
    """
    exports_dir = get_exports_dir()

    if not os.path.exists(exports_dir):
        print(f"[ERROR] Directorio exports no existe: {exports_dir}")
        return None, None

    # Buscar archivos CSV según el tipo solicitado
    if use_centralized:
        # Buscar archivos centralizados
        csv_files = [f for f in os.listdir(exports_dir) if f.endswith('.csv') and '_centralized' in f]
        if not csv_files:
            print("[ERROR] No hay archivos CSV centralizados en exports/")
            return None, None
    else:
        # Buscar archivos descentralizados (terminan en _decentralized.csv)
        csv_files = [f for f in os.listdir(exports_dir) if f.endswith('_decentralized.csv')]
        if not csv_files:
            print("[ERROR] No hay archivos CSV descentralizados en exports/")
            return None, None

    # Encontrar el archivo más reciente
    file_info = []
    for csv_file in csv_files:
        file_path = os.path.join(exports_dir, csv_file)
        mtime = os.path.getmtime(file_path)
        file_info.append({
            'name': csv_file,
            'path': file_path,
            'time': mtime
        })

    # Ordenar por fecha más reciente
    file_info.sort(key=lambda x: x['time'], reverse=True)
    latest_file = file_info[0]

    try:
        df = pd.read_csv(latest_file['path'])
        print(f"[SUCCESS] CSV cargado: {latest_file['name']} ({len(df)} filas, {len(df.columns)} columnas)")
        return df, latest_file['name']
    except Exception as e:
        print(f"[ERROR] Error al leer CSV {latest_file['name']}: {str(e)}")
        return None, None

def detect_r_curves(df: pd.DataFrame) -> Dict:
    """
    Detecta curvas R (R01, R02, ..., R40) en el DataFrame

    Args:
        df: DataFrame con las curvas del archivo LAS

    Returns:
        Dict con información sobre las curvas R encontradas
    """
    if df is None or df.empty:
        return {"count": 0, "curves": [], "error": "DataFrame vacío"}

    # Buscar columnas que empiecen con 'R' seguido de números
    r_pattern = re.compile(r'^R\d{1,2}$')
    r_columns = [col for col in df.columns if r_pattern.match(col)]

    # Filtrar solo R01-R40
    valid_r_curves = []
    for col in r_columns:
        match = re.match(r'R(\d{1,2})', col)
        if match:
            valid_r_curves.append(col)

    valid_r_curves.sort()  # Ordenar R01, R02, etc.

    return {
        "count": len(valid_r_curves),
        "curves": valid_r_curves,
        "total_columns": len(df.columns),
        "depth_column": "DEPT" if "DEPT" in df.columns else df.columns[0]  # Asumir primera columna como profundidad
    }

def calculate_caliper_statistics(df: pd.DataFrame, r_curves_info: Dict) -> Dict:
    """
    Calcula estadísticas de min/max/promedio para las curvas R por punto de profundidad.
    Método: calcula diámetros como radio × 2 para cada medición R.

    Args:
        df: DataFrame con las curvas
        r_curves_info: Información sobre las curvas R detectadas

    Returns:
        Dict con estadísticas calculadas y datos para graficar
    """
    print(f"[DEBUG] Starting calculate_caliper_statistics with {r_curves_info['count']} R curves")

    if r_curves_info["count"] == 0:
        print("[ERROR] No R curves found")
        return {"error": "No se encontraron curvas R válidas"}

    depth_col = r_curves_info["depth_column"]
    r_columns = r_curves_info["curves"]

    print(f"[DEBUG] Depth column: {depth_col}, R columns: {r_columns[:5]}...")

    # Verificar que existe columna de profundidad
    if depth_col not in df.columns:
        print(f"[ERROR] Depth column '{depth_col}' not found in DataFrame")
        return {"error": f"Columna de profundidad '{depth_col}' no encontrada"}

    # Filtrar filas donde la profundidad no sea NaN
    df_clean = df.dropna(subset=[depth_col])
    print(f"[DEBUG] After dropping NaN depths: {len(df_clean)} rows")

    if df_clean.empty:
        print("[ERROR] No valid depth data after cleaning")
        return {"error": "No hay datos válidos de profundidad"}

    # Extraer datos de profundidad
    depth_values = df_clean[depth_col].values.tolist()
    print(f"[DEBUG] Depth values sample: {depth_values[:5]}")

    # Calcular estadísticas para cada punto de profundidad
    min_values = []
    max_values = []
    avg_values = []

    print(f"[DEBUG] Processing {len(df_clean)} rows...")

    for idx, row in df_clean.iterrows():
        r_values = []

        # Recopilar valores de todas las curvas R para este punto
        for r_col in r_columns:
            if r_col in df_clean.columns:
                value = row[r_col]

                # Simplificar el filtro: incluir cualquier valor numérico válido
                try:
                    # Intentar convertir a float
                    float_value = float(value)

                    # Solo verificar que sea un número finito y no NaN
                    if pd.notna(float_value) and not pd.isna(float_value) and float_value != float('inf') and float_value != float('-inf'):
                        # Incluir cualquier valor numérico razonable (no valores extremos)
                        if -1000 < float_value < 1000:
                            r_values.append(float_value)
                except (ValueError, TypeError):
                    # Si no se puede convertir, ignorar silenciosamente
                    pass

        if r_values:
            # Calcular diámetros: radio × 2
            diameters = [r * 2 for r in r_values]
            min_values.append(min(diameters))
            max_values.append(max(diameters))
            avg_values.append(sum(diameters) / len(diameters))
        else:
            # Si no hay valores válidos, usar 0 como placeholder
            min_values.append(0)
            max_values.append(0)
            avg_values.append(0)

        # Debug output for first few rows
        if idx < 3:
            print(f"[DEBUG] Row {idx}: {len(r_values)} valid R values, diameters: {[r * 2 for r in r_values[:3]] if r_values else 'None'}")

    # Filtrar valores 0 para el gráfico (placeholders)
    valid_indices = [i for i, v in enumerate(avg_values) if v != 0]

    print(f"[DEBUG] Total points: {len(avg_values)}, Valid points: {len(valid_indices)}")
    print(f"[DEBUG] Sample avg_values: {avg_values[:5]}")

    if not valid_indices:
        print("[ERROR] No valid data points found for plotting")
        return {"error": "No hay datos válidos para graficar"}

    # Solo usar puntos válidos
    plot_depth = [depth_values[i] for i in valid_indices]
    plot_min = [min_values[i] for i in valid_indices]
    plot_max = [max_values[i] for i in valid_indices]
    plot_avg = [avg_values[i] for i in valid_indices]

    # Invertir el orden de los datos para que la profundidad menor aparezca arriba
    plot_depth.reverse()
    plot_min.reverse()
    plot_max.reverse()
    plot_avg.reverse()

    print(f"[DEBUG] Final plot data lengths: depth={len(plot_depth)}, min={len(plot_min)}, max={len(plot_max)}, avg={len(plot_avg)}")

    return {
        "plot_data": {
            "depth": plot_depth,
            "min_diameter": plot_min,
            "max_diameter": plot_max,
            "avg_diameter": plot_avg
        },
        "statistics": {
            "total_points": len(plot_depth),
            "depth_range": [min(plot_depth), max(plot_depth)],
            "diameter_range": [min(plot_min + plot_max + plot_avg), max(plot_min + plot_max + plot_avg)],
            "avg_diameter_stats": {
                "min": min(plot_avg),
                "max": max(plot_avg),
                "mean": sum(plot_avg) / len(plot_avg)
            }
        },
        "r_curves_info": r_curves_info
    }

def extract_depth_and_r_values(df: pd.DataFrame) -> Dict:
    """
    Extrae la profundidad y los valores de las variables R, GR y temperatura del DataFrame

    Args:
        df: DataFrame con las curvas del archivo LAS

    Returns:
        Dict con profundidad y valores de curvas por punto de profundidad
    """
    if df is None or df.empty:
        return {"error": "DataFrame vacío"}

    # Detectar columna de profundidad
    depth_col = "DEPT" if "DEPT" in df.columns else df.columns[0]

    # Detectar curvas R
    r_pattern = re.compile(r'^R\d{1,2}$')
    r_columns = [col for col in df.columns if r_pattern.match(col)]
    valid_r_curves = []
    for col in r_columns:
        match = re.match(r'R(\d{1,2})', col)
        if match:
            num = int(match.group(1))
            if 1 <= num <= 40:
                valid_r_curves.append(col)
    valid_r_curves.sort()

    # Detectar curvas adicionales: GR y temperatura
    gr_curves = []
    temp_curves = []

    print(f"[DEBUG] First 10 available columns: {list(df.columns)[:10]}")
    print(f"[DEBUG] Total columns: {len(df.columns)}")

    # Buscar columnas relacionadas con GR y temperatura
    gr_related = [col for col in df.columns if 'GR' in col.upper()]
    temp_related = [col for col in df.columns if 'TEMP' in col.upper() or 'WTEMP' in col.upper()]
    print(f"[DEBUG] GR-related columns: {gr_related}")
    print(f"[DEBUG] Temperature-related columns: {temp_related}")

    # Buscar GR (gamma ray) - posibles nombres
    gr_candidates = ['GR', 'GTC_GR', 'GR_EDTC', 'CGR', 'SGR']
    for candidate in gr_candidates:
        if candidate in df.columns:
            gr_curves.append(candidate)
            print(f"[DEBUG] Found GR curve: {candidate}")
            break  # Usar el primero encontrado

    # Buscar temperatura - posibles nombres
    temp_candidates = ['TEMP', 'GTC_WTEMP', 'WTEMP', 'BHST', 'BHT']
    for candidate in temp_candidates:
        if candidate in df.columns:
            temp_curves.append(candidate)
            print(f"[DEBUG] Found temperature curve: {candidate}")
            break  # Usar el primero encontrado

    print(f"[DEBUG] GR curves found: {gr_curves}")
    print(f"[DEBUG] Temperature curves found: {temp_curves}")

    # Log sample values for debugging
    if gr_curves:
        sample_gr = df[gr_curves[0]].head(3).tolist()
        print(f"[DEBUG] Sample GR values: {sample_gr}")
    if temp_curves:
        sample_temp = df[temp_curves[0]].head(3).tolist()
        print(f"[DEBUG] Sample temperature values: {sample_temp}")

    if not valid_r_curves:
        return {"error": "No se encontraron curvas R válidas"}

    # Filtrar filas donde la profundidad no sea NaN
    df_clean = df.dropna(subset=[depth_col])

    if df_clean.empty:
        return {"error": "No hay datos válidos de profundidad"}

    # Extraer datos
    depth_values = df_clean[depth_col].values.tolist()

    # Extraer valores R para cada punto de profundidad y transponer los datos
    r_values_by_depth = []
    for idx, row in df_clean.iterrows():
        depth_r_values = []
        for r_col in valid_r_curves:
            value = row.get(r_col)
            try:
                float_value = float(value)
                if pd.notna(float_value) and -1000 < float_value < 1000:
                    depth_r_values.append(float_value)
                else:
                    depth_r_values.append(None) # Mantener el placeholder si no es válido
            except (ValueError, TypeError):
                depth_r_values.append(None)
        r_values_by_depth.append(depth_r_values)


    # Extraer valores GR
    gr_data = {}
    for gr_col in gr_curves:
        gr_values = []
        for idx, row in df_clean.iterrows():
            value = row[gr_col]
            try:
                float_value = float(value)
                if pd.notna(float_value) and not pd.isna(float_value):
                    gr_values.append(float_value)
                else:
                    gr_values.append(None)
            except (ValueError, TypeError):
                gr_values.append(None)
        gr_data[gr_col] = gr_values

    # Extraer valores de temperatura
    temp_data = {}
    for temp_col in temp_curves:
        temp_values = []
        for idx, row in df_clean.iterrows():
            value = row[temp_col]
            try:
                float_value = float(value)
                if pd.notna(float_value) and not pd.isna(float_value):
                    temp_values.append(float_value)
                else:
                    temp_values.append(None)
            except (ValueError, TypeError):
                temp_values.append(None)
        temp_data[temp_col] = temp_values

    return {
        "depth": depth_values,
        "r_curves": r_values_by_depth,
        "gr_curves": gr_curves,
        "gr_data": gr_data,
        "temp_curves": temp_curves,
        "temp_data": temp_data,
        "total_points": len(depth_values)
    }


def process_caliper_data(use_centralized: bool = True) -> Dict:
    """
    Función principal que procesa los datos del caliper más reciente

    Args:
        use_centralized: Si True, usa datos centralizados; si False, usa datos originales

    Returns:
        Dict con todos los datos procesados para el frontend
    """
    # Obtener el CSV más reciente (centralizado u original según el parámetro)
    df, filename = get_latest_csv_dataframe(use_centralized)

    if df is None:
        return {"error": "No se pudo cargar el archivo CSV más reciente"}

    # Detectar curvas R
    r_curves_info = detect_r_curves(df)

    if r_curves_info["count"] == 0:
        return {
            "error": "No se encontraron curvas R (R01-R40) en el archivo",
            "filename": filename,
            "total_columns": r_curves_info["total_columns"],
            "available_columns": list(df.columns)
        }

    # Calcular estadísticas
    stats_result = calculate_caliper_statistics(df, r_curves_info)

    if "error" in stats_result:
        return {
            "error": stats_result["error"],
            "filename": filename,
            "r_curves_info": r_curves_info
        }

    # Extraer datos crudos de profundidad y R
    raw_data = extract_depth_and_r_values(df)
    print(f"[DEBUG] Raw data extracted: depth_points={raw_data.get('total_points', 0)}, r_curves={len(raw_data.get('r_curves', []))}")

    # Importar y calcular collars data - ejecutar joints.py si es necesario
    try:
        import pandas as pd
        import os
        collars_path = os.path.join(os.path.dirname(__file__), "..", "..", "exports", "collars.csv")

        # Verificar si el archivo collars.csv existe y es más reciente que el CSV de datos
        csv_path = os.path.join(os.path.dirname(__file__), "..", "..", "exports", filename)
        csv_mtime = os.path.getmtime(csv_path) if os.path.exists(csv_path) else 0
        collars_mtime = os.path.getmtime(collars_path) if os.path.exists(collars_path) else 0

        # Forzar regeneración de collars si el archivo actual es diferente al último procesado
        # Esto asegura que los collars se regeneren para cada pozo diferente
        if not os.path.exists(collars_path) or collars_mtime < csv_mtime:
            print(f"[INFO] Generating collars for {filename}...")
            # Ejecutar la lógica de joints.py directamente
            import subprocess
            import sys
            try:
                # Ejecutar joints.py como script separado
                result = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "joints.py")],
                                      capture_output=True, text=True, cwd=os.path.dirname(__file__))
                if result.returncode == 0:
                    print(f"[INFO] Collars generated successfully for {filename}")
                else:
                    print(f"[WARNING] Error generating collars: {result.stderr}")
            except Exception as e:
                print(f"[WARNING] Could not execute joints.py: {e}")

            # Ejecutar statistics.py después de joints.py
            try:
                result_stats = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "statistics.py")],
                                              capture_output=True, text=True, cwd=os.path.dirname(__file__))
                if result_stats.returncode == 0:
                    print(f"[INFO] Statistics generated successfully for {filename}")
                else:
                    print(f"[WARNING] Error generating statistics: {result_stats.stderr}")
            except Exception as e:
                print(f"[WARNING] Could not execute statistics.py: {e}")

        if os.path.exists(collars_path):
            collars_df = pd.read_csv(collars_path)
            # Filtrar filas que contengan NaN o valores vacíos
            collars_df_clean = collars_df.dropna(how='all')  # Eliminar filas completamente vacías
            # Convertir a lista filtrando valores NaN
            collars_data = []
            for _, row in collars_df_clean.iterrows():
                clean_row = []
                for val in row.values:
                    # Verificar si el valor es válido (no NaN, no infinito, no string vacío)
                    if pd.notna(val) and str(val).strip() != '' and str(val).lower() != 'nan':
                        try:
                            # Intentar convertir a float
                            float_val = float(val)
                            if not (float_val != float_val) and not pd.isna(float_val):  # Verificar NaN
                                clean_row.append(float_val)
                            else:
                                clean_row.append(None)
                        except (ValueError, TypeError):
                            clean_row.append(None)
                    else:
                        clean_row.append(None)

                # Solo agregar filas que tengan al menos un valor válido
                if any(v is not None for v in clean_row):
                    collars_data.append(clean_row)

            print(f"[DEBUG] Collars data loaded: {len(collars_data)} collars (filtered from {len(collars_df)})")
        else:
            print(f"[WARNING] Collars CSV file not found at {collars_path}")
            collars_data = []
    except Exception as e:
        print(f"[WARNING] Could not load collars data: {e}")
        collars_data = []

    # Retornar resultado completo
    return {
        "filename": filename,
        "total_points": stats_result["statistics"]["total_points"],
        "r_curves_info": r_curves_info,
        "plot_data": stats_result["plot_data"],
        "statistics": stats_result["statistics"],
        "raw_data": raw_data,
        "collars_data": collars_data
    }

# Código de prueba (solo se ejecuta si se corre este archivo directamente)
if __name__ == "__main__":
    result = process_caliper_data()
    print("\n[RESULTADO DEL PROCESAMIENTO]")
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Archivo: {result['filename']}")
        print(f"Curvas R detectadas: {result['r_curves_info']['count']}")
        print(f"Puntos totales: {result['total_points']}")
        print(f"Rango de profundidad: {result['statistics']['depth_range']}")
        print(f"Rango de radio: {result['statistics']['radius_range']}")


# Force reload
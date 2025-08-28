"use client";

import { useState, useEffect } from "react";
import { Sprout, ArrowRightLeft } from "lucide-react";

// 1. Definimos todas las unidades y categorías, igual que en el backend de Python
const CONVERSION_DATA: Record<string, string[]> = {
  "Longitud": [
    "metro (m)", "kilómetro (km)", "centímetro (cm)", "milímetro (mm)",
    "micrómetro (µm)", "nanómetro (nm)", "pulgada (in)", "pie (ft)",
    "yarda (yd)", "milla (mi)", "milla náutica (nmi)",
  ],
  "Masa": [
    "kilogramo (kg)", "gramo (g)", "miligramo (mg)", "microgramo (µg)",
    "tonelada métrica (t)", "tonelada corta EUA (ton US)", "libra (lb)", "onza (oz)",
  ],
  "Tiempo": [
    "segundo (s)", "milisegundo (ms)", "microsegundo (µs)", "minuto (min)",
    "hora (h)", "día (d)", "semana (wk)",
  ],
  "Corriente eléctrica": [
    "ampere (A)", "milliampere (mA)", "microampere (µA)", "kiloampere (kA)",
  ],
  "Temperatura": ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"],
  "Cantidad de sustancia": ["mol (mol)", "milimol (mmol)", "micromol (µmol)"],
  "Intensidad luminosa": [
    "candela (cd)", "millicandela (mcd)", "kilocandela (kcd)",
  ],
};

const CATEGORIES = Object.keys(CONVERSION_DATA);

export default function UniversalConverterPage() {
  // 2. Estado inicial para la nueva interfaz dinámica
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [inputValue, setInputValue] = useState("1");
  const [debouncedInputValue, setDebouncedInputValue] = useState(inputValue);
  const [fromUnit, setFromUnit] = useState(CONVERSION_DATA[category][0]);
  const [toUnit, setToUnit] = useState(CONVERSION_DATA[category][1]);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUnits = CONVERSION_DATA[category];

  // 3. Función para manejar el cambio de categoría
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const newUnits = CONVERSION_DATA[newCategory];
    setFromUnit(newUnits[0]);
    setToUnit(newUnits.length > 1 ? newUnits[1] : newUnits[0]);
    setInputValue("1");
    setResult("");
    setError("");
  };

  // Nueva función para intercambiar unidades
  const handleSwapUnits = () => {
    if (fromUnit === toUnit) return;
    // Intercambia las unidades
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    // Usa el resultado anterior como el nuevo valor de entrada
    if (result && !error) {
      setInputValue(result);
    }
  };

  // Optimización: Retrasar la llamada a la API hasta que el usuario deje de escribir
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 300); // Espera 300ms después de la última pulsación de tecla

    // Limpia el temporizador si el usuario sigue escribiendo
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // 4. useEffect actualizado para llamar a la API con la categoría
  useEffect(() => {
    const handleConversion = async () => {
      const numericValue = parseFloat(debouncedInputValue);
      if (isNaN(numericValue)) {
        setResult("");
        return;
      }

      if (fromUnit === toUnit) {
        setResult(numericValue.toString());
        setError("");
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/convert`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: numericValue,
            category,
            fromUnit,
            toUnit,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'La conversión falló');
        }
        setResult(data.result);
      } catch (error: any) {
        console.error(error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          setError('No se pudo conectar al servidor. ¿Está el backend de Python en ejecución?');
        } else {
          setError(error.message);
        }
        setResult("");
      } finally {
        setIsLoading(false);
      }
    };

    handleConversion();
  }, [debouncedInputValue, fromUnit, toUnit, category]);

  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Sprout className="h-10 w-10 text-green-500" />
        <h1 className="text-4xl font-bold text-gray-800">Universal Converter</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="mb-6">
          <label htmlFor="category-select" className="block mb-2 font-semibold text-gray-700">
            Selecciona una categoría de conversión
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="from-unit" className="mb-2 font-semibold text-gray-700">Desde</label>
              <select id="from-unit" value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="p-2 border rounded-md w-full">
                {currentUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSwapUnits}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Intercambiar unidades"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col">
              <label htmlFor="to-unit" className="mb-2 font-semibold text-gray-700">Hacia</label>
              <select id="to-unit" value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="p-2 border rounded-md w-full">
                {currentUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <input
              id="input-value"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="p-2 border rounded-md w-full text-lg"
            />
            <div className="p-2 border rounded-md w-full bg-gray-100 text-lg font-bold text-gray-800 min-h-[42px] flex items-center justify-end">
              {isLoading ? 'Calculando...' : error ? <span className="text-red-500 text-sm">{error}</span> : result}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

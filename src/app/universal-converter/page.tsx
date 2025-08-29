"use client";
import { useState, useEffect } from "react";
import { Sprout, ArrowRightLeft } from "lucide-react";

// 1. Define all units and categories, same as in the Python backend
const CONVERSION_DATA: Record<string, string[]> = {
  "Length": [
    "meter (m)", "kilometer (km)", "centimeter (cm)", "millimeter (mm)",
    "micrometer (µm)", "nanometer (nm)", "inch (in)", "foot (ft)",
    "yard (yd)", "mile (mi)", "nautical mile (nmi)",
  ],
  "Mass": [
    "kilogram (kg)", "gram (g)", "milligram (mg)", "microgram (µg)",
    "metric ton (t)", "US short ton (ton US)", "pound (lb)", "ounce (oz)",
  ],
  "Time": [
    "second (s)", "millisecond (ms)", "microsecond (µs)", "minute (min)",
    "hour (h)", "day (d)", "week (wk)",
  ],
  "Electric Current": [
    "ampere (A)", "milliampere (mA)", "microampere (µA)", "kiloampere (kA)",
  ],
  "Temperature": ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)"],
  "Amount of Substance": ["mole (mol)", "millimole (mmol)", "micromole (µmol)"],
  "Luminous Intensity": [
    "candela (cd)", "millicandela (mcd)", "kilocandela (kcd)",
  ],
};

const CATEGORIES = Object.keys(CONVERSION_DATA);

export default function UniversalConverterPage() {
  // 2. Initial state for the new dynamic interface
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [inputValue, setInputValue] = useState("1");
  const [debouncedInputValue, setDebouncedInputValue] = useState(inputValue);
  const [fromUnit, setFromUnit] = useState(CONVERSION_DATA[category][0]);
  const [toUnit, setToUnit] = useState(CONVERSION_DATA[category][1]);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUnits = CONVERSION_DATA[category];

  // 3. Function to handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const newUnits = CONVERSION_DATA[newCategory];
    setFromUnit(newUnits[0]);
    setToUnit(newUnits.length > 1 ? newUnits[1] : newUnits[0]);
    setInputValue("1");
    setResult("");
    setError("");
  };

  // New function to swap units
  const handleSwapUnits = () => {
    if (fromUnit === toUnit) return;
    // Swap the units
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    // Use the previous result as the new input value
    if (result && !error) {
      setInputValue(result);
    }
  };

  // Optimization: Delay the API call until the user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 300); // Wait 300ms after the last keystroke

    // Clear the timer if the user is still typing
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // 4. useEffect updated to call the API with the category
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
          throw new Error(data.error || 'Conversion failed');
        }
        setResult(data.result);
      } catch (error: any) {
        console.error(error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          setError('Could not connect to the server. Is the Python backend running?');
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
            Select a conversion category
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
              <label htmlFor="from-unit" className="mb-2 font-semibold text-gray-700">From</label>
              <select id="from-unit" value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="p-2 border rounded-md w-full">
                {currentUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSwapUnits}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Swap units"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col">
              <label htmlFor="to-unit" className="mb-2 font-semibold text-gray-700">To</label>
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
              {isLoading ? (
                <div className="h-6 bg-gray-300 rounded-md w-3/4 animate-pulse"></div>
              ) : error ? (
                <span className="text-red-500 text-sm">{error}</span>
              ) : (
                result
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
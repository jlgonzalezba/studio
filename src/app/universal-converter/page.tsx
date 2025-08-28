import { Sprout } from "lucide-react";

export default function UniversalConverterPage() {
  return (
    <main className="flex-grow container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Sprout className="h-10 w-10 text-green-500" />
        <h1 className="text-4xl font-bold text-gray-800">Universal Converter</h1>
      </div>
      <p className="text-lg text-gray-600">Esta es la página para el conversor universal. ¡Aquí construiremos la funcionalidad!</p>
    </main>
  );
}
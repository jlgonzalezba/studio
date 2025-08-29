"use client";

import { Sprout } from "lucide-react";

export default function UniversalConverterPage() {
  // La URL donde está corriendo tu app de Streamlit (puerto por defecto 8501)
  const streamlitUrl = "https://studio-ixvf53xksdscwu3rucuyry.streamlit.app/?embed=true";

  return (
    <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Sprout className="h-10 w-10 text-green-500" />
        <h1 className="text-4xl font-bold text-gray-800">
          Conversor Universal
        </h1>
      </div>
      
      {/* Contenedor que se ajusta para ocupar el espacio disponible */}
      <div className="bg-white p-1 rounded-lg shadow-md flex-grow" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          src={streamlitUrl}
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '800px', borderRadius: '8px' }}
          title="Conversor Universal Streamlit"
        >
          <p>Tu navegador no soporta iframes.</p>
        </iframe>
      </div>
    </main>
  );
}
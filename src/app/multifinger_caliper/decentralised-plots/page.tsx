"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useMultifingerCaliper } from "../layout";

// An array for menu items to keep the code clean.
const menuItems = [
  { name: "Multifinger Home", href: "/multifinger_caliper" },
  { name: "Decentralised Plots", href: "/multifinger_caliper/decentralised-plots" },
  { name: "Reports", href: "#" },
  { name: "Settings", href: "#" },
  { name: "Help", href: "#" },
];

export default function DecentralisedPlotsPage() {
  const { state } = useMultifingerCaliper();
  const pathname = usePathname();

  const {
    fileInfo,
    error,
    fileLoaded,
    plotData,
    isProcessed
  } = state;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header/>
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-50 border-r border-gray-200 p-5">
          <nav className="flex flex-col space-y-2">
            <p className="font-bold text-lg text-gray-800 mb-4">Menu</p>
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200 ${
                  pathname === item.href ? 'bg-blue-100 text-blue-800 font-bold' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 flex flex-col">
          <div className="border-b border-gray-200 pb-5 mb-5">
            <h1 className="text-3xl font-bold text-gray-800">Decentralised Plots</h1>
            <p className="text-lg text-gray-500 mt-2">Decentralised Plots Page</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            {/* Área para mostrar información del archivo o errores */}
            <div className="mt-4 text-center h-6">
              {fileInfo && <p className="text-green-600">{fileInfo}</p>}
              {error && <p className="text-red-600">{error}</p>}
            </div>

            {/* Content for decentralised plots will go here */}
            {isProcessed && plotData ? (
              <div className="w-full mt-8">
                <p>Decentralised plots content with shared data available.</p>
                {/* Add decentralised plots specific components here */}
              </div>
            ) : (
              <p>Please load and process data from the main page first.</p>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
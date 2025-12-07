"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// An array for menu items to keep the code clean.
const menuItems = [
  { name: "Multifinger Home", href: "/multifinger_caliper" },
  { name: "Integrity Table", href: "/multifinger_caliper/integrity-table" },
  { name: "Requirements", href: "/multifinger_caliper/requirements" },
  { name: "Settings", href: "#" },
  { name: "Help", href: "#" },
];

export default function IntegrityTablePage() {
  const pathname = usePathname();

  // Function to handle integrity table download
  const handleDownloadIntegrityTable = async () => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const backendUrl = isDevelopment ? 'http://localhost:8000' : 'https://studio-2lx4.onrender.com';

      const response = await fetch(`${backendUrl}/api/multifinger-caliper/download-integrity-table`);

      if (!response.ok) {
        throw new Error('Failed to download integrity table');
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'integrity_table.xlsx';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading integrity table:', error);
      alert('Error downloading integrity table. Please make sure data has been processed first.');
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-800">Integrity Table</h1>
            <p className="text-lg text-gray-500 mt-2">Integrity Table Page</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            {/* Download Integrity Table Button */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleDownloadIntegrityTable}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Download Integrity Table
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
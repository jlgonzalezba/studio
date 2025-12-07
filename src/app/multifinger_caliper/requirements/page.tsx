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

export default function RequirementsPage() {
  const pathname = usePathname();

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
            <h1 className="text-3xl font-bold text-gray-800">Requirements</h1>
            <p className="text-lg text-gray-500 mt-2">Requirements Page</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                LAS File Requirements
              </h2>

              <p className="text-gray-600 mb-6">
                These are some requirements for your .LAS file to ensure the application works properly:
              </p>

              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  For now, we only support logs recorded in feet. (Meters support coming soon.)
                </li>
                <li>
                  The step must be 0.1 ft / measurement.
                </li>
                <li>
                  Data must run from top to bottom.
                  <br />
                  <span className="text-sm text-gray-500 ml-6 block mt-1">
                    Example: STRT.FT 10.0 - STOP.FT 500.0
                  </span>
                </li>
                <li>
                  Make sure your caliper curves are named as "RXX".
                  <br />
                  <span className="text-sm text-gray-500 ml-6 block mt-1">
                    Example: R01, R02, …, R24
                  </span>
                </li>
                <li>
                  Exclude accessories such as BOPs, lubricators, and others from your data. These may cause unexpected errors in the results (e.g., integrity tables, collar detection).
                </li>
              </ol>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
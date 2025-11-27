"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the state interface
interface MultifingerCaliperState {
  isLoading: boolean;
  fileInfo: string | null;
  error: string | null;
  fileLoaded: boolean;
  plotData: any;
  isProcessing: boolean;
  isProcessed: boolean;
  resetKey: number;
  currentDepth: number | null;
  useCustomScale: boolean;
  customMinDiam: number;
  customMaxDiam: number;
  isUncentralised: boolean;
  showFingerReadings: boolean;
  showCollars: boolean;
  currentFileKey: string | null;
}

// Create the context
const MultifingerCaliperContext = createContext<{
  state: MultifingerCaliperState;
  setState: React.Dispatch<React.SetStateAction<MultifingerCaliperState>>;
} | null>(null);

// Initial state
const initialState: MultifingerCaliperState = {
  isLoading: false,
  fileInfo: null,
  error: null,
  fileLoaded: false,
  plotData: null,
  isProcessing: false,
  isProcessed: false,
  resetKey: 0,
  currentDepth: null,
  useCustomScale: false,
  customMinDiam: 4,
  customMaxDiam: 10,
  isUncentralised: false,
  showFingerReadings: false,
  showCollars: false,
  currentFileKey: null,
};

// Context provider component
export function MultifingerCaliperProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MultifingerCaliperState>(initialState);

  return (
    <MultifingerCaliperContext.Provider value={{ state, setState }}>
      {children}
    </MultifingerCaliperContext.Provider>
  );
}

// Hook to use the context
export function useMultifingerCaliper() {
  const context = useContext(MultifingerCaliperContext);
  if (!context) {
    throw new Error('useMultifingerCaliper must be used within a MultifingerCaliperProvider');
  }
  return context;
}

// Layout component that wraps the pages
export default function MultifingerCaliperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MultifingerCaliperProvider>
      {children}
    </MultifingerCaliperProvider>
  );
}
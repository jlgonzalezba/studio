import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="Página de inicio de EnerTech3">
      <Image 
        src="/enertech-logo.png" 
        alt="EnerTech3 logo" 
        width={40} 
        height={40} 
        className="mr-3"
      />
      <span className="text-xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
        EnerTech3
      </span>
    </a>
  );
}

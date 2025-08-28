import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="EnerTech3 homepage">
      <Image 
        src="/logo.jpg" 
        alt="EnerTech3 Logo" 
        width={100} 
        height={100}
        className="mr-3"
      />
      <span className="text-xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
        EnerTech3
      </span>
    </a>
  );
}

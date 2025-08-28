import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="EnerTech3 homepage">
      <Image 
        src="/logo.jpg" 
        alt="EnerTech3 Logo" 
        width={200} 
        height={200}
      />
    </a>
  );
}

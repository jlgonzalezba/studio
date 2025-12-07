import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="EnerTech3 homepage">
      <Image 
        src="/logo.jpg" 
        alt="EnerTech3 Logo" 
        width={280} 
        height={250}
      />
    </a>
  );
}

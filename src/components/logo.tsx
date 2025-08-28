import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="Página de inicio de App Showcase">
      {/* Replace this with your logo. For example:
          <Image src="/logo.svg" alt="App Showcase Logo" width={32} height={32} className="mr-3" />
      */}
      <Image 
        src="https://picsum.photos/32/32" 
        alt="Placeholder logo" 
        width={32} 
        height={32} 
        className="rounded-lg mr-3 shrink-0"
        data-ai-hint="logo"
      />
      <span className="text-xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
        App Showcase
      </span>
    </a>
  );
}

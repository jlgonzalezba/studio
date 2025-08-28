import React from 'react';

export function Logo() {
  return (
    <a href="/" className="flex items-center" aria-label="Página de inicio de App Showcase">
      <div className="w-8 h-8 bg-primary rounded-lg mr-3 shrink-0"></div>
      <span className="text-xl font-extrabold tracking-tight text-foreground whitespace-nowrap">
        App Showcase
      </span>
    </a>
  );
}

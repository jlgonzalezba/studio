import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4 py-8 gap-6">
        <Logo />
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} App Showcase. Todos los derechos reservados.
        </p>
        <div className="flex gap-6">
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Términos
          </Link>
        </div>
      </div>
    </footer>
  );
}

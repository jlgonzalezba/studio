import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const navLinks = [
    { href: "#", label: "Noticias" },
    { href: "#", label: "Contactenos" },
  ];

  return (
    <header className="py-4 md:py-6 sticky top-0 z-50 w-full bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
             <Link key={link.label} href={link.href} className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
          <Button asChild>
            <Link href="#">Login</Link>
          </Button>
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="p-6">
                <Logo />
                <nav className="mt-8 flex flex-col gap-6">
                   {navLinks.map((link) => (
                    <Link key={link.label} href={link.href} className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  ))}
                  <Button asChild className="w-full">
                    <Link href="#">Login</Link>
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

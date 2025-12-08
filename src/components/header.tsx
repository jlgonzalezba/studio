'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Menu, LogOut, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Error logging out",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { href: "/news", label: "News" },
    { href: "/contact", label: "Contact Us" },
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
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
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
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/login">Login</Link>
                    </Button>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

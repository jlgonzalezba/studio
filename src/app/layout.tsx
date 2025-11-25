import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from 'next-themes'
import { AuthListener } from '@/components/auth-listener'

export const metadata: Metadata = {
  title: 'EnerTech3',
  description: 'A showcase of future Python applications in a clean, professional interface.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthListener />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

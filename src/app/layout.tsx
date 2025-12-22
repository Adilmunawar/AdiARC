import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { InventoryProvider } from '@/context/InventoryContext';

export const metadata: Metadata = {
  title: 'AdiArc: Forensic Land Records',
  description: 'A forensic tool for inventorying and uploading land record images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <InventoryProvider>
          {children}
          <Toaster />
        </InventoryProvider>
      </body>
    </html>
  );
}

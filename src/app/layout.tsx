
"use client";

import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Sidebar, SecretModeProvider } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const notoNastaliqUrdu = Noto_Nastaliq_Urdu({ 
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-urdu",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
          <title>AdiARC - Mutation & Range Calculator</title>
          <meta name="description" content="AdiARC finds missing mutation numbers and inheritance partitions quickly, directly in your browser." />
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='hsl(217, 91%25, 60%25)' /><stop offset='100%25' stop-color='hsl(221, 83%25, 53%25)' /></linearGradient><mask id='a-mask'><rect width='100' height='100' fill='white'/><path d='M45 60 L55 60 L50 50 Z' fill='black' /></mask></defs><path d='M50 10 L10 90 L30 90 L40 70 L60 70 L70 90 L90 90 Z' fill='url(%23grad)' mask='url(%23a-mask)' /></svg>" />
      </head>
      <body className={cn("font-sans", inter.variable, notoNastaliqUrdu.variable)}>
        <SecretModeProvider>
            <div className="flex h-screen bg-background">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
                <Toaster />
                <Sonner />
              </main>
            </div>
        </SecretModeProvider>
      </body>
    </html>
  );
}

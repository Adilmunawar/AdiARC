
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

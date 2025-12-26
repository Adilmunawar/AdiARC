
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ClientSidebarProvider } from "@/components/layout/ClientSidebarProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AdiARC - Mutation & Range Calculator",
  description: "AdiARC finds missing mutation numbers and inheritance partitions quickly, directly in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientSidebarProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <SidebarInset>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
                <Toaster />
                <Sonner />
              </main>
            </SidebarInset>
          </div>
        </ClientSidebarProvider>
      </body>
    </html>
  );
}

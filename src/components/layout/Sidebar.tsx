"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Calculator, 
  Box, 
  ScanText, 
  FileCode, 
  Split, 
  DatabaseZap,
  ChevronsLeft,
  ChevronsRight,
  Database,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "DB Status", icon: DatabaseZap, path: "/db-status"},
  { name: "Wirasat Calculator", icon: Calculator, path: "/wirasat" },
  { name: "XMP Inventory", icon: Box, path: "/inventory" },
  { name: "Local OCR", icon: ScanText, path: "/ocr" },
  { name: "HTML Extractor", icon: FileCode, path: "/extractor" },
  { name: "Range Gaps", icon: Split, path: "/range-gaps" },
  { name: "Server Sync", icon: Database, path: "/sync" },
  { name: "Auditor", icon: ClipboardCheck, path: "/auditor" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r transition-width duration-300 ease-in-out h-screen bg-card rounded-tr-2xl rounded-br-2xl",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-4", isOpen ? "justify-start" : "justify-center")}>
         <Link href="/" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6 text-primary"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            {isOpen && <span className="font-bold text-lg">AdiARC</span>}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-2">
            {navItems.sort((a,b) => a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)).map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link href={item.path} key={item.name}>
                        <Button 
                            variant={isActive ? "default" : "ghost"} 
                            className={cn("w-full justify-start gap-3 group transition-all duration-200", !isOpen && "justify-center")}
                            title={isOpen ? "" : item.name}
                        >
                            <item.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                            {isOpen && <span className="transition-opacity duration-200">{item.name}</span>}
                        </Button>
                    </Link>
                );
            })}
        </nav>
      </ScrollArea>

       <div className="mt-auto p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronsLeft className="h-6 w-6" /> : <ChevronsRight className="h-6 w-6" />}
          </Button>
        </div>
    </aside>
  );
}

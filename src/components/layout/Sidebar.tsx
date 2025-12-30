
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
  ClipboardCheck,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';

const navItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "adil munawar", icon: () => <Image src="/adil.png" alt="adil munawar" width={20} height={20} className="rounded-md" />, path: "/ai-assistant" },
  { name: "DB Status", icon: DatabaseZap, path: "/db-status"},
  { name: "Wirasat Calculator", icon: Calculator, path: "/wirasat" },
  { name: "XMP Inventory", icon: Box, path: "/inventory" },
  { name: "Local OCR", icon: ScanText, path: "/ocr" },
  { name: "HTML Extractor", icon: FileCode, path: "/extractor" },
  { name: "Range Gaps", icon: Split, path: "/range-gaps" },
  { name: "Server Sync", icon: Database, path: "/sync" },
  { name: "Auditor", icon: ClipboardCheck, path: "/auditor" },
  { name: "Mutation Print Layout", icon: Printer, path: "/print-layout" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r transition-width duration-300 ease-in-out h-screen bg-card rounded-tr-[2rem] rounded-br-[2rem]",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-4 transition-all duration-300", isOpen ? "justify-start" : "justify-center")}>
         <Link href="/" className="flex items-center gap-2 group">
            <Image src="/adil.png" alt="adil munawar" width={28} height={28} className="rounded-md transition-transform duration-300 group-hover:scale-110" />
            {isOpen && <span className="font-bold text-lg transition-opacity duration-300">AdiARC</span>}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
            {navItems.sort((a,b) => a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)).map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link href={item.path} key={item.name}>
                        <Button 
                            variant={isActive ? "secondary" : "ghost"} 
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

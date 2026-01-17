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
  Printer,
  Globe,
  UserCircle,
  ImageIcon,
  FileKey,
  FileMinus,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from 'next/image';

const PowerShellIcon = ({ className }: { className?: string }) => (
    <div className={cn(
      "h-5 w-5 bg-[#012456] rounded-sm flex items-center justify-center p-0.5",
      className
    )}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-full w-full"
        >
            <polyline points="8 9 13 12 8 15" />
            <line x1="14" y1="15" x2="18" y2="15" />
        </svg>
    </div>
);


const navItems = [
  { name: "Dashboard", icon: Home, path: "/" },
  { name: "Property Consultant", icon: UserCircle, path: "/ai-assistant" },
  { name: "DB Status", icon: DatabaseZap, path: "/db-status"},
  { name: "Wirasat Calculator", icon: Calculator, path: "/wirasat" },
  { name: "XMP Inventory", icon: Box, path: "/inventory" },
  { name: "Local OCR", icon: ScanText, path: "/ocr" },
  { name: "HTML Extractor", icon: FileCode, path: "/extractor" },
  { name: "Range Gaps", icon: Split, path: "/range-gaps" },
  { name: "Server Sync", icon: Database, path: "/sync" },
  { name: "Auditor", icon: ClipboardCheck, path: "/auditor" },
  { name: "Mutation Print Layout", icon: Printer, path: "/print-layout" },
  { name: "Binary Converter", icon: ImageIcon, path: "/binary-converter" },
  { name: "SQL Generator", icon: FileKey, path: "/sql-generator" },
  { name: "Meta Tag Remover", icon: FileMinus, path: "/meta-remover" },
  { name: "Daily Progress Report", icon: FileSpreadsheet, path: "/daily-progress" },
  { name: "PowerShell Queries", icon: PowerShellIcon, path: "/powershell-queries" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  
  const sortedNavItems = [
      ...navItems.filter(item => item.path === '/'),
      ...navItems.filter(item => item.path === '/ai-assistant'),
      ...navItems.filter(item => item.path !== '/' && item.path !== '/ai-assistant').sort((a,b) => a.name.localeCompare(b.name))
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r transition-width duration-300 ease-in-out h-screen bg-card rounded-tr-[2rem] rounded-br-[2rem]",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-4 transition-all duration-300", isOpen ? "justify-start" : "justify-center")}>
         <Link href="/" className="flex items-center gap-2 group">
            <Globe className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
            {isOpen && <span className="font-bold text-lg transition-opacity duration-300">AdiARC</span>}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
            {sortedNavItems.map((item) => {
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
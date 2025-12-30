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
      <div className={cn("flex h-16 items-center border-b px-4", isOpen ? "justify-start" : "justify-center")}>
         <Link href="/" className="flex items-center gap-2">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
            >
                <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 6.1 15 5V4.59C17.93 5.78 20 8.65 20 12C20 14.08 19.2 15.97 17.9 17.39Z"
                fill="currentColor"
                />
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

    
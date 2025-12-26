
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
  Database,
  DatabaseZap,
  Menu
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
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-300 ease-in-out h-screen bg-card",
        isOpen ? "w-60" : "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className={cn("flex items-center gap-2", !isOpen && "justify-center w-full")}>
            <img src="https://img.icons8.com/color/48/adn.png" alt="logo" className="w-8 h-8" />
            <span className={cn("font-semibold text-lg", !isOpen && "hidden")}>AdiARC</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(!isOpen && "hidden")}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      <div className={cn("flex justify-center py-2 border-b", isOpen && "hidden")}>
         <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-2">
            {navItems.sort((a,b) => a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)).map((item) => {
                const isActive = pathname === item.path;
                return (
                    <Link href={item.path} key={item.name}>
                        <Button 
                            variant={isActive ? "default" : "ghost"} 
                            className={cn("w-full justify-start gap-2", !isOpen && "justify-center")}
                            title={isOpen ? "" : item.name}
                        >
                            <item.icon className="h-5 w-5" />
                            {isOpen && <span>{item.name}</span>}
                        </Button>
                    </Link>
                );
            })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

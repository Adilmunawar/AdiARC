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
  DatabaseZap
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="hidden w-64 h-screen bg-card border-r border-border md:flex flex-col flex-shrink-0 rounded-tr-[2rem] rounded-br-[2rem]">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 mt-4">
        <nav className="space-y-1">
          {navItems.sort((a,b) => a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

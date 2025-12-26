
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
import { Sidebar as SidebarPrimitive, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

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

function SidebarToggle() {
    const { state, toggleSidebar } = useSidebar();
    return (
        <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-lg hover:bg-accent"
            aria-label="Toggle sidebar"
        >
            <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
    )
}


export function Sidebar() {
  const pathname = usePathname();

  return (
    <SidebarPrimitive 
        className="bg-card border-r border-border"
        collapsible="icon"
    >
      <SidebarHeader className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://img.icons8.com/color/48/adn.png" alt="logo" className="w-8 h-8" />
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">AdiARC</span>
          </div>
          <SidebarTrigger asChild className="group-data-[collapsible=icon]:hidden">
              <SidebarToggle />
          </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {navItems.sort((a,b) => a.path === '/' ? -1 : b.path === '/' ? 1 : a.name.localeCompare(b.name)).map((item) => {
            const isActive = pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <Link href={item.path}>
                    <SidebarMenuButton 
                        isActive={isActive}
                        tooltip={item.name}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                             isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </SidebarPrimitive>
  );
}

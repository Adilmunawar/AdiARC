"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ScanSearch,
  DatabaseZap,
  BarChart3,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import React from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mutation-inventory", icon: ScanSearch, label: "Mutation Inventory" },
  { href: "/server-bridge", icon: DatabaseZap, label: "Server Bridge" },
  { href: "/gap-analysis", icon: BarChart3, label: "Gap Analysis" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-primary"><path d="M12 22h-1a2 2 0 0 1-2-2v-4.34a1 1 0 0 0-1-1H4a2 2 0 0 1-2-2v-1.34a1 1 0 0 0-1-1H.5a.5.5 0 0 1 0-1H1a1 1 0 0 0 1-1V8a2 2 0 0 1 2-2h1m11 14h1a2 2 0 0 0 2-2v-4.34a1 1 0 0 1 1-1H20a2 2 0 0 0 2-2v-1.34a1 1 0 0 1 1-1h.5a.5.5 0 0 0 0-1H23a1 1 0 0 1-1-1V8a2 2 0 0 0-2-2h-1"/></svg>
          AdiArc
        </Link>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                  asChild
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

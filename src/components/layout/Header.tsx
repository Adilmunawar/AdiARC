"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

const titles: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/mutation-inventory": "Mutation Inventory",
  "/server-bridge": "Server Bridge",
  "/gap-analysis": "Gap Analysis",
};

export function Header() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const title = titles[pathname] || "AdiArc";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      {isMobile && <SidebarTrigger />}
      <div className="flex-1">
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>
    </header>
  );
}

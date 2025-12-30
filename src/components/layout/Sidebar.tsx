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
      <div className={cn("flex h-16 items-center border-b px-4 transition-all duration-300", isOpen ? "justify-start" : "justify-center")}>
         <Link href="/" className="flex items-center gap-2 group">
            <svg width="28" height="28" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110">
              <path d="M512 928C282.78 928 96 741.22 96 512C96 282.78 282.78 96 512 96C741.22 96 928 282.78 928 512C928 741.22 741.22 928 512 928ZM824.28 389.85C823.11 389.96 821.96 390.13 820.72 390.13C788.75 390.13 762.61 364.53 762.61 332.05C762.61 329.17 762.83 326.33 763.26 323.55C808.99 371.39 837.28 428.43 847.19 490.54C842.06 441.74 834.72 414.88 824.28 389.85Z" fill="currentColor" fill-opacity="0.5"/>
              <path d="M512 928C282.78 928 96 741.22 96 512C96 282.78 282.78 96 512 96C741.22 96 928 282.78 928 512C928 741.22 741.22 928 512 928ZM509.34 107.41C295.66 123.63 123.63 295.66 107.41 509.34C123.63 723.02 295.66 895.05 509.34 911.27C723.02 895.05 895.05 723.02 911.27 509.34C895.05 295.66 723.02 123.63 509.34 107.41Z" fill="currentColor"/>
              <path d="M682.67 362.11C682.67 334.33 700.16 313.29 720.2 309.5C712.92 278.36 698.8 249.77 679.52 224.23C681.04 227.14 682.26 230.22 683.14 233.45C695.83 282.52 682.67 325.32 682.67 362.11Z" fill="currentColor" fill-opacity="0.5"/>
              <path d="M632.74 199.19C611.83 175.7 586.63 155.67 558.11 140.23C561.42 143.1 564.58 146.12 567.57 149.3C605.9 191.56 626.43 234.02 632.74 199.19Z" fill="currentColor" fill-opacity="0.5"/>
              <path d="M512 928C282.78 928 96 741.22 96 512C96 282.78 282.78 96 512 96C741.22 96 928 282.78 928 512C928 741.22 741.22 928 512 928ZM509.34 107.41C295.66 123.63 123.63 295.66 107.41 509.34L110.15 509.31C110.15 487.35 111.47 465.73 113.88 444.6C121.32 379.86 142.14 319.46 174.19 266.86C239.59 159.21 349.52 101.37 477.29 97.43C487.89 97.09 498.54 96.93 509.22 96.93C509.28 96.93 509.31 96.93 509.37 96.93C509.36 102.09 509.34 104.75 509.34 107.41ZM509.37 927.07C509.31 927.07 509.28 927.07 509.22 927.07C384.87 927.07 266.36 863.53 190.54 756.24C190.54 756.24 190.54 756.24 190.51 756.21C190.51 756.24 190.51 756.27 190.48 756.3C188.19 780.8 186.73 805.61 186.13 830.73C185.83 843.51 185.76 856.31 185.91 869.1C264.99 906.94 353.48 927.07 444.91 927.07H509.37V927.07Z" fill="currentColor"/>
              <path d="M449.19 869.1C421.33 868 393.7 865.71 366.37 862.24C366.34 862.24 366.31 862.24 366.28 862.24C366.31 862.21 366.31 862.21 366.34 862.18C366.34 862.21 366.34 862.21 366.37 862.24C345.69 854.34 325.74 845.28 306.52 835.05C252.1 806.26 202.07 768.62 158.74 723.77C158.74 723.74 158.71 723.74 158.68 723.7C158.71 723.7 158.71 723.7 158.74 723.74C158.71 723.7 158.68 723.7 158.65 723.67C156.45 711.23 154.56 698.68 152.94 686C142.17 598.44 156.33 508.31 192.51 426.3C211.96 381.71 241.6 342.13 279.29 309.53C303.35 287.48 330.41 268.49 359.73 253.07C388.58 237.94 419.6 226.36 452.05 218.73C452.08 218.73 452.08 218.73 452.11 218.73C452.08 218.73 452.08 218.73 452.05 218.7C452.08 218.73 452.11 218.73 452.14 218.73C453.66 218.39 455.15 218.09 456.67 217.78C461.3 216.83 465.99 215.98 470.72 215.22C470.72 215.22 470.75 215.22 470.75 215.19C470.72 215.19 470.72 215.19 470.69 215.16C470.72 215.19 470.72 215.22 470.75 215.22C472.95 214.81 475.15 214.46 477.38 214.14C490.96 212.18 504.69 211.23 518.45 211.23C519.84 211.23 521.23 211.23 522.62 211.26C522.62 211.26 522.65 211.26 522.65 211.29C522.62 211.29 522.62 211.26 522.59 211.26C522.62 211.26 522.62 211.26 522.65 211.29C523.57 211.31 524.46 211.34 525.35 211.37C647.45 216.5 758.94 286.08 827.81 391.87C827.84 391.9 827.84 391.9 827.87 391.93C827.84 391.93 827.84 391.93 827.81 391.9C827.84 391.93 827.84 391.93 827.87 391.96C835.66 418.14 841.56 445.03 845.54 472.46C845.54 472.49 845.54 472.49 845.57 472.52C845.54 472.52 845.54 472.52 845.51 472.49C845.54 472.52 452.14 472.55 452.14 472.55C453.69 475.24 455.24 477.92 456.76 480.57C458.28 483.21 459.78 485.83 461.22 488.42C482.46 528.52 497.02 571.49 504.09 616.14C504.09 616.17 504.09 616.17 504.12 616.2C504.09 616.2 504.09 616.2 504.06 616.17C504.09 616.2 504.12 616.2 504.15 616.23C505.35 623.51 506.33 630.82 507.09 638.13C507.09 638.16 507.12 638.16 507.12 638.19C507.09 638.19 507.09 638.16 507.06 638.16C507.09 638.16 507.09 638.19 507.12 638.19C507.21 639.1 507.3 640.01 507.39 640.92C509.34 689.99 503.22 739.52 489.19 785.49C482.26 808.48 473.41 830.68 462.67 851.68C462.64 851.71 462.64 851.74 462.61 851.77C462.64 851.77 462.64 851.74 462.67 851.71C462.64 851.74 462.61 851.77 462.58 851.8C458.76 857.75 454.75 863.61 450.57 869.34C450.54 869.37 450.54 869.37 450.51 869.4C450.54 869.4 450.54 869.37 450.57 869.34C450.54 869.37 450.51 869.4 450.48 869.43C449.73 869.31 449.46 869.21 449.19 869.1Z" fill="currentColor" fill-opacity="0.5"/>
            </svg>
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

    

"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCode, Split, Calculator, Box, ScanText, Database, DatabaseZap, ClipboardCheck, Printer, UserCircle, ImageIcon, FileKey, FileMinus, FileSpreadsheet, Minimize2, FileScan, MessageSquareQuote, Move, Camera } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSecretMode } from "@/components/layout/Sidebar";

const PowerShellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="m8 16 3-3-3-3" />
    <path d="m12 17 4 0" />
  </svg>
);

const allTools = [
    {
        name: "Hardware Scanner",
        description: "Connect to high-res document scanners up to 100MP with auto hardware detection.",
        icon: Camera,
        path: "/hardware-scanner"
    },
    {
        name: "Property Consultant",
        description: "Get advice on Pakistani property laws and inheritance. All conversations are in Urdu.",
        icon: UserCircle,
        path: "/ai-assistant"
    },
    {
        name: "Smart Image Sorter",
        description: "High-speed local image sorting into subfolders with sequential naming logic.",
        icon: Move,
        path: "/image-sorter"
    },
    {
        name: "Range Gaps",
        description: "Find missing sequential IDs from a large list.",
        icon: Split,
        path: "/range-gaps"
    },
    {
        name: "HTML Extractor",
        description: "Extract numeric options from HTML source code.",
        icon: FileCode,
        path: "/extractor"
    },
    {
        name: "Wirasat Partitions",
        description: "Calculate inheritance shares based on Islamic rules.",
        icon: Calculator,
        path: "/wirasat"
    },
    {
        name: "XMP Inventory",
        description: "Scan image metadata for embedded mutation IDs.",
        icon: Box,
        path: "/inventory"
    },
    {
        name: "Mutation Remarker",
        description: "Bulk generate Urdu remarks for mutation lists with standard templates.",
        icon: MessageSquareQuote,
        path: "/mutation-remarker"
    },
     {
        name: "Server Sync",
        description: "Bridge to legacy LRMIS SQL Server for direct uploads.",
        icon: Database,
        path: "/sync",
        isPremium: true,
    },
    {
        name: "DB Status",
        description: "Check the status and connectivity of a local database.",
        icon: DatabaseZap,
        path: "/db-status",
        isPremium: true,
    },
    {
        name: "Local OCR Detective",
        description: "Run OCR on images to find numbers when metadata fails.",
        icon: ScanText,
        path: "/ocr"
    },
    {
        name: "Auditor",
        description: "Compare two lists of mutations to find discrepancies.",
        icon: ClipboardCheck,
        path: "/auditor"
    },
    {
        name: "Mutation Print Layout",
        description: "Format a list of numbers into a print-friendly Excel file.",
        icon: Printer,
        path: "/print-layout"
    },
    {
        name: "Image Compressor",
        description: "Efficiently shrink large images (8MB to ~1MB) for faster uploads.",
        icon: Minimize2,
        path: "/compressor"
    },
    {
        name: "Binary Converter",
        description: "Convert raw hex or base64 data into viewable images.",
        icon: ImageIcon,
        path: "/binary-converter"
    },
    {
        name: "Image Doctor",
        description: "Diagnose and repair corrupt images by analyzing their binary signature.",
        icon: FileScan,
        path: "/image-doctor"
    },
    {
        name: "SQL Generator",
        description: "Generate a SQL script to delete multiple Intiqal records.",
        icon: FileKey,
        path: "/sql-generator",
        isPremium: true,
    },
    {
        name: "Meta Tag Remover",
        description: "Strip all metadata from a folder of images for privacy.",
        icon: FileMinus,
        path: "/meta-remover"
    },
    {
        name: "Daily Progress Report",
        description: "Generate an Excel report from daily activity JSON data.",
        icon: FileSpreadsheet,
        path: "/daily-progress",
        isPremium: true,
    },
    {
        name: "PowerShell Queries",
        description: "Generate PowerShell scripts to query the database directly.",
        icon: PowerShellIcon,
        path: "/powershell-queries",
        isPremium: true,
    },
];

export default function Home() {
  const { isUnlocked } = useSecretMode();
  const tools = allTools.filter(tool => !tool.isPremium || isUnlocked);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 p-1 sm:p-4">
        
        {/* Compact Premium Header to save vertical space */}
        <header className="relative space-y-2 pb-3 border-b border-border/30 flex-shrink-0">
            {/* Subtle ambient glow behind header */}
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/90 to-primary/70 drop-shadow-sm pb-1">
                  AdiARC Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-2xl leading-relaxed font-medium">
                    A premium suite of powerful utilities for forensic data analysis, image processing, and LRMIS tasks.
                </p>
              </div>
            </div>
        </header>

        {/* Dense Auto-fit Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 relative z-10">
            {tools.sort((a, b) => a.name.localeCompare(b.name)).map((tool, index) => (
                <Link href={tool.path} key={tool.name} className="no-underline group outline-none">
                    <Card 
                      className="h-full min-h-[95px] relative overflow-hidden bg-card/25 backdrop-blur-md border-border/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 group flex flex-col justify-between"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        
                        <CardHeader className="relative z-10 p-3 pb-1">
                            <div className="flex items-center gap-3">
                                {/* Icon Container */}
                                <div className="p-2 bg-background border border-border/40 shadow-sm rounded-lg transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:scale-105">
                                    <tool.icon className="h-5 w-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                                </div>
                                <CardTitle className="text-sm font-bold tracking-wide transition-colors duration-200 group-hover:text-primary">
                                  {tool.name}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 pt-1 p-3 flex-grow flex items-end">
                            <CardDescription className="text-xs leading-relaxed text-muted-foreground/75 transition-colors duration-200 group-hover:text-muted-foreground line-clamp-2">
                              {tool.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}


"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCode, Split, Calculator, Box, ScanText, Database, DatabaseZap, ClipboardCheck, Printer, UserCircle, ImageIcon, FileKey, FileMinus, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';
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
        name: "Property Consultant",
        description: "Get advice on Pakistani property laws and inheritance. All conversations are in Urdu.",
        icon: UserCircle,
        path: "/ai-assistant"
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
        name: "Binary Converter",
        description: "Convert raw hex or base64 data into viewable images.",
        icon: ImageIcon,
        path: "/binary-converter"
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
    }
];

export default function Home() {
  const { isUnlocked } = useSecretMode();
  const tools = allTools.filter(tool => !tool.isPremium || isUnlocked);

  return (
    <div className="flex flex-col gap-8 animate-enter">
        <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AdiARC Dashboard</h1>
            <p className="text-muted-foreground">
                A suite of powerful utilities for forensic data analysis and LRMIS tasks.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.sort((a, b) => a.name.localeCompare(b.name)).map(tool => (
                <Link href={tool.path} key={tool.name} className="no-underline group">
                    <Card className="h-full border-border/70 bg-card/80 transition-all duration-300 ease-in-out group-hover:border-primary/50 group-hover:shadow-lg group-hover:-translate-y-1">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-primary/10 rounded-lg transition-colors duration-300 group-hover:bg-primary/20">
                                    <tool.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-base font-semibold">{tool.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{tool.description}</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
  );
}

"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCode, Split, Calculator, Box, ScanText, Database, DatabaseZap, ClipboardCheck, Printer, UserCircle, ImageIcon, FileKey, FileMinus, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import Image from 'next/image';

const tools = [
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
        path: "/sync"
    },
    {
        name: "DB Status",
        description: "Check the status and connectivity of a local database.",
        icon: DatabaseZap,
        path: "/db-status"
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
        path: "/sql-generator"
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
        path: "/daily-progress"
    }
];

export default function Home() {

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


"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileCode, Split, Calculator, Box, ScanText, Database, DatabaseZap } from "lucide-react";
import Link from "next/link";

const tools = [
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
    }
];

export default function Home() {

  return (
    <div className="flex flex-col gap-8">
        <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">AdiARC Dashboard</h1>
            <p className="text-muted-foreground">
                A suite of powerful utilities for forensic data analysis and LRMIS tasks.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.sort((a, b) => a.name.localeCompare(b.name)).map(tool => (
                <Link href={tool.path} key={tool.name} className="no-underline">
                    <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
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


"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FolderSearch, Loader2, Download, Trash2, UploadCloud, AlertCircle, CheckCircle2, FileText, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ScanResult = {
    name: string;
    path: string;
    status: 'success' | 'failed';
    stats?: Record<string, number>;
    error?: string;
};

export function MauzaScannerTab() {
    const { toast } = useToast();
    const [input, setInput] = useState("");
    const [serverSavePath, setServerSavePath] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<ScanResult[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInput(content);
            toast({ title: "File Loaded", description: "Targets imported from text file." });
        };
        reader.readAsText(file);
    };

    const parseTargets = () => {
        return input.split('\n')
            .map(line => line.trim())
            .filter(line => line.includes(','))
            .map(line => {
                const parts = line.split(',');
                const name = parts[0].trim();
                const path = parts.slice(1).join(',').trim();
                return { name, path };
            });
    };

    const startScan = async () => {
        const targets = parseTargets();
        if (targets.length === 0) {
            toast({ variant: "destructive", title: "Invalid Input", description: "Format: Mauza Name, \\\\Path" });
            return;
        }

        setIsScanning(true);
        setResults([]);

        try {
            const response = await fetch('/api/mauza-scanner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets, serverSavePath }),
            });

            const data = await response.json();
            if (data.success) {
                setResults(data.data);
                toast({ title: "Scan Complete", description: `Processed ${data.data.length} mauzas.` });
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Scan Failed", description: error.message });
        } finally {
            setIsScanning(false);
        }
    };

    const downloadCsv = () => {
        if (results.length === 0) return;

        // Collect all unique categories across all results
        const categories = Array.from(new Set(results.flatMap(r => r.stats ? Object.keys(r.stats) : [])));
        const headers = ["Mauza Name", "Path", "Status", ...categories, "Error"];

        const rows = results.map(r => {
            const row = [r.name, r.path, r.status];
            categories.forEach(cat => row.push(String(r.stats?.[cat] || 0)));
            row.push(r.error || "");
            return row.join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `mauza_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate dynamic columns for the UI table
    const dynamicCategories = Array.from(new Set(results.flatMap(r => r.stats ? Object.keys(r.stats) : []))).sort();

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <FolderSearch className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Mauza Network Scanner</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Deep-scan network paths and automatically categorize image counts.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setInput(""); setResults([]); }} disabled={isScanning}>
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                        <UploadCloud className="h-4 w-4 mr-2" /> Upload Targets
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileUpload} />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Scan Targets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Paste Targets (Mauza Name, Path)</Label>
                                <Textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={"Moza Amr Kot, \\\\192.125.5.241\\ لاہور_امرتس\nSodiwal, \\\\192.125.5.241\\ لاہور_سودیوال"}
                                    className="h-[200px] font-mono text-xs bg-background/50"
                                    disabled={isScanning}
                                />
                                <p className="text-[10px] text-muted-foreground italic">Tip: Use one line per target. Separate name and path with a comma.</p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-dashed">
                                <Label className="text-xs font-bold flex items-center gap-2">
                                    <Database className="h-3 w-3" /> Server Export Path (Optional)
                                </Label>
                                <Input 
                                    value={serverSavePath}
                                    onChange={(e) => setServerSavePath(e.target.value)}
                                    placeholder="e.g. C:\AdiARC\Exports"
                                    className="h-9 text-xs"
                                    disabled={isScanning}
                                />
                                <p className="text-[10px] text-muted-foreground">If provided, the server will attempt to write a CSV file directly to this location.</p>
                            </div>

                            <Button onClick={startScan} className="w-full font-bold shadow-lg shadow-primary/20" disabled={isScanning || !input.trim()}>
                                {isScanning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deep Scanning Network...
                                    </>
                                ) : (
                                    <>
                                        <FolderSearch className="mr-2 h-4 w-4" />
                                        Execute Deep Scan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <Card className="flex-1 border-border/40 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                        <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Scan Results
                            </h3>
                            <div className="flex items-center gap-2">
                                {results.length > 0 && (
                                    <Button onClick={downloadCsv} size="sm" variant="secondary" className="h-8 font-bold text-xs">
                                        <Download className="mr-2 h-3.5 w-3.5" /> Download CSV
                                    </Button>
                                )}
                                <Badge variant="outline" className="text-[10px]">{isScanning ? "Scanning..." : results.length > 0 ? "Results Ready" : "Awaiting Input"}</Badge>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <ScrollArea className="h-full w-full absolute inset-0">
                                {results.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-muted/95 sticky top-0 z-20 backdrop-blur-md">
                                            <TableRow>
                                                <TableHead className="font-bold min-w-[150px]">Mauza Name</TableHead>
                                                <TableHead className="font-bold min-w-[100px]">Status</TableHead>
                                                {dynamicCategories.map(cat => (
                                                    <TableHead key={cat} className="text-right font-bold min-w-[80px]">{cat}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r, i) => (
                                                <TableRow key={i} className="hover:bg-primary/5 transition-colors border-border/10">
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{r.name}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={r.path}>{r.path}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.status === 'success' ? (
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-destructive">
                                                                <AlertCircle className="h-3 w-3" />
                                                                <span className="text-[10px] font-bold">Failed</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    {dynamicCategories.map(cat => (
                                                        <TableCell key={cat} className="text-right font-mono text-xs">
                                                            {r.stats?.[cat] || 0}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-10 opacity-30 text-center space-y-4">
                                        <FolderSearch className="h-16 w-16 stroke-[1px]" />
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold">No Data Scanned</p>
                                            <p className="text-sm">Configure targets and execute the scan to view results.</p>
                                        </div>
                                    </div>
                                )}
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

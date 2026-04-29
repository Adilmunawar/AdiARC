
"use client";

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FolderSearch, Loader2, Download, Trash2, UploadCloud, AlertCircle, CheckCircle2, FileText, Database, BarChart3, PieChart } from 'lucide-react';
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
    const [serverSavePath, setServerSavePath] = useState("\\\\192.125.5.243\\Div Rawalpindi\\20Adil.Hussain");
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

    const dynamicCategories = useMemo(() => 
        Array.from(new Set(results.flatMap(r => r.stats ? Object.keys(r.stats) : []))).sort(),
    [results]);

    const totalSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        let totalAll = 0;
        results.forEach(r => {
            if (r.stats) {
                Object.entries(r.stats).forEach(([cat, count]) => {
                    summary[cat] = (summary[cat] || 0) + count;
                    totalAll += count;
                });
            }
        });
        return { breakdown: summary, total: totalAll };
    }, [results]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <FolderSearch className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Mauza Network Scanner</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Perform deep recursive scanning of network drives with fuzzy keyword categorization.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setInput(""); setResults([]); }} disabled={isScanning}>
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                        <UploadCloud className="h-4 w-4 mr-2" /> Upload Targets (.txt)
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileUpload} />
                </div>
            </div>

            {/* Main Workspace */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Scan Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold">Paste Targets</Label>
                                    <span className="text-[10px] text-muted-foreground">Name, \\Path</span>
                                </div>
                                <Textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={"Mauza Name, \\\\192.125.x.x\\path\n..."}
                                    className="h-[180px] font-mono text-[11px] leading-relaxed bg-background/50 focus:ring-primary/20"
                                    disabled={isScanning}
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-dashed">
                                <Label className="text-xs font-bold flex items-center gap-2">
                                    <Database className="h-3 w-3 text-primary" /> Auto-Save Report to Server
                                </Label>
                                <Input 
                                    value={serverSavePath}
                                    onChange={(e) => setServerSavePath(e.target.value)}
                                    placeholder="Enter network or local path"
                                    className="h-9 text-xs font-mono"
                                    disabled={isScanning}
                                />
                                <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                    A CSV report will be written to this path on the server host for each scan.
                                </p>
                            </div>

                            <Button 
                                onClick={startScan} 
                                className="w-full font-bold shadow-lg shadow-primary/20 h-11" 
                                disabled={isScanning || !input.trim()}
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deep Scanning Network...
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Start Recursive Scan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    {results.length > 0 && (
                        <Card className="border-border/40 bg-primary/5 shadow-md rounded-2xl animate-fade-in">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Global Scan Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-muted-foreground">Total Files Detected</span>
                                    <span className="text-2xl font-black text-primary">{totalSummary.total.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1.5 pt-2 border-t border-primary/10">
                                    {Object.entries(totalSummary.breakdown).map(([cat, count]) => (
                                        <div key={cat} className="flex justify-between text-[11px]">
                                            <span className="text-muted-foreground">{cat}</span>
                                            <span className="font-bold">{count.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Results Workspace */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <Card className="flex-1 border-border/40 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                        <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Live Audit Log
                            </h3>
                            <div className="flex items-center gap-2">
                                {results.length > 0 && (
                                    <Button onClick={downloadCsv} size="sm" variant="secondary" className="h-8 font-bold text-xs">
                                        <Download className="mr-2 h-3.5 w-3.5" /> Download Report
                                    </Button>
                                )}
                                <Badge variant="outline" className="text-[10px] bg-background/50">
                                    {isScanning ? "Processing..." : results.length > 0 ? `${results.length} Mauzas Ready` : "Awaiting Input"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <ScrollArea className="h-full w-full absolute inset-0">
                                {results.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-muted/95 sticky top-0 z-20 backdrop-blur-md">
                                            <TableRow>
                                                <TableHead className="font-bold min-w-[200px] text-xs">Target Details</TableHead>
                                                <TableHead className="font-bold min-w-[100px] text-xs">Status</TableHead>
                                                {dynamicCategories.map(cat => (
                                                    <TableHead key={cat} className="text-right font-bold min-w-[90px] text-xs">{cat}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r, i) => (
                                                <TableRow key={i} className="hover:bg-primary/5 transition-colors group">
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{r.name}</span>
                                                            <code className="text-[9px] text-muted-foreground bg-muted/50 px-1 py-0.5 rounded truncate max-w-[250px]" title={r.path}>
                                                                {r.path}
                                                            </code>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.status === 'success' ? (
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] font-bold uppercase">Ready</Badge>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1 text-destructive">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    <span className="text-[9px] font-bold">Access Denied</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    {dynamicCategories.map(cat => (
                                                        <TableCell key={cat} className={cn(
                                                            "text-right font-mono text-[11px] tabular-nums",
                                                            r.stats?.[cat] ? "text-foreground font-bold" : "text-muted-foreground/30"
                                                        )}>
                                                            {r.stats?.[cat] || 0}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-20 opacity-40 text-center space-y-4">
                                        <div className="p-6 bg-muted/20 rounded-full">
                                            <PieChart className="h-20 w-20 stroke-[1px]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold">No Active Data</p>
                                            <p className="text-sm max-w-xs mx-auto text-muted-foreground">
                                                Paste your network paths or upload a target file to begin the deep recursive audit.
                                            </p>
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

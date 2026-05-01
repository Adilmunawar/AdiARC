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
import { FolderSearch, Loader2, Download, Trash2, UploadCloud, AlertCircle, CheckCircle2, FileText, Database, BarChart3, PieChart, Play, Network, ShieldCheck, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ScanResult = {
    name: string;
    path: string;
    status: 'success' | 'failed';
    stats: Record<string, number>;
    error?: string;
};

const CATEGORY_MAPPING: Record<string, string[]> = {
    'Mutation': ['mutation', 'mutations', 'انتقال', 'intiqal', 'interum', 'intaram', 'motation', 'mutaion'],
    'RHZ': ['rhz', 'roznamcha', 'روزنامچہ'],
    'Shajra': ['shajra', 'شجرہ', 'shijra', 'map'],
    'Fardbadar': ['fardbadar', 'fard badar', 'فرد بدر', 'بدرات'],
    'Field Book': ['field book', 'fieldbook', 'فیلڈ بک']
};

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'tiff', 'tif', 'bmp', 'gif']);

export function MauzaScannerTab() {
    const { toast } = useToast();
    const [input, setInput] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<ScanResult[]>([]);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentMauza: "" });
    
    // Directory Handles for persistence in session
    const [sourceHandle, setSourceHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [exportHandle, setExportHandle] = useState<FileSystemDirectoryHandle | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setInput(event.target?.result as string);
            toast({ title: "File Loaded", description: "Targets imported successfully." });
        };
        reader.readAsText(file);
    };

    const detectCategory = (fileName: string, relativePath: string): string => {
        const fullPathLower = (relativePath + '/' + fileName).toLowerCase();
        
        for (const [standardCat, keywords] of Object.entries(CATEGORY_MAPPING)) {
            if (keywords.some(kw => fullPathLower.includes(kw.toLowerCase()))) {
                return standardCat;
            }
        }

        const pathParts = relativePath.split('/');
        const parentDir = pathParts[pathParts.length - 1] || "Root";
        
        return parentDir.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const requestSourceHandle = async () => {
        try {
            const handle = await (window as any).showDirectoryPicker({
                mode: 'read'
            });
            setSourceHandle(handle);
            toast({ title: "Directory Connected", description: `Authorized access to: ${handle.name}` });
            return handle;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast({ variant: "destructive", title: "Access Denied", description: "Could not connect to the folder." });
            }
            return null;
        }
    };

    const requestExportHandle = async () => {
        try {
            const handle = await (window as any).showDirectoryPicker({
                mode: 'readwrite'
            });
            setExportHandle(handle);
            toast({ title: "Export Folder Set", description: `Reports will be saved to: ${handle.name}` });
            return handle;
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast({ variant: "destructive", title: "Permission Required", description: "Write access needed to save reports." });
            }
            return null;
        }
    };

    const scanDirectory = async (handle: FileSystemDirectoryHandle, mauzaPath: string, stats: Record<string, number>, currentRelPath = "") => {
        for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
                const ext = entry.name.split('.').pop()?.toLowerCase() || "";
                if (IMAGE_EXTENSIONS.has(ext)) {
                    const category = detectCategory(entry.name, currentRelPath);
                    stats[category] = (stats[category] || 0) + 1;
                }
            } else if (entry.kind === 'directory') {
                await scanDirectory(entry, mauzaPath, stats, currentRelPath ? `${currentRelPath}/${entry.name}` : entry.name);
            }
        }
    };

    const startBrowserScan = async () => {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l.includes(','));
        const targets = lines.map(line => {
            const [name, ...pathParts] = line.split(',');
            return { name: name.trim(), path: pathParts.join(',').trim() };
        });

        if (targets.length === 0) {
            toast({ variant: "destructive", title: "No Targets", description: "Format: Name, \\Path" });
            return;
        }

        let currentHandle = sourceHandle;
        if (!currentHandle) {
            currentHandle = await requestSourceHandle();
            if (!currentHandle) return;
        }

        setIsScanning(true);
        setResults([]);
        setScanProgress({ current: 0, total: targets.length, currentMauza: "" });

        const finalResults: ScanResult[] = [];

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            setScanProgress(p => ({ ...p, current: i + 1, currentMauza: target.name }));
            
            const stats: Record<string, number> = {};
            try {
                // Perform the scan relative to the root authorized handle
                await scanDirectory(currentHandle, target.path, stats);
                finalResults.push({ ...target, status: 'success', stats });
            } catch (err: any) {
                finalResults.push({ ...target, status: 'failed', stats: {}, error: err.message });
            }
            
            // UI Yield to prevent blocking
            if (i % 2 === 0) await new Promise(r => setTimeout(r, 0));
        }

        setResults(finalResults);
        setIsScanning(false);
        toast({ title: "Scan Complete", description: `Audit finished for ${targets.length} locations.` });

        // Auto-Export if handle exists
        if (exportHandle && finalResults.length > 0) {
            saveToExportFolder(finalResults, exportHandle);
        }
    };

    const saveToExportFolder = async (data: ScanResult[], handle: FileSystemDirectoryHandle) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `mauza_audit_${timestamp}.csv`;
            const fileHandle = await handle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            
            const csvContent = generateCsvString(data);
            await writable.write(csvContent);
            await writable.close();
            
            toast({ title: "Report Saved", description: `Saved as ${fileName} in export folder.` });
        } catch (err: any) {
            toast({ variant: "destructive", title: "Save Failed", description: err.message });
        }
    };

    const generateCsvString = (data: ScanResult[]) => {
        const categories = Array.from(new Set(data.flatMap(r => Object.keys(r.stats)))).sort();
        const headers = ["Mauza Name", "Path", "Status", ...categories, "Error"];
        const rows = data.map(r => [
            r.name, r.path, r.status, 
            ...categories.map(cat => r.stats[cat] || 0), 
            r.error || ""
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
    };

    const downloadCsv = () => {
        if (results.length === 0) return;
        const csvContent = generateCsvString(results);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mauza_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const dynamicCategories = useMemo(() => 
        Array.from(new Set(results.flatMap(r => Object.keys(r.stats)))).sort(),
    [results]);

    const totalSummary = useMemo(() => {
        const summary: Record<string, number> = {};
        let totalAll = 0;
        results.forEach(r => {
            Object.entries(r.stats).forEach(([cat, count]) => {
                summary[cat] = (summary[cat] || 0) + count;
                totalAll += count;
            });
        });
        return { breakdown: summary, total: totalAll };
    }, [results]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter pb-10">
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
                        Client-side directory scanning with authorized prompt access. Bypasses public server restrictions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setInput(""); setResults([]); }} disabled={isScanning}>
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                        <UploadCloud className="h-4 w-4 mr-2" /> Import .txt
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".txt" onChange={handleFileUpload} />
                </div>
            </div>

            {/* Main Workspace */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Configuration Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Play className="h-4 w-4" /> Scanner Setup
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">1. Target List (Mauza, \\Path)</Label>
                                <Textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={"Mauza Name, \\\\192.125.x.x\\path\n..."}
                                    className="h-[150px] font-mono text-[11px] bg-background/50"
                                    disabled={isScanning}
                                />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-dashed">
                                <Label className="text-xs font-bold">2. Permission Prompts</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="secondary" size="sm" onClick={requestSourceHandle} className="justify-start">
                                        <Network className="mr-2 h-4 w-4" /> 
                                        {sourceHandle ? `Connected: ${sourceHandle.name}` : "Connect to Network Drive"}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={requestExportHandle} className="justify-start">
                                        <Save className="mr-2 h-4 w-4" /> 
                                        {exportHandle ? `Saving to: ${exportHandle.name}` : "Set Auto-Save Folder"}
                                    </Button>
                                </div>
                            </div>

                            <Button 
                                onClick={startBrowserScan} 
                                className="w-full font-bold shadow-lg shadow-primary/20 h-11" 
                                disabled={isScanning || !input.trim()}
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Scanning Locally...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Start Local Scan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Progress Indicator */}
                    {isScanning && (
                         <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-primary uppercase">
                                    <span>Processing {scanProgress.current} / {scanProgress.total}</span>
                                    <span className="truncate max-w-[150px]">{scanProgress.currentMauza}</span>
                                </div>
                                <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-300" 
                                        style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                                    />
                                </div>
                            </CardContent>
                         </Card>
                    )}

                    {/* Summary Card */}
                    {results.length > 0 && (
                        <Card className="border-border/40 bg-primary/5 shadow-md rounded-2xl animate-fade-in">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-primary flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Scan Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-muted-foreground">Total Images Found</span>
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
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Live Directory Audit
                            </h3>
                            <div className="flex items-center gap-2">
                                {results.length > 0 && (
                                    <Button onClick={downloadCsv} size="sm" variant="secondary" className="h-8 font-bold text-xs">
                                        <Download className="mr-2 h-3.5 w-3.5" /> Download CSV
                                    </Button>
                                )}
                                <Badge variant="outline" className="text-[10px] bg-background/50">
                                    {isScanning ? "Authorized" : results.length > 0 ? `${results.length} Scanned` : "Awaiting Authorization"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <ScrollArea className="h-full w-full absolute inset-0">
                                {results.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-muted/95 sticky top-0 z-20 backdrop-blur-md">
                                            <TableRow>
                                                <TableHead className="font-bold min-w-[200px] text-xs">Mauza Details</TableHead>
                                                <TableHead className="font-bold min-w-[100px] text-xs">Result</TableHead>
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
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] font-bold uppercase">Success</Badge>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-destructive">
                                                                <AlertCircle className="h-3 w-3" />
                                                                <span className="text-[9px] font-bold">Failed</span>
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
                                            <p className="text-xl font-bold">Browser Scanner Idle</p>
                                            <p className="text-sm max-w-sm mx-auto text-muted-foreground">
                                                Click "Connect to Network Drive" to authorize the browser to scan your local folders.
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
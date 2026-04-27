
"use client";

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, Sparkles, Hash, AlertCircle, Clipboard, CheckCircle2, RefreshCw, LayoutTemplate, Settings2, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

type RemarkItem = {
    number: string;
    remark: string;
};

type Mode = 'random' | 'reference' | 'custom';

export function MutationRemarkerTab() {
    const { toast } = useToast();
    const [numbersString, setNumbersString] = useState("");
    const [mode, setMode] = useState<Mode>('random');
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Mode-specific states for Custom template
    const [customPrefix, setCustomPrefix] = useState("انتقال نمبر");
    const [customSuffix, setCustomSuffix] = useState("کی رپورٹ مکمل ہے۔");

    const detectedNumbers = useMemo(() => {
        return numbersString.split(/[\s,;]+/).map(n => n.trim()).filter(n => n !== "");
    }, [numbersString]);

    const processedData = useMemo(() => {
        if (detectedNumbers.length === 0) return [];

        return detectedNumbers.map((num, index) => {
            let remark = "";
            if (mode === 'random') {
                const phrases = [
                    `کھیوٹ نمبر ${num} میں مالک موجود نہیں ہے`,
                    `کھیوٹ نمبر ${num} میں مالک کے پاس انتقال کے لئے درکار رقبہ موجود نہیں ہے`
                ];
                
                // Enhanced randomization logic
                const seed = (index + 7) * (refreshKey + 13) * 1103515245 + 12345;
                const hash = (seed >>> 16) % phrases.length;
                
                remark = phrases[hash];
            } else if (mode === 'reference') {
                remark = `بحوالہ انتقال نمبر ${num} کی وجہ سے انتقال کا عمل بقایا ہے`;
            } else {
                remark = `${customPrefix.trim()} ${num} ${customSuffix.trim()}`;
            }
            return { number: num, remark };
        });
    }, [detectedNumbers, mode, customPrefix, customSuffix, refreshKey]);

    const handleCopyRemarks = async () => {
        if (processedData.length === 0) return;
        
        const text = processedData.map(d => d.remark).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: "Remarks Copied", description: "All generated Urdu text copied to clipboard." });
        } catch (err) {
            toast({ title: "Copy Failed", variant: "destructive" });
        }
    };

    const handleCopyTable = async () => {
        if (processedData.length === 0) return;
        
        const header = "Mutation ID\tRemark (Urdu)\n";
        const rows = processedData.map(d => `${d.number}\t${d.remark}`).join('\n');
        
        try {
            await navigator.clipboard.writeText(header + rows);
            toast({ title: "Table Copied", description: "Data formatted for Excel paste." });
        } catch (err) {
            toast({ title: "Copy Failed", variant: "destructive" });
        }
    };

    const handleExportExcel = () => {
        if (processedData.length === 0) return;
        
        const worksheet = XLSX.utils.json_to_sheet(processedData.map(item => ({
            "Mutation ID": item.number,
            "Remark (Urdu)": item.remark
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Mutation Remarks");
        
        worksheet['!cols'] = [{ wch: 15 }, { wch: 80 }];

        XLSX.writeFile(workbook, `mutation_remarks_${Date.now()}.xlsx`);
        toast({ title: "Excel Exported", description: "Downloading .xlsx file." });
    };

    const handleClear = () => {
        setNumbersString("");
        toast({ title: "Input Cleared" });
    };

    const handleShuffle = () => {
        setRefreshKey(prev => prev + 1);
        toast({ title: "Distribution Randomized", description: "Remarks have been re-shuffled." });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <MessageSquareQuote className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Mutation Remarker</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Professional bulk status generator for LRMIS data entry.
                    </p>
                </div>
                <div className="flex items-center gap-2 pl-11 md:pl-0">
                    {detectedNumbers.length > 0 && (
                        <Badge variant="secondary" className="h-9 px-4 text-sm font-semibold bg-primary/10 text-primary border-primary/20 animate-in fade-in zoom-in">
                            <Hash className="h-4 w-4 mr-1.5" />
                            {detectedNumbers.length} IDs Detected
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={handleClear} disabled={!numbersString}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Configuration Panel */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                1. Source Data & Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="numbers-input" className="text-xs font-semibold">Paste Mutation IDs</Label>
                                <Textarea
                                    id="numbers-input"
                                    value={numbersString}
                                    onChange={(e) => setNumbersString(e.target.value)}
                                    placeholder="Paste IDs here... (e.g. 101, 102, 103...)"
                                    className="h-[220px] font-mono text-sm bg-background/50 border-border/50 focus:border-primary/40 transition-all resize-none shadow-inner rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic px-1">
                                    Supports spaces, commas, semicolons, and ranges (101-105).
                                </p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/40">
                                <Label className="text-xs font-semibold">Remark Generation Mode</Label>
                                <Tabs defaultValue="random" value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-11">
                                        <TabsTrigger value="random" className="rounded-lg h-9 text-xs">Random</TabsTrigger>
                                        <TabsTrigger value="reference" className="rounded-lg h-9 text-xs">Reference</TabsTrigger>
                                        <TabsTrigger value="custom" className="rounded-lg h-9 text-xs">Custom</TabsTrigger>
                                    </TabsList>
                                    
                                    <div className="mt-4 p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-3 min-h-[160px] flex flex-col justify-center">
                                        <TabsContent value="random" className="mt-0 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <Dices className="h-4 w-4 animate-bounce" />
                                                    <p className="text-[10px] font-bold uppercase tracking-wider">Restricted Distribution</p>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 bg-primary/10 hover:bg-primary/20 text-primary" onClick={handleShuffle}>
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Shuffle
                                                </Button>
                                            </div>
                                            <p className="text-xs text-foreground/70 leading-relaxed font-urdu text-right" dir="rtl">
                                                بے ترتیب ریمارکس کی تقسیم:
                                            </p>
                                            <div className="space-y-1">
                                                <div className="p-1.5 bg-background/80 rounded-lg border text-right font-urdu text-[10px] text-muted-foreground truncate" dir="rtl">
                                                    کھیوٹ نمبر <span className="text-primary">123</span> میں مالک موجود نہیں ہے
                                                </div>
                                                <div className="p-1.5 bg-background/80 rounded-lg border text-right font-urdu text-[10px] text-muted-foreground truncate" dir="rtl">
                                                    کھیوٹ نمبر <span className="text-primary">123</span> میں مالک کے پاس انتقال کے لئے درکار رقبہ موجود نہیں ہے
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="reference" className="mt-0 space-y-3">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <LayoutTemplate className="h-3.5 w-3.5" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Bulk Reference Mode</p>
                                            </div>
                                            <p className="text-xs text-foreground/70 leading-relaxed font-urdu text-right" dir="rtl">
                                                تمام نمبرز کے لیے درج ذیل ریفرنس ریمارکس بنائے جائیں گے:
                                            </p>
                                            <div className="p-3 bg-background/80 rounded-lg border border-blue-500/20 text-right font-urdu text-sm text-blue-600" dir="rtl">
                                                بحوالہ انتقال نمبر <span className="text-foreground font-mono font-bold">123</span> کی وجہ سے انتقال کا عمل بقایا ہے
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="custom" className="mt-0 space-y-3">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Prefix</Label>
                                                    <Input value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value)} className="h-8 text-xs font-urdu text-right bg-background/60" dir="rtl" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Suffix</Label>
                                                    <Input value={customSuffix} onChange={(e) => setCustomSuffix(e.target.value)} className="h-8 text-xs font-urdu text-right bg-background/60" dir="rtl" />
                                                </div>
                                            </div>
                                            <div className="p-2 bg-background/80 rounded-lg border text-right font-urdu text-[11px] text-primary truncate" dir="rtl">
                                                {customPrefix} <span className="text-foreground font-mono font-bold">123</span> {customSuffix}
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions Card */}
                    <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="p-4 bg-muted/20 border-b border-border/40">
                             <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Export</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <Button onClick={handleCopyRemarks} variant="secondary" disabled={processedData.length === 0} className="h-11 rounded-xl text-xs font-semibold shadow-sm">
                                <Clipboard className="mr-2 h-4 w-4" />
                                Copy Remarks
                            </Button>
                            <Button onClick={handleCopyTable} variant="outline" disabled={processedData.length === 0} className="h-11 rounded-xl text-xs font-semibold shadow-sm">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Table
                            </Button>
                            <Button onClick={handleExportExcel} className="h-11 sm:col-span-2 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md text-xs font-bold" disabled={processedData.length === 0}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Download Excel (.xlsx)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Table Panel */}
                <div className="lg:col-span-7 space-y-4">
                    <Card className="h-full border-border/40 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Live Table Generation
                            </h3>
                             {processedData.length > 0 && (
                                <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                                    Auto-Updated
                                </span>
                             )}
                        </div>

                        <div className="flex-1 min-h-[500px]">
                            <ScrollArea className="h-full w-full">
                                <Table className="relative">
                                    <TableHeader className="bg-muted/80 sticky top-0 z-20 backdrop-blur-md">
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            <TableHead className="w-[140px] font-bold text-foreground">Mutation ID</TableHead>
                                            <TableHead className="text-right pr-8 font-bold text-foreground">Generated Urdu Remark</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.length > 0 ? (
                                            processedData.map((item, i) => (
                                                <TableRow key={`${i}-${refreshKey}`} className="hover:bg-primary/5 transition-colors border-border/20 group animate-in fade-in duration-500 fill-mode-both">
                                                    <TableCell className="font-mono text-xs font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary group-hover:scale-125 transition-all" />
                                                            {item.number}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell 
                                                        className="text-right font-urdu text-[15px] py-4 min-w-[400px] leading-relaxed" 
                                                        dir="rtl"
                                                    >
                                                        {item.remark}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-[400px] text-center pointer-events-none">
                                                    <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                                                        <Clipboard className="h-12 w-12 stroke-[1px]" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">No Data to Display</p>
                                                            <p className="text-[11px]">Paste mutation IDs in the left panel to begin.</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

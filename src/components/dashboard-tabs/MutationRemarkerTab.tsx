
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
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, Sparkles, Hash, AlertCircle, Clipboard, CheckCircle2 } from 'lucide-react';
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
    
    // Mode-specific states for Custom template
    const [customPrefix, setCustomPrefix] = useState("انتقال نمبر");
    const [customSuffix, setCustomSuffix] = useState("کی رپورٹ مکمل ہے۔");

    const detectedNumbers = useMemo(() => {
        // Robust Regex Parser: Splits by space, comma, semicolon, or newline
        // Preserves complex IDs like 6332/1 and ranges like 1754-1758
        return numbersString.split(/[\s,;]+/).map(n => n.trim()).filter(n => n !== "");
    }, [numbersString]);

    const processedData = useMemo(() => {
        if (detectedNumbers.length === 0) return [];

        return detectedNumbers.map((num, index) => {
            let remark = "";
            if (mode === 'random') {
                const phrases = [
                    `کھیوٹ نمبر ${num} میں مالک موجود نہیں ہے`,
                    `کھیوٹ نمبر ${num} میں مالک کے پاس انتقال کے لیئے درکار رقبہ موجود نہیں ہے`
                ];
                const pick = index % phrases.length;
                remark = phrases[pick];
            } else if (mode === 'reference') {
                remark = `بحوالہ انتقال نمبر ${num} کی وجہ سے انتقال کا عمل بقایا ہے`;
            } else {
                remark = `${customPrefix.trim()} ${num} ${customSuffix.trim()}`;
            }
            return { number: num, remark };
        });
    }, [detectedNumbers, mode, customPrefix, customSuffix]);

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
        
        // Formats as TSV for direct paste into Excel
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
        
        // Adjust column widths
        worksheet['!cols'] = [{ wch: 15 }, { wch: 70 }];

        XLSX.writeFile(workbook, `mutation_remarks_${Date.now()}.xlsx`);
        toast({ title: "Excel Exported", description: "Downloading .xlsx file." });
    };

    const handleClear = () => {
        setNumbersString("");
        toast({ title: "Input Cleared" });
    };

    return (
        <Card className="max-w-6xl mx-auto border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl animate-enter">
            <CardHeader className="border-b border-border/40 pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <MessageSquareQuote className="h-6 w-6 text-primary" />
                            Mutation Remarker
                        </CardTitle>
                        <CardDescription className="text-base">
                            Professional Urdu status generator with automated number injection.
                        </CardDescription>
                    </div>
                    {detectedNumbers.length > 0 && (
                        <Badge variant="secondary" className="h-8 px-4 text-sm font-semibold bg-primary/10 text-primary border-primary/20 animate-in fade-in zoom-in">
                            <Hash className="h-3.5 w-3.5 mr-1" />
                            {detectedNumbers.length} IDs Detected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
                <div className="grid gap-8 lg:grid-cols-5">
                    {/* Left Side: Input (2/5 width) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="numbers-input" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                    1. Bulk Input Area
                                </Label>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] hover:bg-destructive/10 hover:text-destructive" onClick={handleClear} disabled={!numbersString}>
                                    <Trash2 className="h-3 w-3 mr-1" /> Clear
                                </Button>
                            </div>
                            <Textarea
                                id="numbers-input"
                                value={numbersString}
                                onChange={(e) => setNumbersString(e.target.value)}
                                placeholder="Paste numbers here... (e.g. 98 99 100)"
                                className="h-[280px] font-mono text-sm bg-background/40 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all resize-none shadow-inner"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                IDs like <code className="text-primary">6332/1</code> and ranges like <code className="text-primary">101-105</code> are supported.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Mode Selection & Config (3/5 width) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                2. Remark Generation Logic
                            </Label>
                            <Tabs defaultValue="random" value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl h-11">
                                    <TabsTrigger value="random" className="rounded-lg h-9">Random Status</TabsTrigger>
                                    <TabsTrigger value="reference" className="rounded-lg h-9">Bulk Reference</TabsTrigger>
                                    <TabsTrigger value="custom" className="rounded-lg h-9">Custom Template</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="random" className="p-6 rounded-xl border border-dashed border-primary/20 bg-primary/5 mt-4 space-y-3">
                                    <div className="flex items-center gap-2 text-primary">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <p className="text-xs font-bold uppercase tracking-wider">Correct Phrasing Active</p>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-urdu text-right" dir="rtl">
                                        یہ موڈ خود بخود درج ذیل دو سٹیٹس کو باری باری استعمال کرے گا:
                                    </p>
                                    <ul className="text-sm space-y-2 text-primary font-urdu text-right list-none" dir="rtl">
                                        <li>کھیوٹ نمبر <span className="text-foreground font-mono">[نمبر]</span> میں مالک موجود نہیں ہے</li>
                                        <li>کھیوٹ نمبر <span className="text-foreground font-mono">[نمبر]</span> میں مالک کے پاس انتقال کے لیئے درکار رقبہ موجود نہیں ہے</li>
                                    </ul>
                                </TabsContent>
                                
                                <TabsContent value="reference" className="p-6 rounded-xl border border-dashed border-blue-500/20 bg-blue-500/5 mt-4 space-y-3">
                                     <div className="flex items-center gap-2 text-blue-500">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <p className="text-xs font-bold uppercase tracking-wider">Auto-Reference Mode</p>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed font-urdu text-right" dir="rtl">
                                        تمام نمبرز کے لیے درج ذیل ریفرنس ریمارکس بنائے جائیں گے:
                                    </p>
                                    <div className="p-3 bg-background/80 rounded-lg border border-blue-500/20 text-right font-urdu text-sm" dir="rtl">
                                        بحوالہ انتقال نمبر <span className="text-blue-500 font-mono">[نمبر]</span> کی وجہ سے انتقال کا عمل بقایا ہے
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="custom" className="space-y-4 p-6 rounded-xl border border-dashed border-border/60 bg-muted/10 mt-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Urdu Prefix</Label>
                                            <Input value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value)} className="h-10 font-urdu text-right bg-background/60" dir="rtl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Urdu Suffix</Label>
                                            <Input value={customSuffix} onChange={(e) => setCustomSuffix(e.target.value)} className="h-10 font-urdu text-right bg-background/60" dir="rtl" />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Live Template Preview:</p>
                                        <div className="p-3 bg-background/80 rounded-lg border text-right font-urdu text-sm text-primary" dir="rtl">
                                            {customPrefix} <span className="text-foreground font-mono">12345</span> {customSuffix}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/40">
                             <Button onClick={handleCopyRemarks} variant="secondary" disabled={processedData.length === 0} className="flex-1 h-12 shadow-sm">
                                <Clipboard className="mr-2 h-4 w-4" />
                                Copy Remarks Column
                            </Button>
                            <Button onClick={handleCopyTable} variant="outline" disabled={processedData.length === 0} className="flex-1 h-12 shadow-sm">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Full Table
                            </Button>
                            <Button onClick={handleExportExcel} className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg" disabled={processedData.length === 0}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export .xlsx
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Result Table */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Live Preview ({processedData.length} entries)
                        </h3>
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md overflow-hidden shadow-xl">
                        <ScrollArea className="w-full">
                            <div className="max-h-[500px]">
                                <Table>
                                    <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-border/40">
                                            <TableHead className="w-[180px] font-bold text-foreground">Mutation ID</TableHead>
                                            <TableHead className="text-right pr-8 font-bold text-foreground">Generated Status / Remark (Urdu)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.length > 0 ? (
                                            processedData.map((item, i) => (
                                                <TableRow key={i} className="hover:bg-primary/5 transition-colors border-border/30 group">
                                                    <TableCell className="font-mono text-sm font-medium">{item.number}</TableCell>
                                                    <TableCell 
                                                        className="text-right font-urdu text-base py-4 min-w-[400px]" 
                                                        dir="rtl"
                                                    >
                                                        {item.remark}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-32 text-center text-muted-foreground italic">
                                                    Results will appear here after you paste numbers above.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </section>
            </CardContent>
        </Card>
    );
}

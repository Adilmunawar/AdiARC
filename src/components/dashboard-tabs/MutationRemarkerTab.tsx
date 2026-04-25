
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
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, Sparkles, Hash, AlertCircle } from 'lucide-react';
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
    
    // Mode-specific states
    const [referenceId, setReferenceId] = useState("");
    const [customPrefix, setCustomPrefix] = useState("انتقال نمبر");
    const [customSuffix, setCustomSuffix] = useState("کی رپورٹ مکمل ہے۔");

    // Standard Urdu phrases
    const PHRASES = [
        "مالک موقع پر موجود نہ ہے۔",
        "انتقال کے لیے رقبہ دستیاب نہ ہے۔"
    ];

    const detectedNumbers = useMemo(() => {
        // Separator-agnostic parsing: spaces, commas, semicolons, and new lines
        return numbersString.split(/[\s,;]+/).filter(n => n.trim() !== "");
    }, [numbersString]);

    const processedData = useMemo(() => {
        if (detectedNumbers.length === 0) return [];

        return detectedNumbers.map((num, index) => {
            let remark = "";
            if (mode === 'random') {
                // 50/50 split based on index
                const pick = index % PHRASES.length;
                remark = PHRASES[pick];
            } else if (mode === 'reference') {
                const ref = referenceId.trim();
                remark = ref ? `بحوالہ انتقال نمبر ${ref} کی وجہ سے انتقال کا عمل بقایا ہے۔` : "بغیر حوالہ انتقال";
            } else {
                remark = `${customPrefix.trim()} ${num} ${customSuffix.trim()}`;
            }
            return { number: num, remark };
        });
    }, [detectedNumbers, mode, referenceId, customPrefix, customSuffix]);

    const handleCopyRemarks = async () => {
        if (processedData.length === 0) return;
        
        if (mode === 'reference' && !referenceId.trim()) {
            toast({ 
                variant: "destructive", 
                title: "Reference Required", 
                description: "Please enter a reference number before copying.",
                icon: <AlertCircle className="h-4 w-4" />
            });
            return;
        }

        const text = processedData.map(d => d.remark).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: "Remarks Copied", description: `${processedData.length} remarks copied to clipboard.` });
        } catch (err) {
            toast({ title: "Copy Failed", variant: "destructive" });
        }
    };

    const handleExportExcel = () => {
        if (processedData.length === 0) return;

        if (mode === 'reference' && !referenceId.trim()) {
            toast({ 
                variant: "destructive", 
                title: "Reference Required", 
                description: "Please enter a reference number before exporting.",
                icon: <AlertCircle className="h-4 w-4" />
            });
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(processedData.map(item => ({
            "Mutation Number": item.number,
            "Remark (Urdu)": item.remark
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Generated Remarks");
        
        // Adjust column widths
        worksheet['!cols'] = [{ wch: 20 }, { wch: 60 }];

        XLSX.writeFile(workbook, `mutation_remarks_${Date.now()}.xlsx`);
        toast({ title: "Excel Exported", description: "Your file is downloading." });
    };

    const handleClear = () => {
        setNumbersString("");
        setReferenceId("");
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
                            Smart Urdu status generator for bulk mutation processing.
                        </CardDescription>
                    </div>
                    {detectedNumbers.length > 0 && (
                        <Badge variant="secondary" className="h-8 px-4 text-sm font-semibold bg-primary/10 text-primary border-primary/20 animate-in fade-in zoom-in">
                            <Hash className="h-3.5 w-3.5 mr-1" />
                            {detectedNumbers.length} Numbers Detected
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
                                    1. Bulk Input
                                </Label>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] hover:bg-destructive/10 hover:text-destructive" onClick={handleClear} disabled={!numbersString}>
                                    <Trash2 className="h-3 w-3 mr-1" /> Clear
                                </Button>
                            </div>
                            <div className="relative group">
                                <Textarea
                                    id="numbers-input"
                                    value={numbersString}
                                    onChange={(e) => setNumbersString(e.target.value)}
                                    placeholder="Paste numbers here... (separators: space, comma, semicolon, newline)"
                                    className="h-[300px] font-mono text-sm bg-background/40 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all resize-none shadow-inner"
                                />
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        Ctrl+V
                                    </kbd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Mode Selection & Config (3/5 width) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                2. Configuration & Strategy
                            </Label>
                            <Tabs defaultValue="random" value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
                                    <TabsTrigger value="random" className="rounded-lg data-[state=active]:shadow-md">Random Status</TabsTrigger>
                                    <TabsTrigger value="reference" className="rounded-lg data-[state=active]:shadow-md">Reference (بحوالہ)</TabsTrigger>
                                    <TabsTrigger value="custom" className="rounded-lg data-[state=active]:shadow-md">Custom Template</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="random" className="p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-sm text-foreground/80 leading-relaxed font-urdu text-right" dir="rtl">
                                        یہ موڈ خود بخود درج ذیل دو سٹیٹس کو آپ کی لسٹ پر 50/50 کی بنیاد پر تقسیم کرے گا:
                                    </p>
                                    <ul className="text-sm space-y-1 text-primary font-urdu text-right list-disc list-inside" dir="rtl">
                                        <li>مالک موقع پر موجود نہ ہے۔</li>
                                        <li>انتقال کے لیے رقبہ دستیاب نہ ہے۔</li>
                                    </ul>
                                </TabsContent>
                                
                                <TabsContent value="reference" className="space-y-4 p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Master Reference Mutation ID</Label>
                                        <div className="relative">
                                            <Input 
                                                placeholder="e.g. 61168" 
                                                value={referenceId} 
                                                onChange={(e) => setReferenceId(e.target.value)}
                                                className={cn("h-11 bg-background/60", mode === 'reference' && !referenceId && "border-destructive/50")}
                                            />
                                            {mode === 'reference' && !referenceId && (
                                                <span className="absolute -bottom-5 left-0 text-[10px] text-destructive flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> This ID is required for reference mode
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Preview Remark:</p>
                                        <div className="p-3 bg-background/80 rounded-lg border text-right font-urdu text-sm" dir="rtl">
                                            بحوالہ انتقال نمبر <span className="text-primary font-bold">{referenceId || '____'}</span> کی وجہ سے انتقال کا عمل بقایا ہے۔
                                        </div>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="custom" className="space-y-4 p-6 rounded-xl border border-dashed border-border/60 bg-muted/20 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Urdu Prefix</Label>
                                            <Input 
                                                value={customPrefix} 
                                                onChange={(e) => setCustomPrefix(e.target.value)}
                                                className="h-10 font-urdu text-right bg-background/60"
                                                dir="rtl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-muted-foreground">Urdu Suffix</Label>
                                            <Input 
                                                value={customSuffix} 
                                                onChange={(e) => setCustomSuffix(e.target.value)}
                                                className="h-10 font-urdu text-right bg-background/60"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Example Result:</p>
                                        <div className="p-3 bg-background/80 rounded-lg border text-right font-urdu text-sm text-primary" dir="rtl">
                                            {customPrefix} <span className="text-foreground font-mono">12345</span> {customSuffix}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/40">
                             <Button 
                                onClick={handleCopyRemarks} 
                                variant="secondary" 
                                disabled={processedData.length === 0}
                                className="flex-1 h-12 shadow-sm"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Remarks Column
                            </Button>
                            <Button 
                                onClick={handleExportExcel} 
                                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/10"
                                disabled={processedData.length === 0}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Download Full Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Result Table */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Live Generation Table
                        </h3>
                    </div>

                    {processedData.length > 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-background/40 backdrop-blur-md overflow-hidden shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                            <div className="max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-md">
                                        <TableRow className="border-border/40">
                                            <TableHead className="w-[180px] font-bold text-foreground">Mutation ID</TableHead>
                                            <TableHead className="text-right pr-8 font-bold text-foreground">Generated Remark (Urdu)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.slice(0, 100).map((item, i) => (
                                            <TableRow key={i} className="hover:bg-primary/5 transition-colors border-border/30 group animate-in fade-in-0 duration-300 slide-in-from-left-2" style={{ animationDelay: `${i * 10}ms` }}>
                                                <TableCell className="font-mono text-sm font-medium">{item.number}</TableCell>
                                                <TableCell className="text-right font-urdu text-base group-hover:text-primary transition-colors" dir="rtl">{item.remark}</TableCell>
                                            </TableRow>
                                        ))}
                                        {processedData.length > 100 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-6 bg-muted/20">
                                                    Showing first 100 entries. Use 'Download Excel' to see all {processedData.length} generated remarks.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-3xl bg-muted/10 border-border/40 animate-pulse">
                            <div className="p-4 bg-background/60 rounded-full shadow-inner mb-4">
                                <MessageSquareQuote className="h-12 w-12 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-lg font-semibold text-muted-foreground">Waiting for input data...</h4>
                            <p className="text-sm text-muted-foreground/60 max-w-xs text-center mt-1">
                                Paste your mutation numbers into the input area above to start generating professional remarks.
                            </p>
                        </div>
                    )}
                </section>
            </CardContent>
        </Card>
    );
}


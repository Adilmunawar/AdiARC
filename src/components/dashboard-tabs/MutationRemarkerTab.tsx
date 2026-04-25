
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
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, RefreshCcw, Sparkles } from 'lucide-react';
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
    const [customPrefix, setCustomPrefix] = useState("پراپرٹی نمبر");
    const [customSuffix, setCustomSuffix] = useState("کی جانچ پڑتال مکمل ہو چکی ہے۔");

    // Standard Urdu phrases
    const PHRASES = [
        "مالک موقع پر موجود نہ ہے۔",
        "انتقال کے لیے رقبہ دستیاب نہ ہے۔"
    ];

    const processedData = useMemo(() => {
        const lines = numbersString.split(/[\s,;\n]+/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return [];

        return lines.map((num, index) => {
            let remark = "";
            if (mode === 'random') {
                // Use a simple seeded-like random to keep it somewhat stable during re-renders
                const pick = (num.length + index) % PHRASES.length;
                remark = PHRASES[pick];
            } else if (mode === 'reference') {
                const ref = referenceId.trim() || "_____";
                remark = `بحوالہ انتقال نمبر ${ref} کی وجہ سے انتقال کا عمل بقایا ہے۔`;
            } else {
                remark = `${customPrefix.trim()} ${num} ${customSuffix.trim()}`;
            }
            return { number: num, remark };
        });
    }, [numbersString, mode, referenceId, customPrefix, customSuffix]);

    const handleCopyRemarks = async () => {
        if (processedData.length === 0) return;
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
        
        const worksheet = XLSX.utils.json_to_sheet(processedData.map(item => ({
            "Mutation Number": item.number,
            "Remark (Urdu)": item.remark
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Generated Remarks");
        
        // Adjust column widths
        worksheet['!cols'] = [{ wch: 20 }, { wch: 50 }];

        XLSX.writeFile(workbook, `mutation_remarks_${Date.now()}.xlsx`);
        toast({ title: "Excel Exported", description: "Your file is downloading." });
    };

    const handleClear = () => {
        setNumbersString("");
        toast({ title: "Cleared", description: "Input and results reset." });
    };

    return (
        <Card className="max-w-5xl mx-auto border-border/70 bg-card/80 shadow-md animate-enter">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageSquareQuote className="h-5 w-5 text-primary" />
                    Mutation Remarker
                </CardTitle>
                <CardDescription>
                    Bulk generate Urdu remarks for mutation numbers. Perfect for status updates and references.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Side: Input */}
                    <div className="space-y-4">
                        <section className="space-y-2">
                            <Label htmlFor="numbers-input">1. Mutation Numbers</Label>
                            <Textarea
                                id="numbers-input"
                                value={numbersString}
                                onChange={(e) => setNumbersString(e.target.value)}
                                placeholder="Paste mutation numbers here (one per line)..."
                                className="h-64 font-mono text-xs"
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                                <span>Found: {processedData.length} items</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleClear}>
                                    <Trash2 className="h-3 w-3 mr-1" /> Clear Input
                                </Button>
                            </div>
                        </section>
                    </div>

                    {/* Right Side: Mode Selection & Config */}
                    <div className="space-y-6">
                        <section className="space-y-2">
                            <Label>2. Select Remark Mode</Label>
                            <Tabs defaultValue="random" value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="random" className="text-xs">Random</TabsTrigger>
                                    <TabsTrigger value="reference" className="text-xs">Reference</TabsTrigger>
                                    <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="random" className="p-4 rounded-md border bg-muted/30 mt-2">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Randomly assigns common LRMIS statuses:
                                        <br />• "مالک موقع پر موجود نہ ہے"
                                        <br />• "انتقال کے لیے رقبہ دستیاب نہ ہے"
                                    </p>
                                </TabsContent>
                                
                                <TabsContent value="reference" className="space-y-3 p-4 rounded-md border bg-muted/30 mt-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Reference Mutation Number</Label>
                                        <Input 
                                            placeholder="e.g. 61168" 
                                            value={referenceId} 
                                            onChange={(e) => setReferenceId(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Preview: بحوالہ انتقال نمبر {referenceId || '____'} کی وجہ سے انتقال کا عمل بقایا ہے۔
                                    </p>
                                </TabsContent>
                                
                                <TabsContent value="custom" className="space-y-3 p-4 rounded-md border bg-muted/30 mt-2">
                                    <div className="grid gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Urdu Prefix</Label>
                                            <Input 
                                                value={customPrefix} 
                                                onChange={(e) => setCustomPrefix(e.target.value)}
                                                className="h-8 text-xs font-urdu"
                                                dir="rtl"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Urdu Suffix</Label>
                                            <Input 
                                                value={customSuffix} 
                                                onChange={(e) => setCustomSuffix(e.target.value)}
                                                className="h-8 text-xs font-urdu"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </section>

                        <div className="flex flex-col gap-3 pt-4 border-t border-dashed">
                             <Button 
                                onClick={handleCopyRemarks} 
                                variant="outline" 
                                disabled={processedData.length === 0}
                                className="w-full justify-start"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Remarks Column Only
                            </Button>
                            <Button 
                                onClick={handleExportExcel} 
                                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                                disabled={processedData.length === 0}
                            >
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export Full Grid to Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Result Table */}
                {processedData.length > 0 && (
                    <section className="space-y-3 pt-6 border-t border-dashed">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Preview Generated Remarks
                            </h3>
                        </div>
                        <div className="rounded-md border border-border bg-card overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[150px]">Mutation ID</TableHead>
                                        <TableHead className="text-right pr-8">Generated Remark (Urdu)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedData.slice(0, 100).map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs">{item.number}</TableCell>
                                            <TableCell className="text-right font-urdu text-sm" dir="rtl">{item.remark}</TableCell>
                                        </TableRow>
                                    ))}
                                    {processedData.length > 100 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-4 bg-muted/20">
                                                Showing first 100 items. Download Excel to see all {processedData.length} records.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                )}
            </CardContent>
        </Card>
    );
}

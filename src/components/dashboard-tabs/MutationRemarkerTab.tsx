
"use client";

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, Sparkles, Hash, ListOrdered, CheckCircle2, RefreshCw, Settings2, Dices, ArrowRightLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type RemarkItem = {
    number: string;
    remark: string;
    type: 'status' | 'reference';
};

export function MutationRemarkerTab() {
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Multi-List States
    const [masterList, setMasterList] = useState("");
    const [statusList, setStatusList] = useState(""); // List for Owner/Area remarks
    const [referenceList, setReferenceList] = useState(""); // List for Reference remarks

    // Helper to parse strings into arrays of IDs
    const parseList = (input: string) => {
        return input.split(/[\s,;]+/).map(n => n.trim()).filter(n => n !== "");
    };

    const detectedMaster = useMemo(() => parseList(masterList), [masterList]);
    const detectedStatus = useMemo(() => new Set(parseList(statusList)), [statusList]);
    const detectedReference = useMemo(() => new Set(parseList(referenceList)), [referenceList]);

    const processedData = useMemo(() => {
        if (detectedMaster.length === 0) return [];

        return detectedMaster.map((num, index) => {
            let remark = "";
            let type: 'status' | 'reference' = 'reference';

            // Logic: If number is in the Status List, it gets the Owner/Area remarks
            // Otherwise, it gets the Reference remark (as per user scenario)
            if (detectedStatus.has(num)) {
                type = 'status';
                const phrases = [
                    `کھیوٹ نمبر ${num} میں مالک موجود نہیں ہے`,
                    `کھیوٹ نمبر ${num} میں مالک کے پاس انتقال کے لئے درکار رقبہ موجود نہیں ہے`
                ];
                
                // Randomization based on index and shuffle key
                const seed = (index + 7) * (refreshKey + 13) * 1103515245 + 12345;
                const hash = (seed >>> 16) % phrases.length;
                remark = phrases[hash];
            } else {
                // Default to Reference Remark
                type = 'reference';
                remark = `بحوالہ انتقال نمبر ${num} کی وجہ سے انتقال کا عمل بقایا ہے`;
            }

            return { number: num, remark, type };
        });
    }, [detectedMaster, detectedStatus, refreshKey]);

    const stats = useMemo(() => {
        return {
            total: processedData.length,
            statusCount: processedData.filter(d => d.type === 'status').length,
            refCount: processedData.filter(d => d.type === 'reference').length
        };
    }, [processedData]);

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

    const handleExportExcel = () => {
        if (processedData.length === 0) return;
        
        const worksheet = XLSX.utils.json_to_sheet(processedData.map(item => ({
            "Mutation ID": item.number,
            "Type": item.type === 'status' ? 'Status (Owner/Area)' : 'Reference',
            "Remark (Urdu)": item.remark
        })));
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Advanced Remarks");
        worksheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 80 }];

        XLSX.writeFile(workbook, `advanced_mutation_remarks_${Date.now()}.xlsx`);
        toast({ title: "Excel Exported", description: "Downloading .xlsx file." });
    };

    const handleClearAll = () => {
        setMasterList("");
        setStatusList("");
        setReferenceList("");
        toast({ title: "All Inputs Cleared" });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <MessageSquareQuote className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Advanced Remarker</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Cross-reference multiple lists to generate precise administrative remarks.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={handleClearAll} disabled={!masterList && !statusList}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                    <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline" size="sm" className="h-9 rounded-xl" disabled={processedData.length === 0}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Shuffle Status
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
                                Multi-List Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* List 1: Master List */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold flex items-center gap-1.5">
                                        <ListOrdered className="h-3.5 w-3.5 text-primary" />
                                        1. Master Sequence
                                    </Label>
                                    <Badge variant="secondary" className="text-[10px] py-0">{parseList(masterList).length} IDs</Badge>
                                </div>
                                <Textarea
                                    value={masterList}
                                    onChange={(e) => setMasterList(e.target.value)}
                                    placeholder="Paste all numbers in the desired order..."
                                    className="h-[120px] font-mono text-xs bg-background/50 resize-none rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Determines the overall sequence of the table.</p>
                            </div>

                            {/* List 2: Status List */}
                            <div className="space-y-2 pt-4 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold flex items-center gap-1.5">
                                        <Dices className="h-3.5 w-3.5 text-amber-500" />
                                        2. Status List (Random LRMIS)
                                    </Label>
                                    <Badge variant="secondary" className="text-[10px] py-0 bg-amber-500/10 text-amber-600">{parseList(statusList).length} IDs</Badge>
                                </div>
                                <Textarea
                                    value={statusList}
                                    onChange={(e) => setStatusList(e.target.value)}
                                    placeholder="Numbers to get 'Owner/Area' status..."
                                    className="h-[100px] font-mono text-xs bg-background/50 resize-none rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Will receive "Owner not present" or "Area not available".</p>
                            </div>

                            {/* List 3: Explicit Reference List (Optional as everything else defaults) */}
                            <div className="space-y-2 pt-4 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold flex items-center gap-1.5">
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
                                        3. Reference List (Explicit)
                                    </Label>
                                    <Badge variant="secondary" className="text-[10px] py-0 bg-blue-500/10 text-blue-600">{parseList(referenceList).length} IDs</Badge>
                                </div>
                                <Textarea
                                    value={referenceList}
                                    onChange={(e) => setReferenceList(e.target.value)}
                                    placeholder="Explicit list for 'Due to Mutation' remarks..."
                                    className="h-[80px] font-mono text-xs bg-background/50 resize-none rounded-xl"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Note: Master IDs not in 'Status List' default to this.</p>
                            </div>

                            <div className="pt-4 flex flex-col gap-2">
                                <Button onClick={handleCopyRemarks} variant="secondary" disabled={processedData.length === 0} className="w-full rounded-xl text-xs font-bold">
                                    <Copy className="mr-2 h-4 w-4" /> Copy All Remarks
                                </Button>
                                <Button onClick={handleExportExcel} className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold" disabled={processedData.length === 0}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel (.xlsx)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Processed</p>
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                        </Card>
                        <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Status Remarks</p>
                            <p className="text-2xl font-bold text-amber-500">{stats.statusCount}</p>
                        </Card>
                        <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Ref Remarks</p>
                            <p className="text-2xl font-bold text-blue-500">{stats.refCount}</p>
                        </Card>
                    </div>

                    <Card className="flex-1 border-border/40 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                        <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Generated Data Table
                            </h3>
                            {processedData.length > 0 && (
                                <Badge variant="outline" className="text-[10px] font-medium bg-background/50 px-2 py-0.5 rounded-full border-primary/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                                    Live Processing
                                </Badge>
                            )}
                        </div>

                        <div className="flex-1 relative">
                            <ScrollArea className="h-full w-full absolute inset-0">
                                <Table className="relative min-w-full">
                                    <TableHeader className="bg-muted/90 sticky top-0 z-20 backdrop-blur-md shadow-sm">
                                        <TableRow className="border-border/40">
                                            <TableHead className="w-[120px] font-bold">Mutation ID</TableHead>
                                            <TableHead className="text-right pr-8 font-bold">Intelligent Remark (Urdu)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {processedData.length > 0 ? (
                                            processedData.map((item, i) => (
                                                <TableRow key={`${i}-${refreshKey}`} className="hover:bg-primary/5 transition-colors border-border/20 group">
                                                    <TableCell className="font-mono text-xs font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "h-1.5 w-1.5 rounded-full",
                                                                item.type === 'status' ? "bg-amber-500" : "bg-blue-500"
                                                            )} />
                                                            {item.number}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell 
                                                        className="text-right font-urdu text-[15px] py-4 min-w-[450px] leading-relaxed" 
                                                        dir="rtl"
                                                    >
                                                        {item.remark}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-[400px] text-center pointer-events-none opacity-30">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <FileText className="h-12 w-12 stroke-[1px]" />
                                                        <p className="text-sm font-medium">Paste Master List to Begin</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

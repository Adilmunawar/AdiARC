
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareQuote, Copy, Download, Trash2, FileSpreadsheet, Sparkles, ListOrdered, RefreshCw, Settings2, Dices, ArrowRightLeft, FileText, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

type RemarkItem = {
    number: string;
    remark: string;
    type: 'status' | 'reference' | 'custom';
};

export function MutationRemarkerTab() {
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeWorkflow, setActiveWorkflow] = useState("standard");

    // Standard Mode State
    const [standardInput, setStandardInput] = useState("");
    const [standardMode, setStandardMode] = useState<"random" | "reference" | "custom">("random");
    const [customTemplate, setCustomTemplate] = useState("انتقال کا عمل مکمل ہو چکا ہے - نمبر:");

    // Advanced Mode State
    const [masterList, setMasterList] = useState("");
    const [statusList, setStatusList] = useState("");
    const [referenceList, setReferenceList] = useState("");

    // Phrases
    const PHRASE_OWNER_MISSING = (num: string) => `کھیوٹ نمبر ${num} میں مالک موجود نہیں ہے`;
    const PHRASE_AREA_MISSING = (num: string) => `کھیوٹ نمبر ${num} میں مالک کے پاس انتقال کے لئے درکار رقبہ موجود نہیں ہے`;
    const PHRASE_REFERENCE = (num: string) => `بحوالہ انتقال نمبر ${num} کی وجہ سے انتقال کا عمل بقایا ہے`;

    const parseList = (input: string) => {
        return input.split(/[\s,;]+/).map(n => n.trim()).filter(n => n !== "");
    };

    const getRandomStatus = (num: string, index: number) => {
        const seed = (index + 7) * (refreshKey + 13) * 1103515245 + 12345;
        return (seed >>> 16) % 2 === 0 ? PHRASE_OWNER_MISSING(num) : PHRASE_AREA_MISSING(num);
    };

    // Processing Logic
    const processedData = useMemo(() => {
        if (activeWorkflow === "standard") {
            const numbers = parseList(standardInput);
            return numbers.map((num, i) => {
                let remark = "";
                if (standardMode === "random") remark = getRandomStatus(num, i);
                else if (standardMode === "reference") remark = PHRASE_REFERENCE(num);
                else remark = `${customTemplate} ${num}`;

                return { 
                    number: num, 
                    remark, 
                    type: standardMode === "random" ? "status" : (standardMode === "reference" ? "reference" : "custom") 
                } as RemarkItem;
            });
        } else {
            const master = parseList(masterList);
            const statusSet = new Set(parseList(statusList));
            
            return master.map((num, i) => {
                const isStatus = statusSet.has(num);
                return {
                    number: num,
                    remark: isStatus ? getRandomStatus(num, i) : PHRASE_REFERENCE(num),
                    type: isStatus ? 'status' : 'reference'
                } as RemarkItem;
            });
        }
    }, [activeWorkflow, standardInput, standardMode, customTemplate, masterList, statusList, refreshKey]);

    const handleCopyRemarks = async () => {
        if (processedData.length === 0) return;
        const text = processedData.map(d => d.remark).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: "Remarks Copied", description: "Urdu text copied to clipboard." });
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Remarks");
        worksheet['!cols'] = [{ wch: 15 }, { wch: 80 }];
        XLSX.writeFile(workbook, `mutation_remarks_${Date.now()}.xlsx`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <MessageSquareQuote className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Mutation Remarker</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Professional Urdu remark generation for LRMIS data management.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setStandardInput(""); setMasterList(""); setStatusList(""); }} className="rounded-xl">
                        <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                    <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline" size="sm" className="rounded-xl">
                        <RefreshCw className="h-4 w-4 mr-2" /> Shuffle
                    </Button>
                </div>
            </div>

            <Tabs value={activeWorkflow} onValueChange={setActiveWorkflow} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="standard" className="gap-2"><LayoutGrid className="h-4 w-4" /> Standard</TabsTrigger>
                    <TabsTrigger value="advanced" className="gap-2"><Sparkles className="h-4 w-4" /> Advanced</TabsTrigger>
                </TabsList>

                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Config Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-border/40 bg-muted/20">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Settings2 className="h-4 w-4" /> Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <TabsContent value="standard" className="m-0 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold">Mutation Numbers</Label>
                                        <Textarea 
                                            value={standardInput} 
                                            onChange={(e) => setStandardInput(e.target.value)}
                                            placeholder="Paste IDs here (space, comma, or newline separated)..."
                                            className="h-[150px] font-mono text-xs bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold">Remark Type</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button variant={standardMode === 'random' ? 'default' : 'outline'} size="sm" onClick={() => setStandardMode('random')} className="text-[10px]">Random Status</Button>
                                            <Button variant={standardMode === 'reference' ? 'default' : 'outline'} size="sm" onClick={() => setStandardMode('reference')} className="text-[10px]">Bulk Ref</Button>
                                            <Button variant={standardMode === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setStandardMode('custom')} className="text-[10px]">Custom</Button>
                                        </div>
                                    </div>
                                    {standardMode === 'custom' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Custom Template (Prefix)</Label>
                                            <Input value={customTemplate} onChange={e => setCustomTemplate(e.target.value)} className="font-urdu text-right" dir="rtl" />
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="advanced" className="m-0 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold flex items-center gap-2"><ListOrdered className="h-3 w-3 text-primary"/> 1. Master Sequence</Label>
                                        <Textarea 
                                            value={masterList} 
                                            onChange={(e) => setMasterList(e.target.value)}
                                            placeholder="The order of the final table..."
                                            className="h-[100px] font-mono text-xs bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold flex items-center gap-2"><Dices className="h-3 w-3 text-amber-500"/> 2. Status List (Random LRMIS Phrases)</Label>
                                        <Textarea 
                                            value={statusList} 
                                            onChange={(e) => setStatusList(e.target.value)}
                                            placeholder="IDs that should get Owner/Area remarks..."
                                            className="h-[80px] font-mono text-xs bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold flex items-center gap-2"><ArrowRightLeft className="h-3 w-3 text-blue-500"/> 3. Reference List (Defaults to Ref Phrase)</Label>
                                        <p className="text-[10px] text-muted-foreground italic">Master IDs not in List 2 get the "Reference" phrase.</p>
                                    </div>
                                </TabsContent>

                                <div className="pt-6 flex flex-col gap-2">
                                    <Button onClick={handleCopyRemarks} variant="secondary" className="w-full font-bold text-xs" disabled={processedData.length === 0}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy All Remarks
                                    </Button>
                                    <Button onClick={handleExportExcel} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs" disabled={processedData.length === 0}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export to Excel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Rows</p>
                                <p className="text-2xl font-bold text-primary">{processedData.length}</p>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Status Count</p>
                                <p className="text-2xl font-bold text-amber-500">{processedData.filter(d => d.type === 'status').length}</p>
                            </Card>
                            <Card className="bg-card/60 backdrop-blur-md p-3 border-border/40">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Ref Count</p>
                                <p className="text-2xl font-bold text-blue-500">{processedData.filter(d => d.type === 'reference').length}</p>
                            </Card>
                        </div>

                        <Card className="flex-1 border-border/40 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
                            <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> Generated Output
                                </h3>
                                <Badge variant="outline" className="text-[10px]">Auto-Synced</Badge>
                            </div>
                            <div className="flex-1 relative">
                                <ScrollArea className="h-full w-full absolute inset-0">
                                    <Table className="relative">
                                        <TableHeader className="bg-muted/95 sticky top-0 z-20 backdrop-blur-md">
                                            <TableRow>
                                                <TableHead className="w-[100px] font-bold">ID</TableHead>
                                                <TableHead className="text-right pr-8 font-bold">Remark (Urdu)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {processedData.length > 0 ? (
                                                processedData.map((item, i) => (
                                                    <TableRow key={`${i}-${refreshKey}`} className="hover:bg-primary/5 transition-colors border-border/10">
                                                        <TableCell className="font-mono text-xs font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-1.5 w-1.5 rounded-full", item.type === 'status' ? 'bg-amber-500' : 'bg-blue-500')} />
                                                                {item.number}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-urdu text-[15px] py-4 min-w-[400px]" dir="rtl">
                                                            {item.remark}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-[400px] text-center opacity-30">
                                                        <div className="flex flex-col items-center justify-center gap-4">
                                                            <LayoutGrid className="h-12 w-12 stroke-[1px]" />
                                                            <p className="text-sm font-medium">Results will appear here</p>
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
            </Tabs>
        </div>
    );
}

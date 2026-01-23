
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Play, Trash2, Upload, Target, CheckCircle, Clock, Users, BarChart, PieChartIcon, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart as RechartsBarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- TYPE DEFINITIONS for Mutation Progress Report ---
type RawMutationProgressData = {
  "User Name": string;
  "Full Name": string;
  "Implemented Today": number;
  "Pending (Active Today)": number;
  "Total Activity Today": number;
};

type ProcessedMutationProgressItem = {
  fullName: string;
  pending: number;
  total: number;
  implemented: number;
};

// --- TYPE DEFINITIONS for Data Entry Report ---
type RawDataEntryItem = {
    "User Name": string;
    "Full Name": string;
    "Shajra (Family Tree)": number;
    "Ownership": number;
    "Khasra": number;
    "Possession (Kashtkar)": number;
    "Total Entries Today": number;
};

type ProcessedDataEntryItem = {
    fullName: string;
    shajra: number;
    ownership: number;
    khasra: number;
    possession: number;
    total: number;
};

// --- DEFAULT SAMPLE DATA ---
const defaultMutationRawData: RawMutationProgressData[] = [
  { "User Name": "...", "Full Name": "لائبہ ارشاد ریاض", "Implemented Today": 0, "Pending (Active Today)": 1, "Total Activity Today": 2 },
  { "User Name": "...", "Full Name": "صنائیلہ سعید سعید احمد", "Implemented Today": 0, "Pending (Active Today)": 9, "Total Activity Today": 33 },
  { "User Name": "...", "Full Name": "عمیر حسین محمد سلیم", "Implemented Today": 0, "Pending (Active Today)": 14, "Total Activity Today": 44 },
  { "User Name": "...", "Full Name": "شکیل غلام مصطفی", "Implemented Today": 0, "Pending (Active Today)": 11, "Total Activity Today": 55 },
];
const defaultMutationJsonString = JSON.stringify(defaultMutationRawData, null, 2);

const defaultDataEntryRawData: RawDataEntryItem[] = [
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000f3e620d9b7df3fdfe6f7e630ffa90200d512dd852e457cfda67db915f1279d3c",
    "Full Name": "الساء محمد امجد",
    "Shajra (Family Tree)": 898,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 898
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b03020000006916f12ff91af42bb528b7acaccaea71a8677834bbe03a5a0b0cd1047c24464cadc8afd412ef3feac9bba26adfc00bdf",
    "Full Name": "لائبہ ارشاد ریاض",
    "Shajra (Family Tree)": 855,
    "Ownership": 4,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 859
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b030200000049deb3eb7a00c9cb2e78d325344a87fd52f05ff56ab88ad998c7bf9205f0a1074d4f55269d83983c",
    "Full Name": "نیناں جان جان محمد",
    "Shajra (Family Tree)": 712,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 712
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b03020000001621dd5b4a52985569516cf0bfb16b71c25d266cd43eccfc29ba88e23b5e4d085c17bd6b122ae6de",
    "Full Name": "روحیل طارق محمد طارق",
    "Shajra (Family Tree)": 586,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 586
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000abafebfc6a9dbd5b3045627d827d8e29a227b3204095f7d07eb9982b2c0034fa",
    "Full Name": "ایاز حیدر سجاد حیدر",
    "Shajra (Family Tree)": 572,
    "Ownership": 11,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 583
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000a5610d78a86e7abf24b30216a9b15dd5b20e40309e421181f67722cc31115a3913edb914d64a2a31",
    "Full Name": "علی محمود محمود احمد ",
    "Shajra (Family Tree)": 573,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 573
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b030200000068c69220cee70c2710fca5636a0009d2518cbf41d66d52156e98eca7c78cbcc3",
    "Full Name": "اویس زاہد محمد زاہد",
    "Shajra (Family Tree)": 554,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 554
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000b29bc759527e3a64165e31f9e5a37af555ff36ac05676d2af8902d6bad4f70fc",
    "Full Name": "لبنی لیاقت علی",
    "Shajra (Family Tree)": 538,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 538
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b03020000001fc20a5be2824696ae363ca78cc0a99ac948eb72c6c0dea16bde09bbe4320cafe655db7cd1f1f4cd",
    "Full Name": "شکیل غلام مصطفی",
    "Shajra (Family Tree)": 236,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 236
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000a03f6ce66bf427eebdc50e31fb907d1bc3cd2cfac5cffc8752927faa5b40ff64d958fb9f28ba5b713872620ccaa6dc4d",
    "Full Name": "صلیحہ طارق محمد طارق",
    "Shajra (Family Tree)": 226,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 226
  },
  {
    "User Name": "0x0082ea355fb4a2dcc5a18c2849e36b0302000000c3944a4541f77a96355dafd35e0d3047a330005e0b2281e2b4d5fb7a91997d94",
    "Full Name": "عمیر حسین محمد سلیم",
    "Shajra (Family Tree)": 191,
    "Ownership": 0,
    "Khasra": 0,
    "Possession (Kashtkar)": 0,
    "Total Entries Today": 191
  }
];
const defaultDataEntryJsonString = JSON.stringify(defaultDataEntryRawData, null, 2);


// --- HELPER FUNCTIONS to process data ---
const DATA_ENTRY_CHART_COLORS = {
    shajra: 'hsl(210 90% 55%)',
    ownership: 'hsl(142 76% 36%)',
    khasra: 'hsl(48 96% 53%)',
    possession: 'hsl(262 88% 60%)',
};


export function DailyProgressTab() {
  const { toast } = useToast();
  
  // State for Mutation Progress Report
  const [mutationJsonInputs, setMutationJsonInputs] = useState<string[]>([]);
  const [mutationMauzaName, setMutationMauzaName] = useState('Sample Mauza');
  const [mutationReportData, setMutationReportData] = useState<ProcessedMutationProgressItem[]>([]);
  const [isMutationReportReady, setIsMutationReportReady] = useState(false);
  const [mutationFileNames, setMutationFileNames] = useState<string[]>([]);
  const mutationFileInputRef = useRef<HTMLInputElement>(null);

  // State for Data Entry Report
  const [dataEntryJsonInputs, setDataEntryJsonInputs] = useState<string[]>([]);
  const [dataEntryMauzaName, setDataEntryMauzaName] = useState('Sample Mauza');
  const [dataEntryReportData, setDataEntryReportData] = useState<ProcessedDataEntryItem[]>([]);
  const [isDataEntryReportReady, setIsDataEntryReportReady] = useState(false);
  const [dataEntryFileNames, setDataEntryFileNames] = useState<string[]>([]);
  const dataEntryFileInputRef = useRef<HTMLInputElement>(null);

  const processJsonData = useMemo(() => <T, U>(jsonInputs: string[], type: 'mutation' | 'data-entry'): U[] => {
    const aggregatedData = new Map<string, any>();

    for (const jsonInput of jsonInputs) {
        let rawData: T[];
        try {
          rawData = JSON.parse(jsonInput);
        } catch {
          toast({ title: "Invalid JSON", description: "One of the files contains invalid JSON and was skipped.", variant: "destructive"});
          continue;
        }

        if (!Array.isArray(rawData)) {
          toast({ title: "Invalid Data Format", description: "One of the files is not a JSON array and was skipped.", variant: "destructive"});
          continue;
        }
        
        for (const item of rawData) {
            const fullName = (item as any)["Full Name"];
            if (!fullName) continue;

            const existing = aggregatedData.get(fullName);
            
            if (type === 'mutation') {
                const mutItem = item as RawMutationProgressData;
                const implemented = Number(mutItem["Implemented Today"]) || 0;
                const pending = Number(mutItem["Pending (Active Today)"]) || 0;
                const total = Number(mutItem["Total Activity Today"]) || 0;

                if (existing) {
                    existing.implemented += implemented;
                    existing.pending += pending;
                    existing.total += total;
                } else {
                    aggregatedData.set(fullName, { fullName, implemented, pending, total });
                }
            } else { // type === 'data-entry'
                const deItem = item as RawDataEntryItem;
                const shajra = Number(deItem["Shajra (Family Tree)"]) || 0;
                const ownership = Number(deItem["Ownership"]) || 0;
                const khasra = Number(deItem["Khasra"]) || 0;
                const possession = Number(deItem["Possession (Kashtkar)"]) || 0;
                const total = Number(deItem["Total Entries Today"]) || 0;

                 if (existing) {
                    existing.shajra += shajra;
                    existing.ownership += ownership;
                    existing.khasra += khasra;
                    existing.possession += possession;
                    existing.total += total;
                } else {
                    aggregatedData.set(fullName, { fullName, shajra, ownership, khasra, possession, total });
                }
            }
        }
    }
    return Array.from(aggregatedData.values()).sort((a, b) => b.total - a.total);
  }, [toast]);

  useEffect(() => {
    setMutationJsonInputs([defaultMutationJsonString]);
    setMutationFileNames(["Using default sample data"]);
    setDataEntryJsonInputs([defaultDataEntryJsonString]);
    setDataEntryFileNames(["Using default sample data"]);
    try {
        const initialMutationData = processJsonData<RawMutationProgressData, ProcessedMutationProgressItem>([defaultMutationJsonString], 'mutation');
        setMutationReportData(initialMutationData);
        setIsMutationReportReady(true);
        const initialDataEntryData = processJsonData<RawDataEntryItem, ProcessedDataEntryItem>([defaultDataEntryJsonString], 'data-entry');
        setDataEntryReportData(initialDataEntryData);
        setIsDataEntryReportReady(true);
    } catch (error) {
        console.error("Failed to load default data", error);
    }
  }, [processJsonData]);

  const mutationSummary = useMemo(() => {
    if (!mutationReportData || mutationReportData.length === 0) {
        return { totalImplemented: 0, totalPending: 0, totalActivity: 0 };
    }
    return mutationReportData.reduce(
        (acc, item) => {
            acc.totalImplemented += item.implemented;
            acc.totalPending += item.pending;
            acc.totalActivity += item.total;
            return acc;
        },
        { totalImplemented: 0, totalPending: 0, totalActivity: 0 }
    );
  }, [mutationReportData]);
  
  const mutationDailyTarget = useMemo(() => (mutationReportData.length > 0 ? mutationReportData.length * 100 : 0), [mutationReportData]);
  const mutationTargetProgress = mutationDailyTarget > 0 ? Math.min((mutationSummary.totalActivity / mutationDailyTarget) * 100, 100) : 0;
  const mutationPieData = [{ name: 'Implemented', value: mutationSummary.totalImplemented }, { name: 'Pending', value: mutationSummary.totalPending }];
  const MUTATION_PIE_COLORS = ['hsl(142.1 76.2% 36.3%)', 'hsl(47.9 95.8% 53.1%)'];

  const dataEntrySummary = useMemo(() => {
    if (!dataEntryReportData || dataEntryReportData.length === 0) {
        return { totalShajra: 0, totalOwnership: 0, totalKhasra: 0, totalPossession: 0, totalActivity: 0, topContributor: { name: 'N/A', count: 0 } };
    }
    const totals = dataEntryReportData.reduce(
        (acc, item) => {
            acc.totalShajra += item.shajra;
            acc.totalOwnership += item.ownership;
            acc.totalKhasra += item.khasra;
            acc.totalPossession += item.possession;
            acc.totalActivity += item.total;
            return acc;
        },
        { totalShajra: 0, totalOwnership: 0, totalKhasra: 0, totalPossession: 0, totalActivity: 0 }
    );
    const topContributor = dataEntryReportData.reduce((top, current) => current.total > top.count ? { name: current.fullName, count: current.total } : top, { name: 'N/A', count: 0 });
    return { ...totals, topContributor };
  }, [dataEntryReportData]);
  
  const dataEntryPieData = [
      { name: 'Shajra', value: dataEntrySummary.totalShajra },
      { name: 'Ownership', value: dataEntrySummary.totalOwnership },
      { name: 'Khasra', value: dataEntrySummary.totalKhasra },
      { name: 'Possession', value: dataEntrySummary.totalPossession },
  ];
  const DATA_ENTRY_PIE_COLORS = Object.values(DATA_ENTRY_CHART_COLORS);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'mutation' | 'data-entry') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const invalidFiles = Array.from(files).filter(file => file.type !== 'application/json');
    if (invalidFiles.length > 0) {
      toast({ title: "Invalid File Type", description: "Please upload only valid JSON files (.json).", variant: "destructive" });
      if (type === 'mutation' && mutationFileInputRef.current) mutationFileInputRef.current.value = "";
      if (type === 'data-entry' && dataEntryFileInputRef.current) dataEntryFileInputRef.current.value = "";
      return;
    }

    const fileReadPromises = Array.from(files).map(file => 
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
      })
    );

    try {
      const contents = await Promise.all(fileReadPromises);
      const names = Array.from(files).map(f => f.name);

      if (type === 'mutation') {
        setMutationJsonInputs(contents);
        setMutationFileNames(names);
        setIsMutationReportReady(false);
      } else {
        setDataEntryJsonInputs(contents);
        setDataEntryFileNames(names);
        setIsDataEntryReportReady(false);
      }
      toast({
        title: `${files.length} File(s) Loaded`,
        description: `Click "Process Data" to aggregate and update the dashboard.`,
      });
    } catch (error) {
      toast({ title: "Error Reading Files", variant: "destructive" });
    }
  };
  
  const handleProcessJson = (type: 'mutation' | 'data-entry') => {
    try {
        if (type === 'mutation') {
            if (mutationJsonInputs.length === 0) throw new Error("Please paste or upload JSON data first.");
            const processedData = processJsonData<RawMutationProgressData, ProcessedMutationProgressItem>(mutationJsonInputs, 'mutation');
            setMutationReportData(processedData);
            setIsMutationReportReady(true);
            toast({ title: "Mutation Dashboard Updated", description: `Aggregated data from ${mutationJsonInputs.length} file(s).` });
        } else {
            if (dataEntryJsonInputs.length === 0) throw new Error("Please paste or upload JSON data first.");
            const processedData = processJsonData<RawDataEntryItem, ProcessedDataEntryItem>(dataEntryJsonInputs, 'data-entry');
            setDataEntryReportData(processedData);
            setIsDataEntryReportReady(true);
            toast({ title: "Data Entry Dashboard Updated", description: `Aggregated data from ${dataEntryJsonInputs.length} file(s).` });
        }
    } catch (error: any) {
        console.error(error);
        toast({ title: "Processing Failed", description: error.message || "Could not parse the input. Check format.", variant: "destructive" });
    }
  };

  const handleExportExcel = (type: 'mutation' | 'data-entry') => {
    if (type === 'mutation') {
        if (!mutationMauzaName.trim()) { toast({ title: "Mauza Required", description: "Please enter the Mauza Name for the report header.", variant: "destructive" }); return; }
        if (mutationReportData.length === 0) { toast({ title: "No Data", description: "There is no data to export.", variant: "destructive"}); return; }
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const excelData: (string|number)[][] = [
            [`AOS daily Mutation Progress Report (${mutationMauzaName})`], [`Date: ${today}`], [],
            ["Sr #", "Officer Name", "Pending (Active)", "Implemented (Approved)", "Total Activity"]
        ];
        mutationReportData.forEach((row, index) => excelData.push([(index + 1), row.fullName, row.pending, row.implemented, row.total]));
        excelData.push([]);
        excelData.push(["", "Total", mutationSummary.totalPending, mutationSummary.totalImplemented, mutationSummary.totalActivity]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });
        ws['!cols'] = [ { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 } ];
        XLSX.utils.book_append_sheet(wb, ws, "Progress Report");
        const excelFileName = `Progress_Report_${mutationMauzaName.replace(/\s+/g, '_')}_${today.replace(/\s/g, '_')}.xlsx`;
        XLSX.writeFile(wb, excelFileName);
        toast({ title: "Export Complete", description: `Downloaded ${excelFileName}` });
    } else { // data-entry
         if (!dataEntryMauzaName.trim()) { toast({ title: "Mauza Required", variant: "destructive" }); return; }
        if (dataEntryReportData.length === 0) { toast({ title: "No Data", variant: "destructive"}); return; }
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const excelData: (string|number)[][] = [
            [`AOS daily Data Entry Report (${dataEntryMauzaName})`], [`Date: ${today}`], [],
            ["Sr #", "Officer Name", "Shajra", "Ownership", "Khasra", "Possession", "Total Entries"]
        ];
        dataEntryReportData.forEach((row, index) => excelData.push([(index + 1), row.fullName, row.shajra, row.ownership, row.khasra, row.possession, row.total]));
        excelData.push([]);
        excelData.push(["", "Total", dataEntrySummary.totalShajra, dataEntrySummary.totalOwnership, dataEntrySummary.totalKhasra, dataEntrySummary.totalPossession, dataEntrySummary.totalActivity]);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } });
        ws['!cols'] = [ { wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 } ];
        XLSX.utils.book_append_sheet(wb, ws, "Data Entry Report");
        const excelFileName = `Data_Entry_Report_${dataEntryMauzaName.replace(/\s+/g, '_')}_${today.replace(/\s/g, '_')}.xlsx`;
        XLSX.writeFile(wb, excelFileName);
        toast({ title: "Export Complete", description: `Downloaded ${excelFileName}` });
    }
  };

  const handleClear = (type: 'mutation' | 'data-entry') => {
      if (type === 'mutation') {
        setMutationJsonInputs([defaultMutationJsonString]);
        setMutationFileNames(["Using default sample data"]);
        try {
            const initialData = processJsonData<RawMutationProgressData, ProcessedMutationProgressItem>([defaultMutationJsonString], 'mutation');
            setMutationReportData(initialData);
            setIsMutationReportReady(true);
        } catch (error) { setIsMutationReportReady(false); }
        setMutationMauzaName('Sample Mauza');
        if(mutationFileInputRef.current) mutationFileInputRef.current.value = "";
        toast({ title: 'Reset', description: 'Mutation report inputs and results have been reset to the default sample.' });
      } else {
        setDataEntryJsonInputs([defaultDataEntryJsonString]);
        setDataEntryFileNames(["Using default sample data"]);
        try {
            const initialData = processJsonData<RawDataEntryItem, ProcessedDataEntryItem>([defaultDataEntryJsonString], 'data-entry');
            setDataEntryReportData(initialData);
            setIsDataEntryReportReady(true);
        } catch (error) { setIsDataEntryReportReady(false); }
        setDataEntryMauzaName('Sample Mauza');
        if(dataEntryFileInputRef.current) dataEntryFileInputRef.current.value = "";
        toast({ title: 'Reset', description: 'Data entry report inputs and results have been reset to the default sample.' });
      }
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Daily Progress Reports
        </CardTitle>
        <CardDescription>
          Generate and visualize AOS-compliant Excel reports from raw JSON data for both mutation progress and general data entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="mutation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mutation">Mutation Progress</TabsTrigger>
            <TabsTrigger value="data-entry">Data Entry Report</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mutation" className="mt-6">
            <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-4">
                  <Label>1. JSON Data Source</Label>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => mutationFileInputRef.current?.click()}>
                        <UploadCloud className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{mutationFileNames.length > 1 ? `${mutationFileNames.length} files selected` : mutationFileNames[0] || 'Click to upload .json file(s)'}</span>
                    </Button>
                    <input id="mutation-file-input" type="file" multiple ref={mutationFileInputRef} accept=".json" onChange={(e) => handleFileChange(e, 'mutation')} className="hidden" />
                </div>
                <div className="space-y-2 md:col-span-4">
                    <Label>2. Mauza Name</Label>
                    <Input placeholder="e.g. Amar Sidhu" value={mutationMauzaName} onChange={(e) => setMutationMauzaName(e.target.value)} />
                </div>
                <div className="flex items-end gap-2 md:col-span-4">
                    <Button onClick={() => handleProcessJson('mutation')} className="flex-1" disabled={mutationJsonInputs.length === 0}>
                        <Play className="mr-2 h-4 w-4" /> Process
                    </Button>
                    <Button onClick={() => handleExportExcel('mutation')} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!isMutationReportReady || mutationReportData.length === 0}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleClear('mutation')} title="Reset to Sample">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {isMutationReportReady && mutationReportData.length > 0 && (
              <div className="space-y-6 pt-4 border-t border-dashed mt-6">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Activity</CardTitle><BarChart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{mutationSummary.totalActivity.toLocaleString()}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Implemented</CardTitle><CheckCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{mutationSummary.totalImplemented.toLocaleString()}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{mutationSummary.totalPending.toLocaleString()}</div></CardContent></Card>
                      <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Daily Target Reached</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{Math.round(mutationTargetProgress)}%</div><p className="text-xs text-muted-foreground">{mutationSummary.totalActivity.toLocaleString()} of {mutationDailyTarget.toLocaleString()}</p></CardContent></Card>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">User Performance</CardTitle></CardHeader><CardContent className="pl-2 h-[250px]"><ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={mutationReportData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.3}/><XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /><YAxis dataKey="fullName" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'hsla(var(--accent) / 0.2)' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}/><Legend wrapperStyle={{fontSize: "12px"}}/><Bar dataKey="implemented" name="Implemented" stackId="a" fill="hsl(142.1 76.2% 36.3%)" radius={[0, 4, 4, 0]}/><Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(47.9 95.8% 53.1%)" radius={[4, 0, 0, 4]} /></RechartsBarChart></ResponsiveContainer></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-base">Overall Ratio</CardTitle></CardHeader><CardContent className="h-[250px] flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Tooltip cursor={{ fill: 'hsla(var(--accent) / 0.2)' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px', borderRadius: 'var(--radius)', }}/><Pie data={mutationPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} stroke="hsl(var(--background))" strokeWidth={2}>{mutationPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MUTATION_PIE_COLORS[index % MUTATION_PIE_COLORS.length]} />))}</Pie><Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }}/></RechartsPieChart></ResponsiveContainer></CardContent></Card>
                  </div>
                  <div className="pt-4"><h3 className="text-lg font-semibold mb-2">Detailed Report</h3><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="w-[50px]">#</TableHead><TableHead>Officer Name</TableHead><TableHead className="text-right">Pending</TableHead><TableHead className="text-right font-bold text-green-600">Implemented</TableHead><TableHead className="text-right">Total Activity</TableHead></TableRow></TableHeader><TableBody>{mutationReportData.map((row, i) => (<TableRow key={i}><TableCell className="font-medium">{i + 1}</TableCell><TableCell>{row.fullName}</TableCell><TableCell className="text-right text-muted-foreground">{row.pending}</TableCell><TableCell className="text-right font-bold bg-green-50/50 dark:bg-green-900/20">{row.implemented}</TableCell><TableCell className="text-right">{row.total}</TableCell></TableRow>))}</TableBody><TableFooter><TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2} className="text-right">Total</TableCell><TableCell className="text-right">{mutationSummary.totalPending}</TableCell><TableCell className="text-right">{mutationSummary.totalImplemented}</TableCell><TableCell className="text-right">{mutationSummary.totalActivity}</TableCell></TableRow></TableFooter></Table></div></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data-entry" className="mt-6">
            <div className="grid gap-4 md:grid-cols-12">
              <div className="space-y-2 md:col-span-4">
                <Label>1. JSON Data Source</Label>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => dataEntryFileInputRef.current?.click()}>
                      <UploadCloud className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{dataEntryFileNames.length > 1 ? `${dataEntryFileNames.length} files selected` : dataEntryFileNames[0] || 'Click to upload .json file(s)'}</span>
                  </Button>
                  <input id="data-entry-file-input" type="file" multiple ref={dataEntryFileInputRef} accept=".json" onChange={(e) => handleFileChange(e, 'data-entry')} className="hidden" />
              </div>
              <div className="space-y-2 md:col-span-4">
                  <Label>2. Mauza Name</Label>
                  <Input placeholder="e.g. Dolo Khurd" value={dataEntryMauzaName} onChange={(e) => setDataEntryMauzaName(e.target.value)} />
              </div>
              <div className="flex items-end gap-2 md:col-span-4">
                  <Button onClick={() => handleProcessJson('data-entry')} className="flex-1" disabled={dataEntryJsonInputs.length === 0}>
                      <Play className="mr-2 h-4 w-4" /> Process
                  </Button>
                  <Button onClick={() => handleExportExcel('data-entry')} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!isDataEntryReportReady || dataEntryReportData.length === 0}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleClear('data-entry')} title="Reset to Sample">
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
            </div>
            {isDataEntryReportReady && dataEntryReportData.length > 0 && (
                <div className="space-y-6 pt-4 border-t border-dashed mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Entries</CardTitle><BarChart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dataEntrySummary.totalActivity.toLocaleString()}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Top Contributor</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-lg font-bold truncate">{dataEntrySummary.topContributor.name}</div><p className="text-xs text-muted-foreground">{dataEntrySummary.topContributor.count.toLocaleString()} entries</p></CardContent></Card>
                        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm font-medium">Work Distribution</CardTitle></CardHeader><CardContent className="h-[60px] flex items-center"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Tooltip cursor={{ fill: 'hsla(var(--accent) / 0.2)' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}/><Pie data={dataEntryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={30}>{dataEntryPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={DATA_ENTRY_PIE_COLORS[index % DATA_ENTRY_PIE_COLORS.length]} />))}</Pie><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} layout="vertical" align="right" verticalAlign="middle" /></RechartsPieChart></ResponsiveContainer></CardContent></Card>
                    </div>

                    <Card><CardHeader><CardTitle className="text-base">User Data Entry Breakdown</CardTitle></CardHeader><CardContent className="pl-2 h-[300px]"><ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={dataEntryReportData} layout="vertical" margin={{top: 5, right: 20, left: 60, bottom: 5}}><CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.3}/><XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} /><YAxis dataKey="fullName" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px' }} cursor={{fill: 'hsla(var(--accent) / 0.2)'}}/><Legend wrapperStyle={{fontSize: "12px"}}/><Bar dataKey="shajra" name="Shajra" stackId="a" fill={DATA_ENTRY_CHART_COLORS.shajra} /><Bar dataKey="ownership" name="Ownership" stackId="a" fill={DATA_ENTRY_CHART_COLORS.ownership} /><Bar dataKey="khasra" name="Khasra" stackId="a" fill={DATA_ENTRY_CHART_COLORS.khasra} /><Bar dataKey="possession" name="Possession" stackId="a" fill={DATA_ENTRY_CHART_COLORS.possession} /></RechartsBarChart></ResponsiveContainer></CardContent></Card>
                    
                    <div className="pt-4"><h3 className="text-lg font-semibold mb-2">Detailed Data Entry Report</h3><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead className="w-[50px]">#</TableHead><TableHead>Officer Name</TableHead><TableHead className="text-right">Shajra</TableHead><TableHead className="text-right">Ownership</TableHead><TableHead className="text-right">Khasra</TableHead><TableHead className="text-right">Possession</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{dataEntryReportData.map((row, i) => (<TableRow key={i}><TableCell className="font-medium">{i + 1}</TableCell><TableCell>{row.fullName}</TableCell><TableCell className="text-right">{row.shajra}</TableCell><TableCell className="text-right">{row.ownership}</TableCell><TableCell className="text-right">{row.khasra}</TableCell><TableCell className="text-right">{row.possession}</TableCell><TableCell className="text-right font-bold">{row.total}</TableCell></TableRow>))}</TableBody><TableFooter><TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2} className="text-right">Total</TableCell><TableCell className="text-right">{dataEntrySummary.totalShajra}</TableCell><TableCell className="text-right">{dataEntrySummary.totalOwnership}</TableCell><TableCell className="text-right">{dataEntrySummary.totalKhasra}</TableCell><TableCell className="text-right">{dataEntrySummary.totalPossession}</TableCell><TableCell className="text-right">{dataEntrySummary.totalActivity}</TableCell></TableRow></TableFooter></Table></div></div>
                </div>
            )}

          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

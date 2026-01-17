"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Play, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Textarea } from '../ui/textarea';

// --- TYPE DEFINITIONS ---
type RawProgressData = {
  "User Name": string;
  "Full Name": string;
  "Implemented Today": number;
  "Pending (Active Today)": number;
  "Total Activity Today": number;
};

type ProcessedReportItem = {
  fullName: string;
  pending: number;
  total: number;
  implemented: number;
};

// --- DEFAULT SAMPLE DATA ---
const defaultRawData: RawProgressData[] = [
  { "User Name": "...", "Full Name": "لائبہ ارشاد ریاض", "Implemented Today": 0, "Pending (Active Today)": 1, "Total Activity Today": 2 },
  { "User Name": "...", "Full Name": "صنائیلہ سعید سعید احمد", "Implemented Today": 0, "Pending (Active Today)": 9, "Total Activity Today": 33 },
  { "User Name": "...", "Full Name": "عمیر حسین محمد سلیم", "Implemented Today": 0, "Pending (Active Today)": 14, "Total Activity Today": 44 },
  { "User Name": "...", "Full Name": "شکیل غلام مصطفی", "Implemented Today": 0, "Pending (Active Today)": 11, "Total Activity Today": 55 },
  { "User Name": "...", "Full Name": "اسامہ صداقت", "Implemented Today": 0, "Pending (Active Today)": 18, "Total Activity Today": 35 },
  { "User Name": "...", "Full Name": "نیناں جان جان محمد", "Implemented Today": 0, "Pending (Active Today)": 11, "Total Activity Today": 57 },
  { "User Name": "...", "Full Name": "محمد جنید بیگ محمد شرافت بیگ", "Implemented Today": 0, "Pending (Active Today)": 0, "Total Activity Today": 7 },
  { "User Name": "...", "Full Name": "روحیل طارق محمد طارق", "Implemented Today": 0, "Pending (Active Today)": 15, "Total Activity Today": 59 },
  { "User Name": "...", "Full Name": "صلیحہ طارق محمد طارق", "Implemented Today": 0, "Pending (Active Today)": 6, "Total Activity Today": 21 },
  { "User Name": "...", "Full Name": "الساء امجد محمد امجد", "Implemented Today": 0, "Pending (Active Today)": 6, "Total Activity Today": 51 },
  { "User Name": "...", "Full Name": "علی محمود محمود احمد ", "Implemented Today": 0, "Pending (Active Today)": 23, "Total Activity Today": 69 },
  { "User Name": "...", "Full Name": "ایاز حیدر سجاد حیدر", "Implemented Today": 0, "Pending (Active Today)": 18, "Total Activity Today": 71 },
  { "User Name": "...", "Full Name": "لبنی لیاقت علی", "Implemented Today": 0, "Pending (Active Today)": 19, "Total Activity Today": 58 }
];
const defaultJsonString = JSON.stringify(defaultRawData, null, 2);

// --- HELPER FUNCTION to process data ---
const processJsonData = (jsonData: string): ProcessedReportItem[] => {
    if (!jsonData.trim()) return [];
    const rawData: RawProgressData[] = JSON.parse(jsonData);
    if (!Array.isArray(rawData)) throw new Error("Input must be a JSON array.");
    const processed: ProcessedReportItem[] = rawData.map(item => {
        const total = Number(item["Total Activity Today"]) || 0;
        const pending = Number(item["Pending (Active Today)"]) || 0;
        const implemented = total - pending;
        return {
            fullName: item["Full Name"] || "Unknown",
            pending: pending,
            total: total,
            implemented: implemented < 0 ? 0 : implemented
        };
    });
    return processed.sort((a, b) => b.total - a.total);
};


export function DailyProgressTab() {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [mauzaName, setMauzaName] = useState('Sample Mauza');
  const [reportData, setReportData] = useState<ProcessedReportItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load default data on initial mount
  useEffect(() => {
    setJsonInput(defaultJsonString);
    setFileName("Default Sample Data");
    try {
        const initialData = processJsonData(defaultJsonString);
        setReportData(initialData);
        setIsReady(true);
    } catch (error) {
        console.error("Failed to load default data", error);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({ title: "Invalid File Type", description: "Please upload a valid JSON file (.json).", variant: "destructive" });
      if(fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      setFileName(file.name);
      setIsReady(false); // New data is loaded, but not yet processed
      setReportData([]); // Clear old report data
      toast({
            title: "File Loaded",
            description: `Data from "${file.name}" is ready. Click "Process Data" to update the table.`,
      });
    };
    reader.onerror = () => {
      toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
    };
    reader.readAsText(file);
  };
  
  const handleProcessJson = () => {
    if (!jsonInput.trim()) {
      toast({ title: "Empty Input", description: "Please paste or upload JSON data first.", variant: "destructive" });
      return;
    }

    try {
      const processedData = processJsonData(jsonInput);
      setReportData(processedData);
      setIsReady(true);
      toast({ title: "Data Processed", description: `Loaded ${processedData.length} user records.` });

    } catch (error) {
      console.error(error);
      toast({ title: "Invalid JSON", description: "Could not parse the input. Check format.", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    if (!mauzaName.trim()) {
      toast({ title: "Mauza Required", description: "Please enter the Mauza Name for the report header.", variant: "destructive" });
      return;
    }
    if (reportData.length === 0) {
        toast({ title: "No Data", description: "There is no data to export. Process some data first.", variant: "destructive"});
        return;
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const excelData = [
      [`AOS daily Mutation Progress Report (${mauzaName})`],
      [`Date: ${today}`],
      [],
      ["Sr #", "Officer Name", "Pending (Active)", "Implemented (Approved)", "Total Activity"]
    ];

    reportData.forEach((row, index) => {
      excelData.push([
        (index + 1).toString(),
        row.fullName,
        row.pending.toString(),
        row.implemented.toString(),
        row.total.toString()
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    if(!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });

    ws['!cols'] = [ { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 } ];
    XLSX.utils.book_append_sheet(wb, ws, "Progress Report");

    const excelFileName = `Progress_Report_${mauzaName.replace(/\s+/g, '_')}_${today.replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(wb, excelFileName);

    toast({ title: "Export Complete", description: `Downloaded ${excelFileName}` });
  };

  const handleClear = () => {
    setJsonInput('');
    setReportData([]);
    setIsReady(false);
    setMauzaName('');
    setFileName(null);
     if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    toast({ title: 'Cleared', description: 'All inputs and results have been cleared.' });
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          Daily Progress Report Generator
        </CardTitle>
        <CardDescription>
          Generate AOS-compliant Excel reports from raw JSON data. The dashboard loads with sample data for demonstration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
            <Label>1. JSON Data</Label>
             <div className="relative">
                <Textarea 
                placeholder='[ { "User Name": "...", "Full Name": "Ali...", ... } ]'
                className="h-32 font-mono text-[10px] pr-28"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                />
                <Button variant="outline" className="absolute top-2 right-2 h-8 px-3 text-xs" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
                <input id="json-file-input" type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
            </div>
             <p className="text-xs text-muted-foreground pt-1">
                {fileName ? `Current file: ${fileName}` : "Upload a file or paste content above."}
            </p>
          </div>
          
          <div className="space-y-4 flex flex-col justify-end">
             <div className="space-y-2">
                <Label>2. Mauza Name (For Report Header)</Label>
                <Input placeholder="e.g. Amar Sidhu" value={mauzaName} onChange={(e) => setMauzaName(e.target.value)} />
             </div>
             
             <div className="flex gap-2">
                 <Button onClick={handleProcessJson} className="flex-1" disabled={!jsonInput}>
                    <Play className="mr-2 h-4 w-4" /> Process Data
                </Button>
                 <Button onClick={handleExportExcel} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!isReady || reportData.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
                </Button>
                <Button variant="outline" onClick={handleClear} title="Clear All">
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </div>

        {isReady && reportData.length > 0 && (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Officer Name</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                            <TableHead className="text-right font-bold text-green-600">Implemented</TableHead>
                            <TableHead className="text-right">Total Activity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((row, i) => (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{i + 1}</TableCell>
                                <TableCell>{row.fullName}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{row.pending}</TableCell>
                                <TableCell className="text-right font-bold bg-green-50/50 dark:bg-green-900/20">{row.implemented}</TableCell>
                                <TableCell className="text-right">{row.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
        {(!isReady || reportData.length === 0) && (
            <div className="flex items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/40 text-sm text-muted-foreground">
                <p>Data preview will appear here after processing. Upload a file or paste JSON to get started.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

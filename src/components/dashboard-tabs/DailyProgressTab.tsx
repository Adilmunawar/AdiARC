"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Play, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Define the shape of your input JSON
type RawProgressData = {
  "User Name": string;
  "Full Name": string;
  "Implemented Today": number;
  "Pending (Active Today)": number;
  "Total Activity Today": number;
};

// Define the shape of the processed data for the report
type ProcessedReportItem = {
  fullName: string;
  pending: number;
  total: number;
  implemented: number; // Calculated: Total - Pending
};

export function DailyProgressTab() {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [mauzaName, setMauzaName] = useState('');
  const [reportData, setReportData] = useState<ProcessedReportItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  const handleProcessJson = () => {
    if (!jsonInput.trim()) {
      toast({ title: "Empty Input", description: "Please paste the JSON data first.", variant: "destructive" });
      return;
    }

    try {
      const rawData: RawProgressData[] = JSON.parse(jsonInput);
      
      if (!Array.isArray(rawData)) throw new Error("Input must be a JSON array.");

      const processed: ProcessedReportItem[] = rawData.map(item => {
        // Validation to ensure data integrity
        const total = Number(item["Total Activity Today"]) || 0;
        const pending = Number(item["Pending (Active Today)"]) || 0;
        
        // Your logic: Implemented = Total - Pending
        // Note: The JSON 'Implemented Today' field is ignored as per your request
        const implemented = total - pending;

        return {
          fullName: item["Full Name"] || "Unknown",
          pending: pending,
          total: total,
          implemented: implemented < 0 ? 0 : implemented // Prevent negative numbers if bad data
        };
      });

      // Filter out empty rows if needed, or sort
      const sortedData = processed.sort((a, b) => b.total - a.total); // Sort by highest activity

      setReportData(sortedData);
      setIsReady(true);
      toast({ title: "Data Processed", description: `Loaded ${sortedData.length} user records.` });

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

    // 1. Prepare Data for Excel
    // We create a custom array of arrays to control the exact layout
    const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    const excelData = [
      [`AOS daily Mutation Progress Report (${mauzaName})`], // Row 1: Main Title
      [`Date: ${today}`],                                   // Row 2: Date
      [],                                                   // Row 3: Blank
      ["Sr #", "Officer Name", "Pending (Active)", "Implemented (Approved)", "Total Activity"] // Row 4: Headers
    ];

    // Add Data Rows
    reportData.forEach((row, index) => {
      excelData.push([
        (index + 1).toString(), // Sr #
        row.fullName,
        row.pending.toString(),
        row.implemented.toString(),
        row.total.toString()
      ]);
    });

    // 2. Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 3. Optional: Basic styling logic (Merging the title)
    if(!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }); // Merge Title across 5 columns
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }); // Merge Date across 5 columns

    // 4. Set Column Widths (Approximate)
    ws['!cols'] = [
      { wch: 6 },  // Sr #
      { wch: 30 }, // Name
      { wch: 15 }, // Pending
      { wch: 20 }, // Implemented
      { wch: 15 }  // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Progress Report");

    // 5. Download File
    const fileName = `Progress_Report_${mauzaName}_${today.replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({ title: "Export Complete", description: `Downloaded ${fileName}` });
  };

  const handleClear = () => {
    setJsonInput('');
    setReportData([]);
    setIsReady(false);
    setMauzaName('');
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          Daily Progress Report Generator
        </CardTitle>
        <CardDescription>
          Generate AOS-compliant Excel reports from raw JSON data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* INPUT SECTION */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Paste JSON Data</Label>
            <Textarea 
              placeholder='[ { "User Name": "...", "Full Name": "Ali...", ... } ]'
              className="h-48 font-mono text-[10px]"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
          </div>
          
          <div className="space-y-4 flex flex-col justify-end">
             <div className="space-y-2">
                <Label>Mauza Name (For Report Header)</Label>
                <Input 
                    placeholder="e.g. Amar Sidhu" 
                    value={mauzaName} 
                    onChange={(e) => setMauzaName(e.target.value)} 
                />
             </div>
             
             <div className="flex gap-2">
                <Button onClick={handleProcessJson} className="flex-1" disabled={!jsonInput}>
                    <Play className="mr-2 h-4 w-4" /> Process Data
                </Button>
                <Button variant="outline" onClick={handleClear} disabled={!jsonInput && !isReady}>
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>

             {isReady && (
                 <Button variant="secondary" onClick={handleExportExcel} className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel Report
                 </Button>
             )}
          </div>
        </div>

        {/* LIVE PREVIEW TABLE */}
        {isReady && (
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
                                <TableCell className="text-right font-bold bg-green-50/50">{row.implemented}</TableCell>
                                <TableCell className="text-right">{row.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

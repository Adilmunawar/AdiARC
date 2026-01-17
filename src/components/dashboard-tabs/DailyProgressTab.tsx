
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Play, Trash2, Upload, Target, CheckCircle, Clock, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, RadialBarChart, RadialBar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PolarAngleAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setJsonInput(defaultJsonString);
    setFileName("Upload Json source");
    try {
        const initialData = processJsonData(defaultJsonString);
        setReportData(initialData);
        setIsReady(true);
    } catch (error) {
        console.error("Failed to load default data", error);
    }
  }, []);

  const summary = useMemo(() => {
    if (!reportData || reportData.length === 0) {
        return { totalImplemented: 0, totalPending: 0, totalActivity: 0 };
    }
    return reportData.reduce(
        (acc, item) => {
            acc.totalImplemented += item.implemented;
            acc.totalPending += item.pending;
            acc.totalActivity += item.total;
            return acc;
        },
        { totalImplemented: 0, totalPending: 0, totalActivity: 0 }
    );
  }, [reportData]);
  
  const dailyTarget = useMemo(() => (reportData.length > 0 ? reportData.length * 100 : 100), [reportData]);

  const targetProgress = dailyTarget > 0 ? Math.min((summary.totalActivity / dailyTarget) * 100, 100) : 0;
  const overallProgressData = [
      { name: 'Pending', value: summary.totalPending, fill: 'hsl(48, 96%, 58%)' }, // yellow-500
      { name: 'Implemented', value: summary.totalImplemented, fill: 'hsl(142, 71%, 45%)' }, // green-600
  ];
  const targetProgressData = [{ name: 'Target', value: summary.totalActivity, fill: 'hsl(var(--primary))' }];

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
      setIsReady(false);
      setReportData([]);
      toast({
            title: "File Loaded",
            description: `Data from "${file.name}" is ready. Click "Process Data" to update the dashboard.`,
      });
    };
    reader.onerror = () => toast({ title: "Error Reading File", variant: "destructive" });
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
      toast({ title: "Dashboard Updated", description: `Loaded ${processedData.length} user records.` });
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
    const excelData: (string|number)[][] = [
      [`AOS daily Mutation Progress Report (${mauzaName})`],
      [`Date: ${today}`],
      [],
      ["Sr #", "Officer Name", "Pending (Active)", "Implemented (Approved)", "Total Activity"]
    ];
    reportData.forEach((row, index) => {
      excelData.push([(index + 1), row.fullName, row.pending, row.implemented, row.total]);
    });
    excelData.push([]);
    excelData.push(["", "Total", summary.totalPending, summary.totalImplemented, summary.totalActivity]);

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
    setJsonInput(defaultJsonString);
    setFileName("Upload Json source");
    try {
        const initialData = processJsonData(defaultJsonString);
        setReportData(initialData);
        setIsReady(true);
    } catch (error) {
        setReportData([]);
        setIsReady(false);
    }
    setMauzaName('Sample Mauza');
     if(fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: 'Reset', description: 'Inputs and results have been reset to the default sample.' });
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Daily Progress Report Dashboard
        </CardTitle>
        <CardDescription>
          Generate and visualize AOS-compliant Excel reports from raw JSON data. The dashboard loads with sample data for demonstration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
           <div className="space-y-2">
            <Label>1. JSON Data Source</Label>
              <Button variant="outline" className="w-full justify-start text-left font-normal" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{fileName || "Click to upload a .json file"}</span>
              </Button>
              <input id="json-file-input" type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
          </div>
          <div className="space-y-2">
              <Label>2. Mauza Name (For Report Header)</Label>
              <Input placeholder="e.g. Amar Sidhu" value={mauzaName} onChange={(e) => setMauzaName(e.target.value)} />
           </div>
           <div className="flex items-end gap-2">
               <Button onClick={handleProcessJson} className="flex-1" disabled={!jsonInput}>
                  <Play className="mr-2 h-4 w-4" /> Process Data
              </Button>
               <Button onClick={handleExportExcel} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!isReady || reportData.length === 0}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={handleClear} title="Reset to Sample">
                  <Trash2 className="h-4 w-4" />
              </Button>
           </div>
        </div>

        {isReady && reportData.length > 0 && (
          <div className="space-y-6 pt-4 border-t border-dashed">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent><div className="text-2xl font-bold">{summary.totalActivity}</div></CardContent>
                  </Card>
                   <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Implemented</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent><div className="text-2xl font-bold">{summary.totalImplemented}</div></CardContent>
                  </Card>
                   <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending</CardTitle>
                          <Clock className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent><div className="text-2xl font-bold">{summary.totalPending}</div></CardContent>
                  </Card>
                   <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Daily Target</CardTitle>
                         <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{Math.round(targetProgress)}%</div>
                          <p className="text-xs text-muted-foreground">
                            {summary.totalActivity.toLocaleString()} of {dailyTarget.toLocaleString()}
                          </p>
                      </CardContent>
                  </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                      <CardHeader><CardTitle className="text-base">User Performance</CardTitle></CardHeader>
                      <CardContent className="pl-2 h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={reportData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis dataKey="fullName" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip cursor={{ fill: 'hsla(var(--accent) / 0.2)' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}/>
                                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                                  <Bar dataKey="implemented" name="Implemented" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]}/>
                                  <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(48, 96%, 58%)" radius={[4, 0, 0, 4]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </CardContent>
                  </Card>
                  <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
                      <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-base">Overall Ratio</CardTitle></CardHeader>
                          <CardContent className="flex items-center justify-center h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                  <RadialBarChart innerRadius="60%" outerRadius="85%" data={overallProgressData} startAngle={90} endAngle={-270}>
                                      <PolarAngleAxis type="number" domain={[0, summary.totalActivity]} angleAxisId={0} tick={false} />
                                      <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0} />
                                      <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
                                       <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                                          {summary.totalActivity}
                                      </text>
                                       <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                                          Total
                                      </text>
                                  </RadialBarChart>
                              </ResponsiveContainer>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader className="pb-2"><CardTitle className="text-base">Target Reached</CardTitle></CardHeader>
                           <CardContent className="flex items-center justify-center h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                  <RadialBarChart innerRadius="60%" outerRadius="85%" data={targetProgressData} startAngle={90} endAngle={-270} barSize={10}>
                                      <PolarAngleAxis type="number" domain={[0, dailyTarget]} angleAxisId={0} tick={false} />
                                      <RadialBar background dataKey="value" cornerRadius={10} angleAxisId={0}/>
                                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className={cn("fill-foreground text-2xl font-bold", targetProgress >= 100 && 'fill-primary')}>
                                          {summary.totalActivity}
                                      </text>
                                       <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                                          / {dailyTarget} Target
                                      </text>
                                  </RadialBarChart>
                              </ResponsiveContainer>
                          </CardContent>
                      </Card>
                  </div>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-2">Detailed Report</h3>
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
                              <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={2} className="text-right">Total</TableCell>
                                    <TableCell className="text-right">{summary.totalPending}</TableCell>
                                    <TableCell className="text-right">{summary.totalImplemented}</TableCell>
                                    <TableCell className="text-right">{summary.totalActivity}</TableCell>
                                </TableRow>
                        </TableBody>
                    </Table>
                </div>
              </div>
          </div>
        )}
        {(!isReady || reportData.length === 0) && (
            <div className="flex items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/40 text-sm text-muted-foreground">
                <p>Dashboard visualizations will appear here after processing. Upload a file to get started.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileCode, Database, Search, Download, UploadCloud, Info, DatabaseBackup, Play, Upload, Terminal, Table as TableIcon, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '../ui/textarea';
import { toast as sonnerToast } from "sonner";


// For .bak Inspector
interface ScanResult {
    id: string | number;
    type: string;
    name: string;
    offset: number;
    preview: string;
    fullCode: string;
}

export function DatabaseEngineTab() {
  const { toast } = useToast();

  // === State from BakInspectorTab ===
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [filterText, setFilterText] = useState("");
  const bakWorkerRef = useRef<Worker | null>(null);
  const bakFileInputRef = useRef<HTMLInputElement | null>(null);

  // === State from SqlPlaygroundTab ===
  const [playgroundStatus, setPlaygroundStatus] = useState("Offline");
  const [tables, setTables] = useState<string[]>([]);
  const [query, setQuery] = useState("SELECT name FROM sqlite_master WHERE type='table';");
  const [queryResults, setQueryResults] = useState<{columns: string[], values: any[][]} | null>(null);
  const sqlWorkerRef = useRef<Worker | null>(null);
  const sqlFileInputRef = useRef<HTMLInputElement | null>(null);

  // === BAK Inspector Worker Logic ===
  useEffect(() => {
    bakWorkerRef.current = new Worker(new URL('../../workers/bak-scanner.worker.ts', import.meta.url));
    
    bakWorkerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'progress') {
        setScanProgress(payload.progress);
        setScanCount(payload.count);
      } else if (type === 'complete') {
        setScanResults(payload);
        setIsScanning(false);
        const diagnostic = payload.find((p: any) => p.id === 'DIAGNOSIS');
        if (diagnostic) {
            toast({ title: `Scan Complete!`, description: "A diagnostic report was generated.", variant: "default" });
            setSelectedResult(diagnostic);
        } else {
            toast({ title: `Scan Complete! Found ${payload.length -1} potential code objects.`});
            const firstCodeObject = payload.find((p:any) => p.id !== 'HEADER_ANALYSIS');
            if(firstCodeObject) setSelectedResult(firstCodeObject);
        }
      } else if (type === 'error') {
        setIsScanning(false);
        toast({ title: `Error: ${payload}`, variant: "destructive" });
      }
    };

    return () => bakWorkerRef.current?.terminate();
  }, [toast]);

  // === SQL Playground Worker Logic ===
   useEffect(() => {
    sqlWorkerRef.current = new Worker(new URL('../../workers/sql-engine.worker.ts', import.meta.url));
    
    sqlWorkerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'ready') {
        setPlaygroundStatus("Online (InMemory)");
        sonnerToast.success(payload);
      } else if (type === 'loaded') {
        setTables(payload);
        setPlaygroundStatus("Online (Restored)");
        sonnerToast.success(`Database Restored! ${payload.length} tables available.`);
      } else if (type === 'result') {
        setQueryResults(payload);
      } else if (type === 'error') {
        sonnerToast.error(`SQL Error: ${payload}`);
      }
    };

    sqlWorkerRef.current.postMessage({ type: 'init' });

    return () => sqlWorkerRef.current?.terminate();
  }, []);

  // === BAK Inspector Handlers ===
  const handleBakFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.bak')) {
      toast({ title: "Please select a valid .bak file", variant: "destructive" });
      return;
    }

    setScanResults([]);
    setSelectedResult(null);
    setFilterText("");
    setIsScanning(true);
    setScanProgress(0);
    setScanCount(0);

    bakWorkerRef.current?.postMessage({ file });
  };
  
  const downloadAll = () => {
    const codeObjects = scanResults.filter(r => r.id !== 'DIAGNOSIS' && r.id !== 'HEADER_ANALYSIS');
    if(codeObjects.length === 0) {
        toast({title: "No extractable code found to export", variant: "destructive"});
        return;
    }
    const element = document.createElement("a");
    const fileContent = codeObjects.map(r => `-- Object: ${r.name} (Type: ${r.type}, Offset: ${r.offset})\n${r.fullCode}\nGO\n\n`).join('');
    const file = new Blob([fileContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "recovered_source_code.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const filteredScanResults = useMemo(() => {
    const filter = filterText.toLowerCase();
    if (!filter) return scanResults;
    return scanResults.filter(r => 
        r.name.toLowerCase().includes(filter) ||
        r.type.toLowerCase().includes(filter)
    );
  }, [scanResults, filterText]);
  
  const diagnosticReport = scanResults.find(r => r.id === 'DIAGNOSIS');
  
  // === SQL Playground Handlers ===
  const handleSqlDumpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlaygroundStatus("Restoring...");
    setQueryResults(null);
    setTables([]);
    const text = await file.text();
    sqlWorkerRef.current?.postMessage({ type: 'load_dump', payload: text });
  };

  const runQuery = () => {
    if (!query.trim()) return;
    sqlWorkerRef.current?.postMessage({ type: 'query', payload: query });
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Database Engine
        </CardTitle>
        <CardDescription>
          Inspect raw `.bak` files for source code or run live SQL queries against a dump file in a virtual, in-browser database instance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inspector" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inspector">
              <DatabaseBackup className="mr-2 h-4 w-4" />
              SQL Recovery (.bak)
            </TabsTrigger>
            <TabsTrigger value="playground">
              <Activity className="mr-2 h-4 w-4" />
              SQL Playground
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspector" className="mt-6">
             <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Search className="h-4 w-4 text-primary" />
                    Scan Backup File
                  </CardTitle>
                  <CardDescription>
                    Forensically scan uncompressed SQL Server backup files (.bak) to extract stored procedures, views, and other code. It also diagnoses compressed backups.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <Button variant="outline" size="lg" onClick={() => bakFileInputRef.current?.click()} disabled={isScanning}>
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Select .bak file to inspect
                    </Button>
                    <input
                      ref={bakFileInputRef}
                      type="file"
                      accept=".bak"
                      onChange={handleBakFileChange}
                      className="hidden"
                    />
                    
                    {isScanning && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Scanning binary stream...</span>
                          <span>{scanProgress}% ({scanCount} objects found)</span>
                        </div>
                        <Progress value={scanProgress} className="w-full h-2" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
                <Card className="lg:col-span-1 flex flex-col">
                  <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Search className="mr-2 h-4 w-4" /> Found Objects
                        </CardTitle>
                        <CardDescription className="text-xs pt-1">
                            {filteredScanResults.length} of {scanResults.length} showing
                        </CardDescription>
                      </div>
                    <Button onClick={downloadAll} disabled={scanResults.filter(r => r.id !== 'DIAGNOSIS' && r.id !== 'HEADER_ANALYSIS').length === 0} variant="ghost" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Export SQL
                    </Button>
                  </CardHeader>
                  <div className="px-4 pb-3">
                      <Input
                          placeholder="Filter by name or type..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="h-9 text-xs"
                          disabled={scanResults.length === 0}
                      />
                  </div>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredScanResults.length > 0 ? filteredScanResults.map((item) => (
                              <TableRow
                                key={item.id}
                                onClick={() => setSelectedResult(item)}
                                className={cn("cursor-pointer", selectedResult?.id === item.id && "bg-muted")}
                              >
                                <TableCell>
                                    <Badge variant={item.id === 'DIAGNOSIS' ? 'destructive' : 'outline'} className="text-[10px] w-[5rem] text-center justify-center">
                                        {item.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs truncate">{item.name}</TableCell>
                              </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground text-sm">
                                        {isScanning ? "Scanning..." : "No objects found. Upload a file to begin."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileCode className="mr-2 h-4 w-4" /> Source Code Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 bg-background p-0 overflow-hidden rounded-b-lg">
                    {diagnosticReport && selectedResult?.id === 'DIAGNOSIS' && (
                        <div className="h-full p-4 bg-amber-500/10 text-amber-900 dark:text-amber-300 space-y-4">
                            <h3 className="font-bold flex items-center gap-2 text-base"><Info className="h-5 w-5"/> Diagnostic Report</h3>
                            <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
                                {diagnosticReport.fullCode}
                            </pre>
                        </div>
                    )}
                    {selectedResult && selectedResult.id !== 'DIAGNOSIS' && (
                        <ScrollArea className="h-full bg-muted/30 rounded-md p-2 border">
                            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                              {selectedResult.fullCode}
                            </pre>
                        </ScrollArea>
                    )}
                    {!selectedResult && !diagnosticReport && (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                          Select an object from the list to view its source code.
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="playground" className="mt-6">
            <div className="grid grid-cols-4 gap-6 h-[800px]">
              <Card className="col-span-1 flex flex-col bg-slate-50 dark:bg-slate-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Database className="mr-2 h-4 w-4" /> Virtual Instance
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`h-2 w-2 rounded-full ${playgroundStatus.includes('Online') ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <span className="text-xs text-muted-foreground">{playgroundStatus}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <div className="mb-4">
                    <label className="text-xs font-semibold mb-2 block">Restore from .sql dump</label>
                    <div className="relative">
                      <input type="file" accept=".sql,.txt" ref={sqlFileInputRef} onChange={handleSqlDumpUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Button variant="outline" size="sm" className="w-full" onClick={() => sqlFileInputRef.current?.click()}>
                        <Upload className="mr-2 h-3 w-3" /> Upload Dump File
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs font-semibold mb-2 text-muted-foreground">TABLES</div>
                  <ScrollArea className="h-[600px]">
                    {tables.length === 0 ? (
                      <div className="text-xs text-center text-slate-400 py-4">No tables found</div>
                    ) : (
                      tables.map(t => (
                        <div key={t} 
                          onClick={() => setQuery(`SELECT * FROM \`${t}\` LIMIT 10`)}
                          className="flex items-center gap-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                        >
                          <TableIcon className="h-3 w-3 text-blue-500" />
                          <span className="text-xs font-mono">{t}</span>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="col-span-3 flex flex-col gap-4">
                <Card className="flex-shrink-0">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Terminal className="mr-2 h-4 w-4" /> Query Editor
                    </CardTitle>
                    <Button size="sm" onClick={runQuery} className="bg-green-600 hover:bg-green-700">
                      <Play className="mr-2 h-3 w-3" /> Run
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="font-mono text-sm bg-slate-950 text-slate-100 min-h-[150px]"
                      placeholder="SELECT * FROM your_table..."
                    />
                  </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col overflow-hidden">
                  <CardHeader className="py-3 border-b bg-muted/50">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Results {queryResults && `(${queryResults.values.length} rows)`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-auto bg-white dark:bg-slate-950">
                    {!queryResults ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Run a query to see results
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {queryResults.columns.map((col, i) => (
                              <TableHead key={i} className="text-xs font-bold">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResults.values.map((row, i) => (
                            <TableRow key={i}>
                              {row.map((cell, j) => (
                                <TableCell key={j} className="text-xs font-mono whitespace-nowrap">
                                  {String(cell)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

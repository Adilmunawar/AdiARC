import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileCode, Database, Search, Download, UploadCloud, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface ScanResult {
    id: string | number;
    type: string;
    name: string;
    offset: number;
    preview: string;
    fullCode: string;
}

export function BakInspectorTab() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [filterText, setFilterText] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/bak-scanner.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'progress') {
        setProgress(payload.progress);
        setScanCount(payload.count);
      } else if (type === 'complete') {
        setResults(payload);
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

    return () => workerRef.current?.terminate();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.bak')) {
      toast({ title: "Please select a valid .bak file", variant: "destructive" });
      return;
    }

    setResults([]);
    setSelectedResult(null);
    setFilterText("");
    setIsScanning(true);
    setProgress(0);
    setScanCount(0);

    workerRef.current?.postMessage({ file });
  };

  const downloadAll = () => {
    const codeObjects = results.filter(r => r.id !== 'DIAGNOSIS' && r.id !== 'HEADER_ANALYSIS');
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
  
  const filteredResults = useMemo(() => {
    const filter = filterText.toLowerCase();
    if (!filter) return results;
    return results.filter(r => 
        r.name.toLowerCase().includes(filter) ||
        r.type.toLowerCase().includes(filter)
    );
  }, [results, filterText]);
  
  const diagnosticReport = results.find(r => r.id === 'DIAGNOSIS');

  return (
    <div className="space-y-6 animate-enter">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary"/> .BAK Inspector (No DB Required)</CardTitle>
          <CardDescription>
            Forensic scan of uncompressed SQL Server backup files to extract stored procedures, views, and other code directly in your browser. It also diagnoses compressed backups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" size="lg" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                <UploadCloud className="mr-2 h-5 w-5" />
                Select .bak file to inspect
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bak"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Scanning binary stream...</span>
                  <span>{progress}% ({scanCount} objects found)</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
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
                    {filteredResults.length} of {results.length} showing
                </CardDescription>
              </div>
             <Button onClick={downloadAll} disabled={results.filter(r => r.id !== 'DIAGNOSIS' && r.id !== 'HEADER_ANALYSIS').length === 0} variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export SQL
            </Button>
          </CardHeader>
           <div className="px-4 pb-3">
              <Input
                  placeholder="Filter by name or type..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="h-9 text-xs"
                  disabled={results.length === 0}
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
                    {filteredResults.length > 0 ? filteredResults.map((item) => (
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
              <Database className="mr-2 h-4 w-4" /> Source Code Preview
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
  );
}

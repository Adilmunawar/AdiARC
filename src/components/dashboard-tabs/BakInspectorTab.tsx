import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileCode, Database, Search, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

export function BakInspectorTab() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/bak-scanner.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'progress') {
        setProgress(payload.progress);
      } else if (type === 'complete') {
        setResults(payload);
        setIsScanning(false);
        toast({ title: `Scan Complete! Found ${payload.length} code objects.`});
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
    setSelectedCode(null);
    setIsScanning(true);
    setProgress(0);

    workerRef.current?.postMessage({ file });
  };

  const downloadAll = () => {
    if(results.length === 0) {
        toast({title: "No data to export", variant: "destructive"});
        return;
    }
    const element = document.createElement("a");
    const fileContent = results.map(r => `-- Object: ${r.type} (ID: ${r.id})\n${r.fullCode}\nGO\n\n`).join('');
    const file = new Blob([fileContent], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "recovered_source_code.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-enter">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5 text-primary"/> .BAK Inspector (No DB Required)</CardTitle>
          <CardDescription>
            Forensic scan of SQL Server backup files to extract stored procedures, views, and other code directly in your browser. This tool is ideal for serverless environments like Vercel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                <FileCode className="mr-2 h-4 w-4" />
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
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Scanning binary stream...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Search className="mr-2 h-4 w-4" /> Found Objects ({results.length})
            </CardTitle>
             <Button onClick={downloadAll} disabled={results.length === 0} variant="ghost" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export All
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[500px]">
              <div className="flex flex-col">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCode(item.fullCode)}
                    className={`text-left p-3 border-b text-sm hover:bg-muted transition-colors
                      ${selectedCode === item.fullCode ? 'bg-muted' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">Offset: {item.offset}</span>
                    </div>
                    <div className="font-mono text-xs truncate text-muted-foreground">
                      {item.preview.substring(0, 40)}...
                    </div>
                  </button>
                ))}
                {results.length === 0 && !isScanning && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No SQL objects found yet. <br/>Upload a file to start scanning.
                  </div>
                )}
                 {isScanning && results.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        Scanning...
                    </div>
                 )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="mr-2 h-4 w-4" /> Source Code Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 bg-background p-4 overflow-hidden rounded-b-lg border">
            <ScrollArea className="h-full bg-muted/30 rounded-md p-2">
              {selectedCode ? (
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                  {selectedCode}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select an object to view its source code
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

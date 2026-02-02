import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Play, Upload, Terminal, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";

export function SqlPlaygroundTab() {
  const [status, setStatus] = useState("Offline");
  const [tables, setTables] = useState<string[]>([]);
  const [query, setQuery] = useState("SELECT * FROM sqlite_master");
  const [results, setResults] = useState<{columns: string[], values: any[][]} | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Start the Engine
    workerRef.current = new Worker(new URL('../../workers/sql-engine.worker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'ready') {
        setStatus("Online (InMemory)");
        toast.success(payload);
      } else if (type === 'loaded') {
        setTables(payload);
        toast.success(`Database Restored! ${payload.length} tables available.`);
      } else if (type === 'result') {
        setResults(payload);
      } else if (type === 'error') {
        toast.error(`SQL Error: ${payload}`);
      }
    };

    // Init Engine
    workerRef.current.postMessage({ type: 'init' });

    return () => workerRef.current?.terminate();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Restoring...");
    const text = await file.text();
    workerRef.current?.postMessage({ type: 'load_dump', payload: text });
  };

  const runQuery = () => {
    if (!query.trim()) return;
    workerRef.current?.postMessage({ type: 'query', payload: query });
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-[800px]">
      {/* Sidebar: Database Explorer */}
      <Card className="col-span-1 flex flex-col bg-slate-50 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Database className="mr-2 h-4 w-4" /> Virtual Instance
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className={`h-2 w-2 rounded-full ${status.includes('Online') ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-xs text-muted-foreground">{status}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="mb-4">
            <label className="text-xs font-semibold mb-2 block">Restore Data Source (.sql)</label>
            <div className="relative">
              <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button variant="outline" size="sm" className="w-full">
                <Upload className="mr-2 h-3 w-3" /> Upload Dump
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
                  onClick={() => setQuery(`SELECT * FROM ${t} LIMIT 10`)}
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

      {/* Main: Query Editor & Results */}
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
              placeholder="SELECT * FROM table..."
            />
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="py-3 border-b bg-muted/50">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Results {results && `(${results.values.length} rows)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto bg-white dark:bg-slate-950">
            {!results ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Run a query to see results
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {results.columns.map((col, i) => (
                      <TableHead key={i} className="text-xs font-bold">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.values.map((row, i) => (
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
  );
}

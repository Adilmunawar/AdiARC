"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Play, Download, RefreshCw, BarChart2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MauzaResult = {
    name: string;
    stats: Record<string, number>;
    status: string;
};

export function MauzaTrackerTab() {
  const [csvInput, setCsvInput] = useState("Rawalpindi_Test,C:\\Records\\DIV Rawalpindi\nAdil_Test,C:\\Records\\Adil");
  const [results, setResults] = useState<MauzaResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    const lines = csvInput.split('\n').map(l => l.trim()).filter(l => l);
    const mauzas = lines.map(line => {
        // Simple comma split
        const parts = line.split(',');
        if (parts.length >= 2) {
            return { name: parts[0].trim(), path: parts.slice(1).join(',').trim() };
        }
        return null;
    }).filter(m => m !== null);

    if (mauzas.length === 0) {
        toast.error("Please enter at least one valid Mauza (Name, Path)");
        return;
    }

    setIsScanning(true);
    setResults([]);

    try {
        const res = await fetch('/api/scan-mauzas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mauzas })
        });
        
        const data = await res.json();
        if (data.success) {
            setResults(data.results);
            toast.success(`Successfully scanned ${data.results.length} targets!`);
        } else {
            toast.error(`Error: ${data.error}`);
        }
    } catch (err: any) {
        toast.error(`Failed to scan: ${err.message}`);
    } finally {
        setIsScanning(false);
    }
  };

  // Dynamically extract all unique categories across all scanned mauzas
  const categories = useMemo(() => {
      const cats = new Set<string>();
      results.forEach(r => {
          Object.keys(r.stats).forEach(k => cats.add(k));
      });
      // Sort standard categories first if possible, but alphabetical is fine
      return Array.from(cats).sort();
  }, [results]);

  const handleExportCSV = () => {
      if (results.length === 0) return;
      
      const header = ["Mauza Name", "Status", ...categories].join(",");
      const rows = results.map(r => {
          const row = [
              `"${r.name.replace(/"/g, '""')}"`,
              `"${r.status}"`
          ];
          categories.forEach(c => {
              row.push((r.stats[c] || 0).toString());
          });
          return row.join(",");
      });
      
      const csvContent = [header, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mauza_Live_Stats_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("CSV Exported successfully!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full gap-4 p-4 overflow-hidden select-none bg-background dark:bg-background">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary/20 pb-4 shrink-0">
         <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                 <BarChart2 className="w-6 h-6 text-primary" />
             </div>
             <div>
                 <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Live Mauza Tracker</h1>
                 <p className="text-xs text-muted-foreground font-semibold">Tally images and documents via deep smart discovery</p>
             </div>
         </div>
         <Button 
            onClick={handleExportCSV}
            disabled={results.length === 0}
            variant="outline" 
            className="border-primary/20 hover:border-primary/50 text-xs font-bold"
         >
            <Download className="w-4 h-4 mr-2 text-primary" /> Export CSV
         </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
          
          {/* Left Column: Input Form */}
          <div className="w-1/3 flex flex-col gap-3 min-h-0 shrink-0">
             <div className="bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl p-4 flex flex-col h-full gap-3 shadow-none overflow-hidden">
                 <h3 className="text-sm font-bold flex items-center gap-1.5 text-primary tracking-wide">
                     Bulk Path Configuration
                 </h3>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                     Paste your target directories here. Format must be exactly <strong className="text-foreground">Mauza Name, File Path</strong> on each new line.
                 </p>
                 
                 <Textarea 
                     value={csvInput}
                     onChange={(e) => setCsvInput(e.target.value)}
                     className="flex-1 resize-none font-mono text-[11px] leading-tight border-primary/20 bg-primary/5 p-3 rounded-xl focus-visible:ring-primary/30"
                     placeholder="e.g.&#10;Rawalpindi,C:\Records\Rawalpindi&#10;Islamabad,C:\Records\Islamabad"
                 />
                 
                 <Button 
                     onClick={handleScan}
                     disabled={isScanning}
                     className="w-full h-12 text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-none border border-primary/20 active:scale-[0.98] transition-all rounded-xl"
                 >
                     {isScanning ? (
                         <><RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" /> SCANNING DRIVE...</>
                     ) : (
                         <><Play className="w-4 h-4 mr-2 text-white" /> START TRACKING BATCH</>
                     )}
                 </Button>
             </div>
          </div>

          {/* Right Column: Statistics Table */}
          <div className="w-2/3 flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl shadow-none overflow-hidden">
             {results.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-3">
                     <BarChart2 className="w-12 h-12" />
                     <p className="text-sm font-bold">No data. Run a scan to see statistics.</p>
                 </div>
             ) : (
                 <div className="flex-1 overflow-auto rounded-2xl">
                     <Table>
                         <TableHeader className="bg-primary/5 sticky top-0 backdrop-blur-md z-10 border-b border-primary/20">
                             <TableRow className="hover:bg-transparent">
                                 <TableHead className="font-extrabold text-primary text-xs uppercase tracking-wider whitespace-nowrap">Mauza Name</TableHead>
                                 <TableHead className="font-extrabold text-primary text-xs uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                                 {categories.map(cat => (
                                     <TableHead key={cat} className="font-bold text-foreground text-xs text-right whitespace-nowrap">{cat}</TableHead>
                                 ))}
                                 <TableHead className="font-extrabold text-primary text-xs text-right uppercase tracking-wider whitespace-nowrap">Total</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {results.map((r, i) => {
                                 const total = Object.values(r.stats).reduce((sum, val) => sum + val, 0);
                                 return (
                                     <TableRow key={i} className="border-border/40 hover:bg-primary/5 transition-colors">
                                         <TableCell className="font-bold text-xs">{r.name}</TableCell>
                                         <TableCell>
                                            {r.status === 'Success' ? (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full w-fit">
                                                    <CheckCircle2 className="w-3 h-3" /> SUCCESS
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-full w-fit">
                                                    {r.status === 'Invalid Path' ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {r.status.toUpperCase()}
                                                </span>
                                            )}
                                         </TableCell>
                                         {categories.map(cat => (
                                             <TableCell key={cat} className="text-right text-xs text-muted-foreground font-mono">
                                                 {r.stats[cat] || 0}
                                             </TableCell>
                                         ))}
                                         <TableCell className="text-right font-black text-primary text-xs font-mono">
                                             {total.toLocaleString()}
                                         </TableCell>
                                     </TableRow>
                                 );
                             })}
                         </TableBody>
                     </Table>
                 </div>
             )}
          </div>

      </div>
    </div>
  );
}

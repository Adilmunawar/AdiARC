
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Loader2, Box, X, ChevronsUpDown, Download, Copy, Play, Pause } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHeader, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressRanges } from "@/lib/forensic-utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JSZip from "jszip";
import { cn } from "@/lib/utils";

export type InventoryItem = {
  id: string | null;
  file: string;
  folder: string;
  source: string;
  status: "valid" | "stripped" | "no-match";
  fileObject?: File; // This will only be present in the main thread's state
};

type SortKey = "id" | "file" | "status" | "folder";
type SortDirection = "asc" | "desc";

const AnimatedStat = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <p className="text-2xl font-semibold transition-all duration-300">{value.toLocaleString()}</p>;
};

export function InventoryTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [inventoryItems, setInventoryItems] = useLocalStorage<InventoryItem[]>("adiarc_inventory_items", []);
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; filename: string }>({
    current: 0,
    total: 0,
    filename: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryItem["status"] | "all">("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "id", direction: "asc" });

  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneProgress, setCloneProgress] = useState<number>(0);

  const startScan = (files: FileList) => {
    if (workerRef.current) workerRef.current.terminate();
    
    workerRef.current = new Worker(new URL("../../workers/inventory-scanner.worker.ts", import.meta.url));
    
    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      if (type === 'progress') {
        setScanProgress(payload);
      } else if (type === 'result') {
        setInventoryItems(prev => [...prev, payload]);
      } else if (type === 'complete') {
        setIsScanning(false);
        setScanProgress(prev => ({ ...prev, filename: "" }));
        toast({ title: "Scan Complete", description: `Processed ${payload.totalFiles} files.` });
      } else if (type === 'error') {
        toast({ variant: 'destructive', title: 'Scan Error', description: payload.message });
      }
    };
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
        toast({ variant: 'destructive', title: 'No Images Found', description: 'The selected folder contains no image files.' });
        return;
    }
    
    setInventoryItems([]);
    setIsScanning(true);
    setScanProgress({ current: 0, total: imageFiles.length, filename: "" });
    workerRef.current.postMessage({ type: 'start', files: imageFiles });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) startScan(event.target.files);
  };
  
  const stopScan = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsScanning(false);
      toast({ title: 'Scan Stopped', description: 'The inventory scan has been canceled.' });
    }
  };

  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handleCopy = async (label: string, value: string) => {
    if (!value) {
      toast({ title: `Nothing to copy for ${label}`, variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(value);
    toast({ title: `${label} copied` });
  };

  const folders = Array.from(new Set(inventoryItems.map(item => item.folder))).sort();

  const filteredAndSortedItems = React.useMemo(() => {
    const filtered = inventoryItems.filter(item => {
      const searchLower = search.toLowerCase();
      return (
        (statusFilter === "all" || item.status === statusFilter) &&
        (folderFilter === "all" || item.folder === folderFilter) &&
        (!search ||
          (item.id && item.id.toLowerCase().includes(searchLower)) ||
          item.file.toLowerCase().includes(searchLower) ||
          item.source.toLowerCase().includes(searchLower))
      );
    });

    return filtered.sort((a, b) => {
      const aVal = a[sort.key] || "";
      const bVal = b[sort.key] || "";
      if (sort.direction === "asc") {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });
  }, [inventoryItems, search, statusFilter, folderFilter, sort]);
  
  const handleSort = (key: SortKey) => {
    setSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  
  const handleCloneMatchedImages = async () => {
    const validItems = inventoryItems.filter(i => i.status === "valid" && i.fileObject);
    if (validItems.length === 0) {
      toast({
        title: "No clonable images found",
        description: "Please perform a scan in this session to make image files available for cloning.",
        variant: "destructive"
      });
      return;
    }

    setIsCloning(true);
    setCloneProgress(0);
    
    try {
        const zip = new JSZip();
        for (const item of validItems) {
            if (item.fileObject) {
                const path = item.folder === '(root)' ? item.file : `${item.folder}/${item.file}`;
                zip.file(path, item.fileObject);
            }
        }
        
        const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
            setCloneProgress(metadata.percent);
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cloned_mutations_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        toast({ title: "Cloning Failed", description: "Could not generate the ZIP file.", variant: "destructive" });
    } finally {
        setIsCloning(false);
    }
  };

  return (
    <>
      <Dialog open={isCloning}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Cloning Images</DialogTitle>
                  <DialogDescription>Please wait while the images are being packaged into a ZIP file.</DialogDescription>
              </DialogHeader>
              <Progress value={cloneProgress} />
              <p className="text-center text-sm text-muted-foreground">{Math.round(cloneProgress)}%</p>
          </DialogContent>
      </Dialog>
      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Box className="h-5 w-5 text-primary" />
            XMP Mutation Inventory
          </CardTitle>
          <CardDescription>
            Forensic scan of a local folder to inventory all mutation IDs embedded in XMP metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-[11px]">
            <div className="space-y-1 max-w-md">
              <p className="font-medium">Scan a folder of mutation images</p>
              <p className="text-muted-foreground">AdiARC will inspect XMP metadata for the official LRMIS DocumentNo field and build a clean inventory of mutation numbers.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="h-10 px-4 text-xs">
                <Loader2 className={cn("mr-2 h-3.5 w-3.5", isScanning ? "animate-spin" : "hidden")} />
                {isScanning ? "Scanning..." : "Select Folder to Scan"}
              </Button>
              {isScanning && <Button type="button" variant="destructive" size="sm" onClick={stopScan}><Pause className="h-4 w-4 mr-2"/>Stop</Button>}
            </div>
            <input ref={fileInputRef} type="file" multiple webkitdirectory="" directory="" className="hidden" onChange={handleFileChange} />
          </div>

          {(scanProgress.total > 0 || isScanning) && (
            <div className="space-y-2 rounded-md border border-border bg-card/70 px-3 py-2 text-xs">
                <Progress value={(scanProgress.current / scanProgress.total) * 100} className="h-1.5" />
                <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                    <span>{scanProgress.current.toLocaleString()} / {scanProgress.total.toLocaleString()} files scanned</span>
                    <span className="truncate max-w-xs">{scanProgress.filename}</span>
                </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <Card className="border-border/70 bg-card/80"><CardHeader className="pb-2"><CardTitle className="text-sm">Found IDs</CardTitle><CardDescription>Files with a valid DocumentNo.</CardDescription></CardHeader><CardContent><AnimatedStat value={inventoryItems.filter(i => i.status === "valid").length} /></CardContent></Card>
            <Card className="border-border/70 bg-card/80"><CardHeader className="pb-2"><CardTitle className="text-sm">No Tag Found</CardTitle><CardDescription>Files with metadata but no DocumentNo.</CardDescription></CardHeader><CardContent><AnimatedStat value={inventoryItems.filter(i => i.status === "no-match").length} /></CardContent></Card>
            <Card className="border-border/70 bg-card/80"><CardHeader className="pb-2"><CardTitle className="text-sm">Stripped Files</CardTitle><CardDescription>Files with missing or minimal metadata.</CardDescription></CardHeader><CardContent><AnimatedStat value={inventoryItems.filter(i => i.status === "stripped").length} /></CardContent></Card>
          </div>

          <div className="space-y-3">
             <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-semibold">Inventory Results</p>
                    <p className="text-xs text-muted-foreground">{filteredAndSortedItems.length.toLocaleString()} files showing</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 text-xs w-48"/>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="h-9 text-xs w-32"><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="valid">Valid</SelectItem><SelectItem value="no-match">No Tag</SelectItem><SelectItem value="stripped">Stripped</SelectItem></SelectContent>
                    </Select>
                    <Select value={folderFilter} onValueChange={setFolderFilter}>
                        <SelectTrigger className="h-9 text-xs w-40"><SelectValue placeholder="All Folders"/></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Folders</SelectItem>{folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setFolderFilter('all'); }}><X className="h-4 w-4 mr-1"/>Clear</Button>
                </div>
            </div>
            
            <div className="rounded-md border border-border bg-card/70">
                <ScrollArea className="h-80 w-full rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-28 cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>Status <ChevronsUpDown className="inline h-3 w-3 ml-1"/> </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('id')}>Mutation ID <ChevronsUpDown className="inline h-3 w-3 ml-1"/></TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('folder')}>Folder <ChevronsUpDown className="inline h-3 w-3 ml-1"/></TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('file')}>File Name <ChevronsUpDown className="inline h-3 w-3 ml-1"/></TableHead>
                                <TableHead>Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedItems.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No items to display. Start a scan or adjust filters.</TableCell></TableRow>
                            ) : (
                                filteredAndSortedItems.map((item, index) => (
                                    <TableRow key={`${item.file}-${index}`} className="text-xs">
                                        <TableCell><Badge variant={item.status === 'valid' ? 'outline' : item.status === 'stripped' ? 'destructive' : 'secondary'}>{item.status}</Badge></TableCell>
                                        <TableCell className="font-medium">{item.id || "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.folder}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.file}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.source}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy('Compressed IDs', compressRanges(filteredAndSortedItems.map(i => Number(i.id)).filter(Boolean)))}><Copy className="h-3 w-3 mr-2"/>Copy Compressed IDs</Button>
                <Button variant="outline" size="sm" onClick={() => handleCloneMatchedImages()} disabled={isCloning}><Download className="h-3 w-3 mr-2"/>Clone Valid Images to ZIP</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}


"use client";

import { useRef, useState, useEffect } from "react";
import type React from "react";
import { Copy, Download, Loader2, Pause, Play, ToggleLeft, ToggleRight } from "lucide-react";
import JSZip from "jszip";
import ExifReader from "exifreader";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHeader, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { compressRanges, extractMutationNumber } from "@/lib/forensic-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InventoryItem = {
  id: string | null;
  file: string;
  folder: string;
  source: string;
  status: "valid" | "stripped" | "no-match";
  fileObject?: File;
};

type InventoryFilterPreset = {
  id: string;
  name: string;
  search: string;
  status: "all" | "valid" | "no-match" | "stripped";
  folder: string;
  idMin: string;
  idMax: string;
};

interface InventoryTabProps {
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export function InventoryTab({ setInventoryItems: setAppInventoryItems }: InventoryTabProps) {
  const { toast } = useToast();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [presets, setPresets] = useState<InventoryFilterPreset[]>([]);
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanQueueRef = useRef<File[]>([]);
  const currentScanIndexRef = useRef<number>(0);
  const isScanningRef = useRef<boolean>(false);

  // UI state (not persisted)
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<"all" | "valid" | "no-match" | "stripped">("all");
  const [inventoryFolderFilter, setInventoryFolderFilter] = useState<string>("all");
  const [inventoryIdMin, setInventoryIdMin] = useState<string>("");
  const [inventoryIdMax, setInventoryIdMax] = useState<string>("");
  const [inventorySortBy, setInventorySortBy] = useState<"id" | "file" | "status" | "folder">("id");
  const [inventorySortDir, setInventorySortDir] = useState<"asc" | "desc">("asc");
  const [activeInventoryPresetId, setActiveInventoryPresetId] = useState<string | null>(null);
  const [selectedMutationId, setSelectedMutationId] = useState<string | null>(null);
  const [missingListInput, setMissingListInput] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<{
    matched: string[];
    stillMissing: string[];
  } | null>(null);
  const [showCompressedMatched, setShowCompressedMatched] = useState<boolean>(true);
  const [showCompressedStillMissing, setShowCompressedStillMissing] = useState<boolean>(true);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneProgress, setCloneProgress] = useState<number>(0);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState<boolean>(false);

  const handleCopy = async (label: string, value: string) => {
    if (!value || value === "None") {
      toast({
        title: `Nothing to copy for ${label}`,
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadList = (filename: string, list: (string|number)[]) => {
    if (!list || list.length === 0) {
        toast({ title: "No data to download.", variant: 'destructive' });
        return;
    }
    const content = list.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download started", description: `Saved as ${filename}` });
  };


  const handleCopyGoldenKeyIds = async (goldenKeySummary: { id: string; count: number; files: string[] }[]) => {
    if (!goldenKeySummary.length) {
      toast({
        title: "No IDs to copy",
        description: "Run an inventory scan first to extract XMP:DocumentNo mutation numbers.",
      });
      return;
    }

    const text = goldenKeySummary.map((row) => row.id).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied mutation IDs",
        description: `${goldenKeySummary.length} XMP:DocumentNo IDs copied to clipboard.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Your browser blocked clipboard access. Please copy manually.",
      });
    }
  };

  const handleCompareMissingWithGolden = (goldenKeySummary: { id: string; count: number; files: string[] }[]) => {
    if (!missingListInput.trim()) {
      toast({
        title: "Add missing numbers first",
        description: "Paste or type the list of missing mutation numbers you want to verify.",
      });
      return;
    }

    if (!goldenKeySummary.length) {
      toast({
        title: "No XMP numbers available",
        description: "Run an inventory scan to extract XMP:DocumentNo mutation numbers first.",
      });
      return;
    }

    const rawTokens = missingListInput
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const expandedTokens: string[] = [];
    rawTokens.forEach((token) => {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
          for (let n = start; n <= end; n++) {
            expandedTokens.push(String(n));
          }
        }
      } else {
        expandedTokens.push(token);
      }
    });

    const uniqueInput = Array.from(new Set(expandedTokens));
    const goldenIds = new Set(goldenKeySummary.map((row) => row.id));

    const matched: string[] = [];
    const stillMissing: string[] = [];

    uniqueInput.forEach((id) => {
      if (goldenIds.has(id)) {
        matched.push(id);
      } else {
        stillMissing.push(id);
      }
    });

    setComparisonResult({ matched, stillMissing });

    toast({
      title: "Comparison complete",
      description: `${matched.length} numbers found in XMP:DocumentNo, ${stillMissing.length} still missing.`,
    });
  };

  const finishScan = () => {
    isScanningRef.current = false;
    setIsScanning(false);
    toast({ title: "Scan complete", description: "Finished scanning all files." });
    setScanProgress({ current: scanQueueRef.current.length, total: scanQueueRef.current.length });
  }

  const processScanChunk = async () => {
    if (!isScanningRef.current) return;

    const chunkSize = 50;
    const chunk = scanQueueRef.current.slice(currentScanIndexRef.current, currentScanIndexRef.current + chunkSize);

    if (chunk.length === 0) {
      finishScan();
      return;
    }
    
    const processedChunk: InventoryItem[] = [];
    await Promise.all(
        chunk.map(async (file) => {
            try {
                const tags = await ExifReader.load(file, { expanded: true });
                const folder = (file as any).webkitRelativePath ? (file as any).webkitRelativePath.split("/").slice(0, -1).join("/") || "(root)" : "(unknown)";

                if (Object.keys(tags).length < 2 || (tags.file && Object.keys(tags.file).length < 2)) {
                    processedChunk.push({ id: null, file: file.name, folder, source: "Minimal Metadata", status: "stripped", fileObject: file });
                    return;
                }
                
                const findings = extractMutationNumber(tags);
                const goldenKeyFinding = findings.find(f => f.isGoldenKey);

                if (goldenKeyFinding) {
                    processedChunk.push({ id: goldenKeyFinding.number, file: file.name, folder, source: goldenKeyFinding.source, status: "valid", fileObject: file });
                } else {
                    processedChunk.push({ id: null, file: file.name, folder, source: "No XMP:DocumentNo", status: "no-match", fileObject: file });
                }
            } catch (err) {
                processedChunk.push({ id: null, file: file.name, folder: "(unknown)", source: "Read Error", status: "stripped", fileObject: file });
            }
        })
    );

    currentScanIndexRef.current += chunk.length;
    
    setInventoryItems(prev => [...prev, ...processedChunk]);
    setScanProgress({ current: currentScanIndexRef.current, total: scanQueueRef.current.length });
    
    // Schedule the next chunk
    setTimeout(processScanChunk, 0);
  };

  const handleStartScan = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    isScanningRef.current = true;
    setIsScanning(true);
    setInventoryItems([]);
    setSelectedMutationId(null);
    currentScanIndexRef.current = 0;

    scanQueueRef.current = Array.from(files).filter(
      (file) => file.type.startsWith("image/") || /\.(jpg|jpeg|png|tif|tiff)$/i.test(file.name)
    );
    
    setScanProgress({ current: 0, total: scanQueueRef.current.length });
    
    toast({ title: "Scan started", description: `Found ${scanQueueRef.current.length} images to process.` });
    processScanChunk();
  };

  const handleStopScan = () => {
    isScanningRef.current = false;
    setIsScanning(false);
    toast({title: "Scan stopped"});
  };

  const downloadBlob = (filename: string, mimeType: string, content: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadInventory = (format: "csv" | "json") => {
    const rows = filteredInventoryItems;
    if (!rows.length) {
      toast({
        title: "No inventory data",
        description: "Run a scan first or adjust your filters to include some rows.",
      });
      return;
    }

    if (format === "csv") {
      const header = "Mutation ID,File Name,Source Field,Status\n";
      const body = rows.map((item) => `${item.id ?? ""},${item.file},"${item.source}",${item.status}`).join("\n");
      downloadBlob("mutation_inventory.csv", "text/csv", header + body);
    } else {
      const json = JSON.stringify(rows.map(({ fileObject, ...rest }) => rest), null, 2);
      downloadBlob("mutation_inventory.json", "application/json", json);
    }

    toast({
      title: "Inventory export started",
      description: `Exported ${rows.length} rows from the current table view.`,
    });
  };

  const handleCloneMatchedImages = async () => {
    if (!comparisonResult) {
      toast({
        title: "No comparison data",
        description: "Paste your missing list and run a comparison first.",
      });
      return;
    }

    const { matched } = comparisonResult;
    if (!matched.length) {
      toast({
        title: "No matches to clone",
        description: "None of the missing IDs were found in the XMP list.",
      });
      return;
    }
    
    if (inventoryItems.length === 0) {
        toast({
            title: "Live session expired",
            description: "Please rescan the folder in this session to enable cloning. Cloned files are not stored between page reloads.",
            variant: "destructive"
        });
        return;
    }

    const matchedSet = new Set(matched);
    const filesToClone = inventoryItems.filter(
      (item) => item.status === "valid" && item.id && matchedSet.has(item.id) && item.fileObject,
    );

    if (!filesToClone.length) {
      toast({
        title: "No image files available for cloning",
        description: "The files matching your criteria were found in a previous session or this session hasn't started. Please rescan to enable cloning.",
      });
      return;
    }

    try {
      setIsCloning(true);
      setCloneProgress(0);
      setIsCloneDialogOpen(true);


      const zip = new JSZip();
      for (const item of filesToClone) {
        if (item.fileObject) {
          const folderLabel = item.folder === "(root)" ? "" : item.folder === "(unknown)" ? "unknown" : item.folder;
          const zipPath = folderLabel ? `${folderLabel}/${item.file}` : item.file;
          zip.file(zipPath, item.fileObject);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        if (typeof metadata.percent === "number") {
          setCloneProgress(metadata.percent);
        }
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cloned_mutations_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Clone download ready",
        description: `${filesToClone.length} images packaged into a ZIP file. Extract it and paste to your desired folder.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clone failed",
        description: "There was a problem preparing the ZIP file in your browser.",
      });
    } finally {
      setIsCloning(false);
      setIsCloneDialogOpen(false);
    }
  };

  const inventoryFolders = Array.from(new Set(inventoryItems.map((item) => item.folder))).sort();

  const filteredInventoryItems = (() => {
    const term = inventorySearch.trim().toLowerCase();
    const minId = inventoryIdMin ? Number(inventoryIdMin) : null;
    const maxId = inventoryIdMax ? Number(inventoryIdMax) : null;

    const base = inventoryItems.filter((item) => {
      const matchesStatus = inventoryStatusFilter === "all" || item.status === inventoryStatusFilter;
      const matchesFolder = inventoryFolderFilter === "all" || item.folder === inventoryFolderFilter;

      if (!matchesStatus || !matchesFolder) return false;

      const inId = (item.id || "").toLowerCase().includes(term);
      const inFile = item.file.toLowerCase().includes(term);
      const inSource = item.source.toLowerCase().includes(term);
      const textMatch = !term || inId || inFile || inSource;

      if (!textMatch) return false;

      if (minId !== null || maxId !== null) {
        const numericId = item.id ? Number(item.id) : NaN;
        if (!Number.isFinite(numericId)) return false;
        if (minId !== null && numericId < minId) return false;
        if (maxId !== null && numericId > maxId) return false;
      }

      return true;
    });

    const sorted = [...base].sort((a, b) => {
      const dir = inventorySortDir === "asc" ? 1 : -1;
      const getKey = (item: InventoryItem) => {
        switch (inventorySortBy) {
          case "file":
            return item.file.toLowerCase();
          case "status":
            return item.status;
          case "folder":
            return item.folder.toLowerCase();
          case "id":
          default:
            return (item.id || "").toLowerCase();
        }
      };
      const aKey = getKey(a);
      const bKey = getKey(b);
      if (aKey < bKey) return -1 * dir;
      if (aKey > bKey) return 1 * dir;
      return 0;
    });

    return sorted;
  })();

  const goldenKeySummary = (() => {
    const map = new Map<string, { count: number; files: string[] }>();

    for (const item of inventoryItems) {
      if (item.status === "valid" && item.id && item.source.includes("XMP:DocumentNo")) {
        const existing = map.get(item.id) || { count: 0, files: [] };
        if (!existing.files.includes(item.file)) {
          existing.files.push(item.file);
        }
        existing.count += 1;
        map.set(item.id, existing);
      }
    }

    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }));
  })();

  return (
    <>
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Preparing Your Files</DialogTitle>
            <DialogDescription>
                Please wait while we package the matched images into a ZIP file. This may take a moment for large collections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Progress value={cloneProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                    Zipping files... {Math.round(cloneProgress)}%
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="border-border/70 bg-card/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Mutation Inventory Dashboard</CardTitle>
          <CardDescription>
            Forensic scan of a local folder to inventory all mutation IDs embedded in XMP metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ACTION AREA */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-[11px]">
            <div className="space-y-1 max-w-md">
              <p className="font-medium">Scan a folder of mutation images</p>
              <p className="text-muted-foreground">
                AdiARC will inspect XMP metadata for the official LRMIS <code>DocumentNo</code> field and build a clean
                inventory of mutation numbers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold shadow-md shadow-primary/20"
              >
                {isScanning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isScanning ? "Scanning..." : "Select Folder to Scan"}</span>
              </Button>
               {isScanning && (
                <Button type="button" variant="destructive" size="sm" onClick={handleStopScan}>
                    Stop Scan
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              // @ts-ignore - non-standard folder selection attributes
              webkitdirectory=""
              // @ts-ignore
              directory=""
              className="hidden"
              onChange={handleStartScan}
            />
          </section>

          {/* PROGRESS BAR */}
          {(scanProgress.total > 0 || isScanning) && (
            <section className="space-y-2 rounded-md border border-border bg-card/70 px-3 py-2 text-[11px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-medium">Scan progress</p>
                  <p className="text-muted-foreground">
                    Progress: {Math.round((scanProgress.current / scanProgress.total) * 100)}% |{" "}
                    {scanProgress.current} / {scanProgress.total} files
                  </p>
                </div>
              </div>
              <Progress
                value={
                  scanProgress.total > 0
                    ? (Math.min(scanProgress.current, scanProgress.total) / scanProgress.total) * 100
                    : 0
                }
                className="h-1.5"
              />
            </section>
          )}

          {/* STATS CARDS */}
          <section className="grid gap-3 md:grid-cols-3 text-[11px]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Found IDs</CardTitle>
                <CardDescription>Total files with a valid DocumentNo value.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {inventoryItems.filter((item) => item.status === "valid").length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">No Tag Found</CardTitle>
                <CardDescription>Files where metadata exists but no DocumentNo was detected.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {inventoryItems.filter((item) => item.status === "no-match").length}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stripped Files</CardTitle>
                <CardDescription>Files with missing or minimal metadata (likely stripped).</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {inventoryItems.filter((item) => item.status === "stripped").length}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* DATA TABLE CONTROLS */}
          <section className="space-y-4 rounded-md border border-border/70 bg-card p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-shrink-0">
                    <h3 className="text-sm font-semibold">Inventory Results</h3>
                    {inventoryItems.length > 0 && <p className="text-xs text-muted-foreground">{filteredInventoryItems.length} of {inventoryItems.length} rows showing</p>}
                </div>
                <div className="flex flex-1 flex-col gap-3 min-w-0 md:pl-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <Input
                            placeholder="Search by ID, file name..."
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            className="h-9 text-xs sm:col-span-2 md:col-span-1"
                        />
                        <Select value={inventoryStatusFilter} onValueChange={(value) => setInventoryStatusFilter(value as "all" | "valid" | "no-match" | "stripped")}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="valid">Valid</SelectItem><SelectItem value="no-match">No Tag</SelectItem><SelectItem value="stripped">Stripped</SelectItem></SelectContent>
                        </Select>
                        <Select value={inventoryFolderFilter} onValueChange={(value) => setInventoryFolderFilter(value)}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Folder" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Folders</SelectItem>{inventoryFolders.map((folder) => (<SelectItem key={folder} value={folder}>{folder}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <Label htmlFor="inventory-id-min" className="text-xs">ID Range</Label>
                            <div className="flex items-center gap-2">
                                <Input id="inventory-id-min" type="number" placeholder="Min" value={inventoryIdMin} onChange={(e) => setInventoryIdMin(e.target.value)} className="h-9 text-xs" />
                                <span className="text-muted-foreground">-</span>
                                <Input id="inventory-id-max" type="number" placeholder="Max" value={inventoryIdMax} onChange={(e) => setInventoryIdMax(e.target.value)} className="h-9 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Sort By</Label>
                            <div className="flex items-center gap-2">
                                <Select value={inventorySortBy} onValueChange={(value) => setInventorySortBy(value as "id" | "file" | "status" | "folder")}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="id">ID</SelectItem><SelectItem value="file">File</SelectItem><SelectItem value="folder">Folder</SelectItem><SelectItem value="status">Status</SelectItem></SelectContent>
                                </Select>
                                <Select value={inventorySortDir} onValueChange={(value) => setInventorySortDir(value as "asc" | "desc")}>
                                    <SelectTrigger className="h-9 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="asc">Asc</SelectItem><SelectItem value="desc">Desc</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed">
                        <div className="flex items-center gap-2">
                            <Select value={activeInventoryPresetId ?? "__none__"} onValueChange={(value) => {
                                if (value === "__none__") {setActiveInventoryPresetId(null); return;}
                                const preset = presets.find((p) => p.id === value);
                                if (!preset) return;
                                setActiveInventoryPresetId(preset.id); setInventorySearch(preset.search); setInventoryStatusFilter(preset.status); setInventoryFolderFilter(preset.folder); setInventoryIdMin(preset.idMin); setInventoryIdMax(preset.idMax);
                            }}>
                                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Filter presets" /></SelectTrigger>
                                <SelectContent><SelectItem value="__none__">No preset</SelectItem>{presets.map((preset) => (<SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => {
                                const name = window.prompt("Preset name", "My filters");
                                if (!name) return;
                                const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
                                const preset: InventoryFilterPreset = { id, name, search: inventorySearch, status: inventoryStatusFilter, folder: inventoryFolderFilter, idMin: inventoryIdMin, idMax: inventoryIdMax };
                                setPresets(prev => [...prev, preset]);
                                setActiveInventoryPresetId(id);
                            }}>Save Preset</Button>
                        </div>
                         <Button type="button" variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => {
                            setInventorySearch(""); setInventoryStatusFilter("all"); setInventoryFolderFilter("all"); setInventoryIdMin(""); setInventoryIdMax(""); setActiveInventoryPresetId(null);
                        }}>Clear All Filters</Button>
                    </div>
                </div>
            </div>
          </section>

          <div className="rounded-md border border-border bg-card/70">
              <ScrollArea className="h-80 w-full rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead>Mutation ID</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>File name</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventoryItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground">
                          {inventoryItems.length === 0
                            ? "Select a folder above to begin building your mutation inventory."
                            : "No rows match your current filters. Try clearing the search or status filter."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventoryItems.map((item, index) => (
                        <TableRow
                          key={`${item.file}-${index}`}
                          className={
                            `cursor-pointer transition-all duration-150 ` +
                            (selectedMutationId && item.id === selectedMutationId
                              ? "bg-primary/10 border-l-4 border-primary/80 shadow-sm"
                              : "bg-background hover:bg-muted/60 hover:-translate-y-px hover:shadow-sm")
                          }
                          onClick={() => {
                            if (!item.id) return;
                            setSelectedMutationId((current) => (current === item.id ? null : item.id));
                          }}
                        >
                          <TableCell>
                            {item.status === "valid" && <Badge variant="outline">Valid</Badge>}
                            {item.status === "no-match" && <Badge variant="secondary">No Tag</Badge>}
                            {item.status === "stripped" && <Badge variant="destructive">Stripped</Badge>}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{item.id || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.folder}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.file}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{item.source}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          {/* GOLDEN KEY SUMMARY */}
          <section className="space-y-3 pt-4 border-t border-dashed border-border/70">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Official XMP:DocumentNo numbers</p>
                <p className="text-[11px] text-muted-foreground">
                  These are the mutation numbers extracted from the authoritative <code>DocumentNo</code> XMP tag.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyGoldenKeyIds(goldenKeySummary)}
                  disabled={goldenKeySummary.length === 0}
                >
                  Copy all IDs
                </Button>
                 <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadInventory("csv")}>
                  Download CSV
                </Button>
              </div>
            </div>
            {goldenKeySummary.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                No official <code>DocumentNo</code> tags detected yet. Run a scan above to see extracted IDs.
              </p>
            ) : (
              <div className="rounded-md border border-border bg-card/70">
                <ScrollArea className="h-40 w-full rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Mutation ID</TableHead>
                        <TableHead className="w-20 text-right">File count</TableHead>
                        <TableHead>Files</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goldenKeySummary.map((row) => (
                        <TableRow
                          key={row.id}
                          className={
                            `cursor-pointer transition-all duration-150 ` +
                            (selectedMutationId === row.id
                              ? "bg-primary/10 border-l-4 border-primary/80 shadow-sm"
                              : "bg-background hover:bg-muted/60 hover:-translate-y-px hover:shadow-sm")
                          }
                          onClick={() => setSelectedMutationId((current) => (current === row.id ? null : row.id))}
                        >
                          <TableCell className="text-sm font-medium">{row.id}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{row.count}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{row.files.join(", ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            {/* Missing list comparison */}
            <div className="space-y-4 rounded-md border border-dashed border-border bg-muted/20 p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium">Compare with your missing mutation list</p>
                    <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompareMissingWithGolden(goldenKeySummary)}
                        disabled={goldenKeySummary.length === 0 || isCloning}
                    >
                        Run comparison
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={handleCloneMatchedImages}
                        disabled={!comparisonResult || comparisonResult.matched.length === 0 || isCloning}
                    >
                        {isCloning ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Preparing ZIP...</span>
                        </span>
                        ) : "Clone Found Images" }
                    </Button>
                    </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                    Paste the mutation numbers you believe are missing to see which ones exist in the XMP list.
                </p>
                <Textarea
                    rows={3}
                    placeholder="e.g. 5501 5502 5503 7108 8001..."
                    value={missingListInput}
                    onChange={(e) => setMissingListInput(e.target.value)}
                    className="h-20 text-xs"
                />
              </div>

             <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-dashed text-xs">
                {/* Matched Column */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="matched-results" className="font-medium">
                            Found in XMP <span className="text-muted-foreground">({comparisonResult?.matched.length ?? 0})</span>
                        </Label>
                            <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCompressedMatched(p => !p)} title={showCompressedMatched ? "Show Full List" : "Show Compressed Ranges"}>
                                {showCompressedMatched ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy("Matched IDs", showCompressedMatched && comparisonResult ? compressRanges(comparisonResult.matched.map(Number)) : comparisonResult?.matched.join('\n') ?? '')} title="Copy">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadList('matched_in_xmp.txt', comparisonResult?.matched ?? [])} title="Download">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        id="matched-results"
                        readOnly
                        className="h-32 font-mono text-xs bg-green-500/10 border-green-500/30 focus-visible:ring-green-500/50"
                        value={comparisonResult?.matched?.length ?? 0 > 0
                            ? (showCompressedMatched ? compressRanges(comparisonResult!.matched.map(Number)) : comparisonResult!.matched.join('\n'))
                            : "None"
                        }
                    />
                </div>

                {/* Still Missing Column */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="still-missing-results" className="font-medium">
                            Still Missing <span className="text-muted-foreground">({comparisonResult?.stillMissing.length ?? 0})</span>
                        </Label>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCompressedStillMissing(p => !p)} title={showCompressedStillMissing ? "Show Full List" : "Show Compressed Ranges"}>
                                {showCompressedStillMissing ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy("Missing IDs", showCompressedStillMissing && comparisonResult ? compressRanges(comparisonResult.stillMissing.map(Number)) : comparisonResult?.stillMissing.join('\n') ?? '')} title="Copy">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadList('still_missing.txt', comparisonResult?.stillMissing ?? [])} title="Download">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        id="still-missing-results"
                        readOnly
                        className="h-32 font-mono text-xs bg-red-500/5 border-red-500/20 focus-visible:ring-red-500/50"
                        value={comparisonResult?.stillMissing?.length ?? 0 > 0
                            ? (showCompressedStillMissing ? compressRanges(comparisonResult!.stillMissing.map(Number)) : comparisonResult!.stillMissing.join('\n'))
                            : "None"
                        }
                    />
                </div>
            </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </>
  );
}

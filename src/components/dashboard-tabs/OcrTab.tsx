
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createWorker, Worker } from "tesseract.js";
import { Loader2, Search, SlidersHorizontal, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type OcrResult = {
  mutationNumber: string;
  fileName: string;
  confidence?: number;
};

export function OcrTab() {
  const { toast } = useToast();
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<{ current: number; total: number; currentFileName: string }>({
    current: 0,
    total: 0,
    currentFileName: "",
  });
  const ocrFolderInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isOcrScanningRef = useRef<boolean>(false);

  // Filtering state
  const [filterText, setFilterText] = useState("");
  const [minLength, setMinLength] = useState("4");
  const [maxLength, setMaxLength] = useState("6");
  const [minConfidence, setMinConfidence] = useState([60]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => undefined);
        workerRef.current = null;
      }
      isOcrScanningRef.current = false;
    };
  }, []);

  const handleOcrTriggerFolderSelect = () => {
    if (ocrFolderInputRef.current) {
      ocrFolderInputRef.current.value = "";
      ocrFolderInputRef.current.click();
    }
  };

  const handleOcrStop = async () => {
    if (!isOcrScanningRef.current) return;
    isOcrScanningRef.current = false;
    setIsOcrScanning(false);
    toast({
      title: "OCR scan stopping...",
      description: "Finishing current file before shutting down the OCR worker.",
    });

    try {
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  const handleOcrFolderSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      toast({
        title: "No image files detected",
        description: "This tool only scans image files for OCR.",
        variant: "destructive",
      });
      return;
    }

    setOcrResults([]);
    setIsOcrScanning(true);
    isOcrScanningRef.current = true;
    setOcrProgress({ current: 0, total: imageFiles.length, currentFileName: "" });

    toast({
      title: "Initializing OCR Engine...",
      description: "Loading Tesseract.js language data. This may take a moment.",
    });

    try {
      const worker = await createWorker("eng");
      workerRef.current = worker;

      const newResults: OcrResult[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (!isOcrScanningRef.current) break;

        setOcrProgress({ current: i + 1, total: imageFiles.length, currentFileName: file.name });
        
        try {
          const { data } = await worker.recognize(file);
          // Regex to find standalone numbers, allowing for some noise
          const numberMatches = data.text.match(/\b\d{3,8}\b/g) || [];
          
          if (numberMatches.length > 0) {
            const uniqueNumbers = [...new Set(numberMatches)];
            uniqueNumbers.forEach(num => {
                // Avoid adding duplicates from different files if the number is the same
                if (!newResults.some(r => r.mutationNumber === num)) {
                    newResults.push({
                      mutationNumber: num,
                      fileName: file.name,
                      confidence: data.confidence,
                    });
                }
            });
          }
        } catch (error) {
          console.error(`OCR failed for ${file.name}:`, error);
        }
        setOcrResults([...newResults]); // Update state incrementally
      }
    } catch (error) {
      console.error("Failed to initialize or run OCR worker", error);
      toast({
        title: "OCR Error",
        description: "Something went wrong during the OCR process. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsOcrScanning(false);
      isOcrScanningRef.current = false;
      toast({
          title: "OCR Scan Finished",
          description: `Processed ${ocrProgress.current} of ${ocrProgress.total} files.`
      });
    }
  };

  const filteredOcrResults = useMemo(() => {
    return ocrResults.filter((result) => {
      if (result.confidence != null && result.confidence < minConfidence[0]) {
        return false;
      }
      const numLength = result.mutationNumber.length;
      const min = parseInt(minLength, 10);
      const max = parseInt(maxLength, 10);
      if (!isNaN(min) && numLength < min) return false;
      if (!isNaN(max) && numLength > max) return false;
      if (filterText && !result.mutationNumber.includes(filterText) && !result.fileName.toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }
      return true;
    }).sort((a,b) => parseInt(a.mutationNumber) - parseInt(b.mutationNumber));
  }, [ocrResults, filterText, minLength, maxLength, minConfidence]);

    const handleDownloadResults = () => {
        if (filteredOcrResults.length === 0) {
            toast({ title: "No results to download", variant: "destructive" });
            return;
        }

        const csvHeader = "Mutation Number,File Name,Confidence\n";
        const csvRows = filteredOcrResults.map(r => `${r.mutationNumber},"${r.fileName}",${r.confidence?.toFixed(2) ?? ''}`);
        const csvContent = csvHeader + csvRows.join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "ocr_results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({title: "Results Downloaded", description: "The filtered OCR results have been saved as a CSV file."});
    };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Search className="h-5 w-5 text-primary" />
          Local OCR Detective
        </CardTitle>
        <CardDescription>
          This improved tool now uses a more specific regex to find standalone numbers (3-8 digits) to better isolate potential mutation IDs. Use the filters to narrow down the results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
          <p className="text-sm font-medium">Scan a local image folder with OCR</p>
          <p className="text-xs text-muted-foreground">
            The OCR engine runs entirely in your browser. It looks for numbers that are between 3 and 8 digits long to reduce noise from other data on the page.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleOcrTriggerFolderSelect}
                disabled={isOcrScanning}
                className="inline-flex items-center gap-2"
              >
                {isOcrScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>{isOcrScanning ? "Scanning..." : "Select Folder & Start OCR"}</span>
              </Button>
              {isOcrScanning && (
                <Button type="button" size="sm" variant="destructive" onClick={handleOcrStop}>
                  Stop Scan
                </Button>
              )}
            </div>
            {isOcrScanning && (
                <div className="flex-1 min-w-[200px] text-right">
                    <p className="text-xs text-muted-foreground truncate" title={ocrProgress.currentFileName}>{ocrProgress.currentFileName}</p>
                    <Progress
                        value={(ocrProgress.total > 0 ? (ocrProgress.current / ocrProgress.total) * 100 : 0)}
                        className="h-1.5 mt-1"
                    />
                </div>
            )}
          </div>
            <input
              ref={ocrFolderInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleOcrFolderSelected}
              // @ts-ignore
              webkitdirectory="" 
              directory=""
            />
        </section>
        
        <section className="space-y-3">
             <Collapsible>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                        Filter Controls ({filteredOcrResults.length} of {ocrResults.length} shown)
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4 animate-accordion-down">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="ocr-search-text" className="text-xs">Search number or file</Label>
                            <Input id="ocr-search-text" placeholder="e.g., 19403 or DSC..." value={filterText} onChange={e => setFilterText(e.target.value)} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="ocr-min-len" className="text-xs">Min Digits</Label>
                            <Input id="ocr-min-len" type="number" placeholder="e.g., 4" value={minLength} onChange={e => setMinLength(e.target.value)} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="ocr-max-len" className="text-xs">Max Digits</Label>
                            <Input id="ocr-max-len" type="number" placeholder="e.g., 6" value={maxLength} onChange={e => setMaxLength(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Min Confidence ({minConfidence[0]}%)</Label>
                            <Slider value={minConfidence} onValueChange={setMinConfidence} max={100} step={5} />
                        </div>
                    </div>
                </CollapsibleContent>
             </Collapsible>
        </section>

        <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">OCR Results</h3>
               <Button variant="outline" size="sm" onClick={handleDownloadResults} disabled={filteredOcrResults.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Results
                </Button>
            </div>
          <div className="rounded-md border border-border bg-card/70">
            <ScrollArea className="h-96 w-full rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mutation ID</TableHead>
                    <TableHead>Source File</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOcrResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs text-muted-foreground h-24">
                        {isOcrScanning ? "Scanning in progress..." : ocrResults.length > 0 ? "No results match your current filters." : "Run an OCR scan to see results here."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOcrResults.map((result) => (
                      <TableRow key={result.mutationNumber} className="bg-background">
                        <TableCell className="font-medium">{result.mutationNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{result.fileName}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {result.confidence != null ? `${result.confidence.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

    
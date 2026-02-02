
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createWorker, Worker, Word } from "tesseract.js";
import { Loader2, Search, SlidersHorizontal, Download, BrainCircuit, FolderSync, CheckCircle, XCircle } from "lucide-react";
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
import { extractMutationNumber } from "@/lib/forensic-utils";
import ExifReader from "exifreader";
import { cn } from "@/lib/utils";

type OcrResult = {
  mutationNumber: string;
  fileName: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  imageDims: { width: number; height: number };
  // Fields for training mode
  expectedNumber?: string | null;
  isMatch?: boolean;
};

type OcrTrainingProfile = {
  avgX: number;
  avgY: number;
  stdDevX: number;
  stdDevY: number;
  avgConfidence: number;
  commonLength: number;
  count: number;
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
  const [minId, setMinId] = useState("");
  const [maxId, setMaxId] = useState("");
  const [minConfidence, setMinConfidence] = useState([60]);
  const [xRange, setXRange] = useState([0, 100]);
  const [yRange, setYRange] = useState([0, 100]);
  
  // This state determines if we are in "Training" view mode
  const [isTrainingView, setIsTrainingView] = useState(false);


  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState({ current: 0, total: 0 });
  const [trainedProfile, setTrainedProfile] = useState<OcrTrainingProfile | null>(null);
  const trainingFolderInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => undefined);
        workerRef.current = null;
      }
      isOcrScanningRef.current = false;
    };
  }, []);

  const getImageDims = (file: File): Promise<{width: number, height: number}> => new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
    };
    img.onerror = (err) => {
        reject(err);
        URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });

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

    setIsTrainingView(false); // Switch to normal OCR view
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
      let i = 0;

      for (const file of imageFiles) {
        if (!isOcrScanningRef.current) break;
        setOcrProgress({ current: i + 1, total: imageFiles.length, currentFileName: file.name });
        
        try {
          const imageDims = await getImageDims(file);
          const { data } = await worker.recognize(file);
          const words: Word[] = [];
          if (data && (data as any).paragraphs) {
            for (const p of (data as any).paragraphs) {
                if (p && p.lines) {
                    for (const l of p.lines) {
                        if (l && l.words) {
                            words.push(...l.words);
                        }
                    }
                }
            }
          }

          const newResultsForFile: OcrResult[] = [];
          words.forEach(word => {
            const isStandaloneNumber = /^\d+$/.test(word.text);
            if (isStandaloneNumber) {
                newResultsForFile.push({
                    mutationNumber: word.text,
                    fileName: file.name,
                    confidence: word.confidence,
                    bbox: word.bbox,
                    imageDims: imageDims,
                });
            }
          });
          
          if (newResultsForFile.length > 0) {
              setOcrResults(prev => [...prev, ...newResultsForFile]);
          }

        } catch (error) {
          console.error(`OCR failed for ${file.name}:`, error);
        }
        i++;
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
          description: `Processed ${ocrProgress.current > ocrProgress.total ? ocrProgress.total : ocrProgress.current} of ${ocrProgress.total} files.`
      });
    }
  };

 const handleTrainingFolderSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      toast({ title: "No images found in the selected folder.", variant: "destructive" });
      return;
    }
    
    setIsTrainingView(true);
    setIsTraining(true);
    setOcrResults([]);
    setTrainedProfile(null);
    setTrainingProgress({ current: 0, total: imageFiles.length });
    toast({ title: "Starting Training Scan...", description: "Initializing OCR. This may take some time." });

    const worker = await createWorker("eng");
    const allTrainingResults: OcrResult[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setTrainingProgress({ current: i + 1, total: imageFiles.length });

      try {
        const exifTags = await ExifReader.load(file);
        const metadataFindings = extractMutationNumber(exifTags);
        const goldenKey = metadataFindings.find(f => f.isGoldenKey)?.number || null;

        const { data } = await worker.recognize(file);
        const words: Word[] = [];
        if (data && (data as any).paragraphs) {
            for (const p of (data as any).paragraphs) {
                if (p && p.lines) {
                    for (const l of p.lines) {
                        if (l && l.words) {
                           words.push(...l.words);
                        }
                    }
                }
            }
        }
        const { width, height } = await getImageDims(file);
        
        words.forEach(word => {
            const isStandaloneNumber = /^\d+$/.test(word.text);
            if (isStandaloneNumber) {
                allTrainingResults.push({
                    mutationNumber: word.text,
                    fileName: file.name,
                    confidence: word.confidence,
                    bbox: word.bbox,
                    imageDims: { width, height },
                    expectedNumber: goldenKey,
                    isMatch: goldenKey ? word.text.replace(/\D/g, "") === goldenKey : false,
                });
            }
        });

      } catch (error) {
        console.error(`Error during training on file ${file.name}:`, error);
      }
       if (i % 10 === 0) { // Update UI periodically
          setOcrResults([...allTrainingResults]);
          await new Promise(r => setTimeout(r, 0));
       }
    }

    await worker.terminate();
    setOcrResults(allTrainingResults); // Final update
    
    const successfulMatches = allTrainingResults.filter(r => r.isMatch);

    if (successfulMatches.length > 0) {
        const n = successfulMatches.length;

        const posData = successfulMatches.map(r => ({
            x: ((r.bbox.x0 + r.bbox.x1) / 2 / r.imageDims.width) * 100,
            y: ((r.bbox.y0 + r.bbox.y1) / 2 / r.imageDims.height) * 100,
        }));
        const sumX = posData.reduce((acc, p) => acc + p.x, 0);
        const sumY = posData.reduce((acc, p) => acc + p.y, 0);
        const avgX = sumX / n;
        const avgY = sumY / n;
        const sumSqDiffX = posData.reduce((acc, p) => acc + Math.pow(p.x - avgX, 2), 0);
        const sumSqDiffY = posData.reduce((acc, p) => acc + Math.pow(p.y - avgY, 2), 0);
        const stdDevX = Math.sqrt(sumSqDiffX / n);
        const stdDevY = Math.sqrt(sumSqDiffY / n);

        const sumConfidence = successfulMatches.reduce((acc, r) => acc + r.confidence, 0);
        const avgConfidence = sumConfidence / n;

        const lengths = successfulMatches.map(r => r.mutationNumber.length);
        const lengthCounts = lengths.reduce((acc, len) => {
            (acc as any)[len] = ((acc as any)[len] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        const commonLength = Object.keys(lengthCounts).length > 0 
            ? parseInt(Object.entries(lengthCounts).sort((a, b) => b[1] - a[1])[0][0])
            : 5;

        setTrainedProfile({ avgX, avgY, stdDevX, stdDevY, avgConfidence, commonLength, count: n });
        toast({ title: "Training Scan Complete", description: `A profile was generated from ${n} successfully matched images.` });
    } else {
      toast({ title: "Training Scan Complete", description: "No images with matching OCR and metadata were found. Review the table for OCR errors.", variant: "destructive" });
    }

    setIsTraining(false);
  };
  
  const applyTrainedProfile = () => {
    if (!trainedProfile) return;
    
    // Position (use 2x std dev for a wider, more inclusive net)
    const newXRange = [
      Math.max(0, Math.round(trainedProfile.avgX - 2 * trainedProfile.stdDevX)),
      Math.min(100, Math.round(trainedProfile.avgX + 2 * trainedProfile.stdDevX)),
    ];
    const newYRange = [
       Math.max(0, Math.round(trainedProfile.avgY - 2 * trainedProfile.stdDevY)),
       Math.min(100, Math.round(trainedProfile.avgY + 2 * trainedProfile.stdDevY)),
    ];
    setXRange(newXRange);
    setYRange(newYRange);
    
    // Confidence (set slightly below average to not be too restrictive)
    setMinConfidence([Math.max(0, Math.floor(trainedProfile.avgConfidence - 10))]); 
    
    toast({ title: "Filters Applied", description: "Positional and confidence filters updated based on training." });
  };


  const filteredOcrResults = useMemo(() => {
    const minIdNum = minId ? parseInt(minId, 10) : null;
    const maxIdNum = maxId ? parseInt(maxId, 10) : null;

    return ocrResults.filter((result) => {
      if (result.confidence != null && result.confidence < minConfidence[0]) {
        return false;
      }
      
      const numValue = parseInt(result.mutationNumber, 10);
      if (isNaN(numValue)) return false; 
      if (minIdNum !== null && numValue < minIdNum) return false;
      if (maxIdNum !== null && numValue > maxIdNum) return false;
      
      if (filterText && !result.mutationNumber.includes(filterText) && !result.fileName.toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }
      
      const bbox = result.bbox;
      const dims = result.imageDims;
      if (!bbox || !dims || dims.width === 0 || dims.height === 0) return true;

      const centerX = (bbox.x0 + bbox.x1) / 2;
      const centerY = (bbox.y0 + bbox.y1) / 2;

      const relativeX = (centerX / dims.width) * 100;
      const relativeY = (centerY / dims.height) * 100;

      const inXRange = relativeX >= xRange[0] && relativeX <= xRange[1];
      const inYRange = relativeY >= yRange[0] && relativeY <= yRange[1];

      return inXRange && inYRange;

    }).sort((a,b) => parseInt(a.mutationNumber) - parseInt(b.mutationNumber));
  }, [ocrResults, filterText, minId, maxId, minConfidence, xRange, yRange]);

    const handleDownloadResults = () => {
        if (filteredOcrResults.length === 0) {
            toast({ title: "No results to download", variant: "destructive" });
            return;
        }

        let csvHeader, csvRows;

        if (isTrainingView) {
            csvHeader = "Match,OCR'd Number,Expected (XMP),Confidence,File Name\n";
            csvRows = filteredOcrResults.map(r => `${r.isMatch ? 'YES' : 'NO'},${r.mutationNumber},${r.expectedNumber || ''},${r.confidence?.toFixed(2) ?? ''},"${r.fileName}"`);
        } else {
            csvHeader = "Mutation Number,File Name,Confidence\n";
            csvRows = filteredOcrResults.map(r => `${r.mutationNumber},"${r.fileName}",${r.confidence?.toFixed(2) ?? ''}`);
        }
        
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
          Use positional filtering and metadata-based training to guide the OCR engine and isolate specific numbers from dense documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
          <p className="text-sm font-medium">Scan a local image folder with OCR</p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleOcrTriggerFolderSelect}
                disabled={isOcrScanning || isTraining}
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
        
        <section className="space-y-3 rounded-md border border-dashed border-border bg-muted/40 p-3">
            <h3 className="text-sm font-medium flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary"/> Train Filters from Metadata (Optional)</h3>
            <p className="text-xs text-muted-foreground">Select a folder of images with reliable XMP metadata to teach the tool where mutation numbers are typically located and what they look like.</p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => trainingFolderInputRef.current?.click()} disabled={isTraining || isOcrScanning}>
                    <FolderSync className="mr-2 h-4 w-4"/>
                    {isTraining ? `Training... (${trainingProgress.current}/${trainingProgress.total})` : "Select Training Folder"}
                </Button>
                 <input ref={trainingFolderInputRef} type="file" multiple className="hidden" onChange={handleTrainingFolderSelected} webkitdirectory="" directory=""/>
                {trainedProfile && (
                     <Button size="sm" onClick={applyTrainedProfile} disabled={isTraining || isOcrScanning}>Apply Trained Filters</Button>
                )}
            </div>
            {isTraining && <Progress value={(trainingProgress.total > 0 ? (trainingProgress.current / trainingProgress.total) * 100 : 0)} className="h-1.5" />}
            {trainedProfile && (
                <p className="text-xs text-green-600">
                    Training complete! Profiled ${"n"}{trainedProfile.count} images. Avg Pos: (X: {trainedProfile.avgX.toFixed(0)}%, Y: {trainedProfile.avgY.toFixed(0)}%), Avg Conf: {trainedProfile.avgConfidence.toFixed(0)}%.
                </p>
            )}
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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="ocr-search-text" className="text-xs">Search number or file</Label>
                            <Input id="ocr-search-text" placeholder="e.g., 19403 or DSC..." value={filterText} onChange={e => setFilterText(e.target.value)} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="ocr-min-id" className="text-xs">Min Number Value</Label>
                            <Input id="ocr-min-id" type="number" placeholder="e.g., 5000" value={minId} onChange={e => setMinId(e.target.value)} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="ocr-max-id" className="text-xs">Max Number Value</Label>
                            <Input id="ocr-max-id" type="number" placeholder="e.g., 10000" value={maxId} onChange={e => setMaxId(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-6 md:grid-cols-2 pt-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Horizontal Region (X-Axis)</Label>
                             <Slider value={xRange} onValueChange={setXRange} max={100} step={1} />
                             <div className="flex justify-between text-[10px] text-muted-foreground"><span>{xRange[0]}%</span><span>{xRange[1]}%</span></div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Vertical Region (Y-Axis)</Label>
                            <Slider value={yRange} onValueChange={setYRange} max={100} step={1} />
                            <div className="flex justify-between text-[10px] text-muted-foreground"><span>{yRange[0]}%</span><span>{yRange[1]}%</span></div>
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <Label className="text-xs">Min Confidence ({minConfidence[0]}%)</Label>
                        <Slider value={minConfidence} onValueChange={setMinConfidence} max={100} step={5} />
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
                     {isTrainingView && <TableHead className="w-12">Match</TableHead>}
                    <TableHead>OCR'd Number</TableHead>
                    {isTrainingView && <TableHead>Expected (XMP)</TableHead>}
                    <TableHead>Source File</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOcrResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTrainingView ? 5 : 3} className="text-center text-xs text-muted-foreground h-24">
                        {isOcrScanning || isTraining ? "Scanning in progress..." : ocrResults.length > 0 ? "No results match your current filters." : "Run an OCR or Training scan to see results here."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOcrResults.map((result, index) => (
                      <TableRow key={`${result.mutationNumber}-${index}`} className={cn(isTrainingView && (result.isMatch ? "bg-green-500/10" : "bg-red-500/5"))}>
                        {isTrainingView && (
                           <TableCell>
                             {result.isMatch ? <CheckCircle className="h-4 w-4 text-green-600"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                           </TableCell>
                        )}
                        <TableCell className="font-medium">{result.mutationNumber}</TableCell>
                        {isTrainingView && <TableCell className="text-xs text-muted-foreground">{result.expectedNumber || 'N/A'}</TableCell>}
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

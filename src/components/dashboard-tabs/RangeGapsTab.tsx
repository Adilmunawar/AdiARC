
"use client";
import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { compressRanges } from "@/lib/forensic-utils";
import { Copy, Download, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type RangeGapsState = {
  start: string;
  end: string;
  fileContent: string;
  fileName: string;
  result: string;
  presentCompressed: string;
  missingFull: string;
  presentFull: string;
  stats: { total: number; missing: number; present: number } | null;
  gapBuckets: { start: number; end: number; missing: number; total: number }[] | null;
};

export function RangeGapsTab() {
  const { toast } = useToast();
  const [state, setState] = useLocalStorage<RangeGapsState>("adiarc_range_gaps_state", {
    start: "5001",
    end: "10000",
    fileContent: "",
    fileName: "",
    result: "",
    presentCompressed: "",
    missingFull: "",
    presentFull: "",
    stats: null,
    gapBuckets: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [useCompressedMissing, setUseCompressedMissing] = useState<boolean>(true);
  const [useCompressedPresent, setUseCompressedPresent] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setState(prev => ({...prev, fileContent: text, fileName: file.name }));
      toast({
        title: "File loaded",
        description: `Loaded ${file.name}`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "File error",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleCopy = async (label: string, value: string) => {
    if (!value) {
      toast({
        title: `Nothing to copy for ${label}`,
        description: "Run a scan first to generate data.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copied`,
        description: "The IDs are now in your clipboard.",
      });
    } catch (error) {
      console.error("Clipboard copy failed", error);
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!state.result && !state.presentCompressed) {
      toast({
        title: "Nothing to download",
        description: "Run a scan first to generate data.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        const coverage = state.stats && state.stats.total > 0 ? Math.round((state.stats.present / state.stats.total) * 1000) / 10 : null;

        const lines = [
          `AdiARC Gap Analysis Report`,
          `===========================`,
          `Date: ${new Date().toISOString()}`,
          `Range: ${state.start} - ${state.end}`,
          `Source File: ${state.fileName || 'Pasted content'}`,
          ``,
          `--- Statistics ---`,
          `Total numbers in range: ${state.stats?.total ?? 'N/A'}`,
          `Present: ${state.stats?.present ?? 'N/A'}`,
          `Missing: ${state.stats?.missing ?? 'N/A'}`,
          `Coverage: ${coverage !== null ? `${coverage}%` : 'N/A'}`,
          ``,
          `--- Missing IDs (Compressed) ---`,
          state.result || "N/A",
          ``,
          `--- Present IDs (Compressed) ---`,
          state.presentCompressed || "N/A",
          ``,
          `--- Missing IDs (Full List) ---`,
          state.missingFull || "N/A"
        ];
        
        // Simulate progress for the report generation itself as it's small
        let content = "";
        for (let i = 0; i < lines.length; i++) {
            content += lines[i] + "\n";
            setDownloadProgress((i / lines.length) * 100);
            await new Promise(r => setTimeout(r, 10)); // tiny delay
        }
        
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `adiarc-gap-report-${state.start}-${state.end}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast({
          title: "Download started",
          description: "Your AdiARC gap report is being downloaded.",
        });

    } catch (error) {
        console.error("Report download failed", error);
        toast({
            title: "Download failed",
            description: "Could not generate the report file.",
            variant: "destructive"
        });
    } finally {
        setIsDownloading(false);
    }

  };

  const handleProcess = async () => {
    setState(prev => ({
        ...prev,
        result: "",
        presentCompressed: "",
        missingFull: "",
        presentFull: "",
        stats: null,
        gapBuckets: null,
    }));
    setUseCompressedMissing(true);
    setUseCompressedPresent(true);


    if (!state.fileContent) {
      toast({
        title: "No file content",
        description: "Please upload a text file or paste numbers in the text area.",
        variant: "destructive",
      });
      return;
    }

    const startNum = Number(state.start);
    const endNum = Number(state.end);

    if (!Number.isInteger(startNum) || !Number.isInteger(endNum) || startNum <= 0 || endNum <= startNum) {
      toast({
        title: "Invalid range",
        description: "Please enter a valid numeric range (start <= end, both > 0).",
        variant: "destructive",
      });
      return;
    }

    const totalInRange = Math.max(0, endNum - startNum + 1);

    setIsLoading(true);
    await new Promise(res => setTimeout(res, 50)); // Short delay for UX responsiveness

    try {
      const existingNumbers = new Set<number>();
      const numberRegex = /\d+/g;
      const matches = state.fileContent.match(numberRegex) || [];
      for (const match of matches) {
        existingNumbers.add(Number(match));
      }

      const missing: number[] = [];
      const present: number[] = [];
      for (let i = startNum; i <= endNum; i++) {
        if (existingNumbers.has(i)) {
          present.push(i);
        } else {
          missing.push(i);
        }
      }

      const presentFullString = present.join("\n");

      let buckets: { start: number; end: number; missing: number; total: number }[] | null = null;
      if (missing.length > 0) {
        const maxBuckets = 30;
        const bucketCount = Math.min(maxBuckets, totalInRange);
        const bucketSize = Math.max(1, Math.floor(totalInRange / bucketCount));

        buckets = Array.from({ length: bucketCount }, (_, idx) => {
          const bucketStart = startNum + idx * bucketSize;
          const rawEnd = bucketStart + bucketSize - 1;
          const bucketEnd = idx === bucketCount - 1 ? endNum : Math.min(rawEnd, endNum);
          const total = bucketEnd >= bucketStart ? bucketEnd - bucketStart + 1 : 0;
          return { start: bucketStart, end: bucketEnd, missing: 0, total };
        });

        for (const m of missing) {
          const index = Math.min(Math.floor((m - startNum) / bucketSize), bucketCount - 1);
          if (index >= 0 && index < buckets.length) {
            buckets[index].missing += 1;
          }
        }
      }
      
      const newState: Partial<RangeGapsState> = {
        stats: { total: totalInRange, missing: missing.length, present: totalInRange - missing.length },
        gapBuckets: buckets,
        presentFull: presentFullString,
        presentCompressed: compressRanges(present) || "ALL",
      };

      if (missing.length === 0) {
        newState.result = "NONE";
        newState.missingFull = "NONE";
        toast({
          title: "No missing numbers",
          description: "All numbers in the range are present in the file.",
        });
      } else {
        newState.result = compressRanges(missing);
        newState.missingFull = missing.join("\n");
        toast({
          title: "Missing numbers computed",
          description: "Scroll down to see the compressed result.",
        });
      }

      setState(prev => ({...prev, ...newState}));

    } catch (error) {
      console.error("Local processing failed", error);
      toast({
        title: "Unexpected error",
        description: "Something went wrong while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const coverage = state.stats && state.stats.total > 0 ? Math.round((state.stats.present / state.stats.total) * 1000) / 10 : null;
  const missingDisplay = useCompressedMissing ? state.result : state.missingFull;
  const presentDisplay = useCompressedPresent ? state.presentCompressed : state.presentFull;

  const gapSeverity =
    state.stats && state.stats.total > 0
      ? state.stats.missing === 0
        ? "none"
        : state.stats.missing / state.stats.total >= 0.2
        ? "high"
        : state.stats.missing / state.stats.total >= 0.05
        ? "medium"
        : "low"
      : null;

  const chartData =
    state.gapBuckets?.map((bucket) => ({
      name: `${bucket.start}-${bucket.end}`,
      missing: bucket.missing,
      present: bucket.total - bucket.missing,
      label: `${bucket.start.toLocaleString()}-${bucket.end.toLocaleString()}`
    })) ?? [];

  return (
    <>
      <Dialog open={isDownloading}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Preparing Your Download</DialogTitle>
            <DialogDescription>
                Please wait while we generate the report file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Progress value={downloadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                    Processing... {Math.round(downloadProgress)}%
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Find Gaps in Sequential Numbers</CardTitle>
          <CardDescription>
            Identify missing mutation numbers within a large range by comparing it against a text file of existing IDs. Your work is automatically saved and restored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-2 items-start">
            {/* LEFT: Input Column */}
            <div className="flex flex-col gap-4">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start">Range Start</Label>
                  <Input id="start" type="number" value={state.start} onChange={(e) => setState(prev => ({...prev, start: e.target.value}))} min={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Range End</Label>
                  <Input id="end" type="number" value={state.end} onChange={(e) => setState(prev => ({...prev, end: e.target.value}))} min={1} />
                </div>
              </section>

              <section className="space-y-2">
                <Label htmlFor="file">Mutation Numbers File (.txt, .csv)</Label>
                <Input id="file" type="file" accept=".txt,.csv" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground pt-2">
                    You can upload a file, or paste your numbers directly into the text area below (comma, space, or new-line separated). Uploading a file will populate the text area.
                </p>
                <Textarea 
                    value={state.fileContent} 
                    onChange={(e) => setState(prev => ({...prev, fileContent: e.target.value}))}
                    placeholder="Your numbers will appear here after uploading a file, or you can paste them directly."
                    className="h-24 font-mono text-xs"
                />
              </section>

              <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 mt-2">
                  <p className="text-xs text-muted-foreground max-w-xs">
                      All processing is done locally in your browser for privacy and speed.
                  </p>
                  <Button
                    type="button"
                    onClick={handleProcess}
                    disabled={isLoading}
                    className="shrink-0 shadow-md"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Find Missing Numbers"
                    )}
                  </Button>
              </div>
            </div>

            {/* RIGHT: Stats and Chart */}
            <div className="flex flex-col gap-4 mt-6 lg:mt-0">
              <div className="grid grid-cols-4 gap-3 text-center text-xs text-muted-foreground p-3 rounded-lg border bg-muted/40">
                  <div>
                      <p className="font-semibold text-foreground text-lg">{state.stats ? state.stats.total.toLocaleString() : "—"}</p>
                      <p>Total in Range</p>
                  </div>
                  <div>
                      <p className="font-semibold text-foreground text-lg">{state.stats ? state.stats.present.toLocaleString() : "—"}</p>
                      <p>Present</p>
                  </div>
                  <div>
                      <p className="font-semibold text-destructive text-lg">{state.stats ? state.stats.missing.toLocaleString() : "—"}</p>
                      <p>Missing</p>
                  </div>
                  <div>
                      <p className="font-semibold text-primary text-lg">{coverage !== null ? `${coverage}%` : "—"}</p>
                      <p>Coverage</p>
                  </div>
              </div>
              {chartData.length > 0 && (
                  <div className="space-y-2">
                      <Label className="text-xs">Gap Distribution</Label>
                      <div className="h-40 rounded-lg border bg-muted/40 p-2">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: -5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3}/>
                                  <XAxis dataKey="label" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={40} />
                                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                  <Tooltip
                                      cursor={{fill: 'hsl(var(--accent))', fillOpacity: 0.3}}
                                      contentStyle={{
                                          background: 'hsl(var(--background))',
                                          border: '1px solid hsl(var(--border))',
                                          borderRadius: 'var(--radius)',
                                          fontSize: '11px',
                                          padding: '4px 8px'
                                      }}
                                  />
                                  <Bar dataKey="missing" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Missing" />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              )}
            </div>
          </section>

          {state.stats !== null && (
          <section className="space-y-4 pt-4 border-t border-dashed border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">Analysis Results</h3>
                      {gapSeverity === 'low' && <Badge variant="outline" className="border-green-500/50 text-green-700">Low Gap Rate</Badge>}
                      {gapSeverity === 'medium' && <Badge variant="secondary" className="border-yellow-500/50 text-yellow-700">Medium Gap Rate</Badge>}
                      {gapSeverity === 'high' && <Badge variant="destructive">High Gap Rate</Badge>}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={!state.stats || isDownloading}>
                    {isDownloading ? (
                        <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Download Report
                        </>
                    )}
                  </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                  {/* Missing Numbers */}
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <Label htmlFor="missing-results">Missing Numbers ({useCompressedMissing ? 'Compressed' : 'Full List'})</Label>
                          <div className="flex items-center gap-1">
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setUseCompressedMissing(p => !p)}
                                  title={useCompressedMissing ? "Show Full List" : "Show Compressed"}
                              >
                                  {useCompressedMissing ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </Button>
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopy("missing IDs", missingDisplay)}
                                  disabled={!missingDisplay || missingDisplay === "NONE"}
                                  title="Copy"
                              >
                                  <Copy className="h-4 w-4" />
                              </Button>
                          </div>
                      </div>
                      <Textarea
                      id="missing-results"
                      readOnly
                      value={missingDisplay}
                      placeholder="Missing numbers will appear here after processing."
                      className="h-40 font-mono text-xs bg-muted/30"
                      />
                  </div>
                  {/* Present Numbers */}
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <Label htmlFor="present-results">Present Numbers ({useCompressedPresent ? 'Compressed' : 'Full List'})</Label>
                          <div className="flex items-center gap-1">
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setUseCompressedPresent(p => !p)}
                                  title={useCompressedPresent ? "Show Full List" : "Show Compressed"}
                              >
                                  {useCompressedPresent ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </Button>
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopy("present IDs", presentDisplay)}
                                  disabled={!presentDisplay || presentDisplay === "NONE" || presentDisplay === "ALL"}
                                  title="Copy"
                              >
                                  <Copy className="h-4 w-4" />
                              </Button>
                          </div>
                      </div>
                      <Textarea
                      id="present-results"
                      readOnly
                      value={presentDisplay}
                      placeholder="Present numbers will appear here after processing."
                      className="h-40 font-mono text-xs bg-muted/30"
                      />
                  </div>
              </div>
          </section>
          )}
        </CardContent>
      </Card>
    </>
  );
}


      
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

export function RangeGapsTab() {
  const { toast } = useToast();
  const [start, setStart] = useState<string>("5001");
  const [end, setEnd] = useState<string>("10000");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [presentCompressed, setPresentCompressed] = useState<string>("");
  const [missingFull, setMissingFull] = useState<string>("");
  const [presentFull, setPresentFull] = useState<string>("");
  const [useCompressedMissing, setUseCompressedMissing] = useState<boolean>(true);
  const [useCompressedPresent, setUseCompressedPresent] = useState<boolean>(true);
  const [stats, setStats] = useState<{ total: number; missing: number; present: number } | null>(null);
  const [gapBuckets, setGapBuckets] = useState<{ start: number; end: number; missing: number; total: number }[] | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setFileContent(text);
      setFileName(file.name);
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

  const handleDownload = () => {
    if (!result && !presentCompressed) {
      toast({
        title: "Nothing to download",
        description: "Run a scan first to generate data.",
        variant: "destructive",
      });
      return;
    }

    const lines = [
      `AdiARC Gap Analysis Report`,
      `===========================`,
      `Date: ${new Date().toISOString()}`,
      `Range: ${start} - ${end}`,
      `Source File: ${fileName || 'Pasted content'}`,
      ``,
      `--- Statistics ---`,
      `Total numbers in range: ${stats?.total ?? 'N/A'}`,
      `Present: ${stats?.present ?? 'N/A'}`,
      `Missing: ${stats?.missing ?? 'N/A'}`,
      `Coverage: ${coverage !== null ? `${coverage}%` : 'N/A'}`,
      ``,
      `--- Missing IDs (Compressed) ---`,
      result || "N/A",
      ``,
      `--- Present IDs (Compressed) ---`,
      presentCompressed || "N/A",
      ``,
      `--- Missing IDs (Full List) ---`,
      missingFull || "N/A"
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adiarc-gap-report-${start}-${end}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your AdiARC gap report is being downloaded.",
    });
  };

  const handleProcess = async () => {
    setResult("");
    setPresentCompressed("");
    setMissingFull("");
    setPresentFull("");
    setUseCompressedMissing(true);
    setUseCompressedPresent(true);
    setStats(null);
    setGapBuckets(null);

    if (!fileContent) {
      toast({
        title: "No file content",
        description: "Please upload a text file with your mutation numbers.",
        variant: "destructive",
      });
      return;
    }

    const startNum = Number(start);
    const endNum = Number(end);

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
    await new Promise(res => setTimeout(res, 250)); // Artificial delay for UX

    try {
      const existingNumbers = new Set<number>();
      const tokens = fileContent.split(/[^0-9]+/);
      for (const t of tokens) {
        if (!t) continue;
        const n = Number(t);
        if (Number.isInteger(n)) existingNumbers.add(n);
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

      if (missing.length === 0) {
        setResult("NONE");
        setMissingFull("NONE");
        setPresentCompressed(compressRanges(present) || "ALL");
        setPresentFull(presentFullString);
        setStats({ total: totalInRange, missing: 0, present: totalInRange });
        setGapBuckets(null);
        toast({
          title: "No missing numbers",
          description: "All numbers in the range are present in the file.",
        });
        return;
      }

      const missingCompressed = compressRanges(missing);
      const missingFullString = missing.join("\n");

      setResult(missingCompressed);
      setMissingFull(missingFullString);
      setPresentCompressed(compressRanges(present) || "NONE");
      setPresentFull(presentFullString);
      setStats({ total: totalInRange, missing: missing.length, present: totalInRange - missing.length });
      setGapBuckets(buckets);
      toast({
        title: "Missing numbers computed",
        description: "Scroll down to see the compressed result.",
      });
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

  const coverage = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 1000) / 10 : null;
  const missingDisplay = useCompressedMissing ? result : missingFull;
  const presentDisplay = useCompressedPresent ? presentCompressed : presentFull;

  const gapSeverity =
    stats && stats.total > 0
      ? stats.missing === 0
        ? "none"
        : stats.missing / stats.total >= 0.2
        ? "high"
        : stats.missing / stats.total >= 0.05
        ? "medium"
        : "low"
      : null;

  const chartData =
    gapBuckets?.map((bucket) => ({
      name: `${bucket.start}-${bucket.end}`,
      missing: bucket.missing,
      present: bucket.total - bucket.missing,
      label: `${bucket.start.toLocaleString()}-${bucket.end.toLocaleString()}`
    })) ?? [];

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Find Gaps in Sequential Numbers</CardTitle>
        <CardDescription>
          Identify missing mutation numbers within a large range by comparing it against a text file of existing IDs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-2 items-start">
          {/* LEFT: Input Column */}
          <div className="flex flex-col gap-4">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Range Start</Label>
                <Input id="start" type="number" value={start} onChange={(e) => setStart(e.target.value)} min={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Range End</Label>
                <Input id="end" type="number" value={end} onChange={(e) => setEnd(e.target.value)} min={1} />
              </div>
            </section>

            <section className="space-y-2">
              <Label htmlFor="file">Mutation Numbers File (.txt, .csv)</Label>
              <Input id="file" type="file" accept=".txt,.csv" onChange={handleFileChange} />
              {fileName && <p className="text-xs text-muted-foreground mt-1">Loaded: {fileName}</p>}
              {!fileName && 
                <Textarea 
                    value={fileContent} 
                    onChange={(e) => setFileContent(e.target.value)} 
                    placeholder="...or paste your numbers here directly (comma, space, or new-line separated)."
                    className="h-24 font-mono text-xs mt-2"
                />
              }
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
                    <p className="font-semibold text-foreground text-lg">{stats ? stats.total.toLocaleString() : "—"}</p>
                    <p>Total in Range</p>
                </div>
                <div>
                    <p className="font-semibold text-foreground text-lg">{stats ? stats.present.toLocaleString() : "—"}</p>
                    <p>Present</p>
                </div>
                <div>
                    <p className="font-semibold text-destructive text-lg">{stats ? stats.missing.toLocaleString() : "—"}</p>
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

        {stats !== null && (
        <section className="space-y-4 pt-4 border-t border-dashed border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
                 <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">Analysis Results</h3>
                    {gapSeverity === 'low' && <Badge variant="outline" className="border-green-500/50 text-green-700">Low Gap Rate</Badge>}
                    {gapSeverity === 'medium' && <Badge variant="secondary">Medium Gap Rate</Badge>}
                    {gapSeverity === 'high' && <Badge variant="destructive">High Gap Rate</Badge>}
                 </div>
                 <Button variant="outline" size="sm" onClick={handleDownload} disabled={!stats}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download Report
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
  );
}

    
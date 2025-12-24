
"use client";
import React, { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { compressRanges } from "@/lib/forensic-utils";

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
  const [useCompressed, setUseCompressed] = useState<boolean>(true);
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
      `AdiARC Export`,
      `Range: ${start} - ${end}`,
      "",
      "Missing IDs (compressed):",
      result || "N/A",
      "",
      "Present IDs (compressed):",
      presentCompressed || "N/A",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adiarc-${start}-${end}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your AdiARC export is being downloaded.",
    });
  };

  const handleProcess = async () => {
    setResult("");
    setPresentCompressed("");
    setMissingFull("");
    setPresentFull("");
    setUseCompressed(true);
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

      const presentFullString = present.join(",");

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
        setMissingFull("");
        setPresentCompressed(compressRanges(present) || "NONE");
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
      const missingFullString = missing.join(",");

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
  const missingDisplay = useCompressed ? result : missingFull;
  const presentDisplay = useCompressed ? presentCompressed : presentFull;

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
      bucketLabel: `${bucket.start}-${bucket.end}`,
      missingRatio: bucket.total > 0 ? bucket.missing / bucket.total : 0,
    })) ?? [];

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
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
              <Label htmlFor="file">Mutation Numbers Text File (.txt)</Label>
              <Input id="file" type="file" accept=".txt" onChange={handleFileChange} />
              {fileName && <p className="text-xs text-muted-foreground mt-1">Loaded: {fileName}</p>}
            </section>
            
            <section className="space-y-2">
                <Label>Preview of Uploaded Content</Label>
                <Textarea
                  readOnly
                  value={fileContent.slice(0, 12000)}
                  placeholder="Your uploaded file content will appear here (preview is truncated)."
                  className="h-40 font-mono text-xs"
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
                  className="shrink-0"
                >
                  {isLoading ? "Processing..." : "Find Missing Numbers"}
                </Button>
            </div>
          </div>

          {/* RIGHT: Output Column */}
          <div className="flex flex-col gap-4 mt-6 lg:mt-0">
             <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground p-3 rounded-lg border bg-muted/40">
                <div>
                    <p className="font-semibold text-foreground text-lg">{stats ? stats.total.toLocaleString() : "—"}</p>
                    <p>Total in Range</p>
                </div>
                <div>
                    <p className="font-semibold text-destructive text-lg">{stats ? stats.missing.toLocaleString() : "—"}</p>
                    <p>Missing</p>
                </div>
                <div>
                    <p className="font-semibold text-foreground text-lg">{stats ? stats.present.toLocaleString() : "—"}</p>
                    <p>Present</p>
                </div>
            </div>

            <section className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Missing Numbers ({useCompressed ? 'Compressed' : 'Full List'})</Label>
                     <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => setUseCompressed(p => !p)}
                          >
                            {useCompressed ? "Show Full List" : "Show Compressed"}
                          </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => handleCopy("missing IDs", missingDisplay)}
                            disabled={!missingDisplay || missingDisplay === "NONE"}
                        >
                            Copy
                        </Button>
                    </div>
                </div>
                <Textarea
                  readOnly
                  value={missingDisplay}
                  placeholder="Missing numbers will appear here after processing."
                  className="h-64 font-mono text-xs bg-muted/30"
                />
            </section>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

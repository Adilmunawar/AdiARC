
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

    if (!Number.isInteger(startNum) || !Number.isInteger(endNum) || startNum <= 0 || endNum <= 0 || startNum > endNum) {
      toast({
        title: "Invalid range",
        description: "Please enter a valid numeric range (start &lt;= end, both &gt; 0).",
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
      for (let i = startNum; i &lt;= endNum; i++) {
        if (existingNumbers.has(i)) {
          present.push(i);
        } else {
          missing.push(i);
        }
      }

      const presentFullString = present.join(",");

      let buckets: { start: number; end: number; missing: number; total: number }[] | null = null;
      if (missing.length &gt; 0) {
        const maxBuckets = 30;
        const bucketCount = Math.min(maxBuckets, totalInRange);
        const bucketSize = Math.max(1, Math.floor(totalInRange / bucketCount));

        buckets = Array.from({ length: bucketCount }, (_, idx) => {
          const bucketStart = startNum + idx * bucketSize;
          const rawEnd = bucketStart + bucketSize - 1;
          const bucketEnd = idx === bucketCount - 1 ? endNum : Math.min(rawEnd, endNum);
          const total = bucketEnd &gt;= bucketStart ? bucketEnd - bucketStart + 1 : 0;
          return { start: bucketStart, end: bucketEnd, missing: 0, total };
        });

        for (const m of missing) {
          const index = Math.min(Math.floor((m - startNum) / bucketSize), bucketCount - 1);
          if (index &gt;= 0 && index &lt; buckets.length) {
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

  const coverage = stats && stats.total &gt; 0 ? Math.round((stats.present / stats.total) * 1000) / 10 : null;
  const missingDisplay = useCompressed ? result : missingFull;
  const presentDisplay = useCompressed ? presentCompressed : presentFull;

  const gapSeverity =
    stats && stats.total &gt; 0
      ? stats.missing === 0
        ? "none"
        : stats.missing / stats.total &gt;= 0.2
        ? "high"
        : stats.missing / stats.total &gt;= 0.05
        ? "medium"
        : "low"
      : null;

  const chartData =
    gapBuckets?.map((bucket) => ({
      bucketLabel: `${bucket.start}-${bucket.end}`,
      missingRatio: bucket.total &gt; 0 ? bucket.missing / bucket.total : 0,
    })) ?? [];

  return (
    &lt;div className="space-y-6 animate-fade-in"&gt;
      &lt;!-- Coverage summary always visible above both columns --&gt;
      &lt;section className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-xs shadow-sm shadow-primary/10"&gt;
        &lt;div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"&gt;
          &lt;div className="space-y-1"&gt;
            &lt;p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"&gt;Coverage summary&lt;/p&gt;
            &lt;p className="text-sm font-semibold text-foreground"&gt;
              {coverage !== null ? `${coverage.toFixed(1)}% IDs present in range` : "—"}
            &lt;/p&gt;
            &lt;p className="text-[11px] text-muted-foreground"&gt;
              {gapSeverity === "none"
                ? "Perfect coverage. No missing IDs."
                : gapSeverity === "high"
                ? "Critical gaps detected. Consider investigating missing ranges."
                : gapSeverity === "medium"
                ? "Moderate gaps detected across the range."
                : gapSeverity === "low"
                ? "Light gaps detected. Coverage is mostly complete."
                : "Run a scan to see coverage details."}
            &lt;/p&gt;
            &lt;p className="text-[10px] text-muted-foreground/80"&gt;
              Coverage = present IDs ÷ total IDs in your selected range.
            &lt;/p&gt;
          &lt;/div&gt;
          &lt;div className="flex flex-col items-end gap-2"&gt;
            &lt;div className="flex items-center gap-2 text-[11px] text-muted-foreground"&gt;
              &lt;span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"&gt;
                {stats ? stats.missing : "—"}
              &lt;/span&gt;
              &lt;span&gt;{stats ? `missing of ${stats.total.toLocaleString()}` : "Run a scan to see missing counts"}&lt;/span&gt;
            &lt;/div&gt;
            &lt;div className="inline-flex overflow-hidden rounded-full border border-border bg-card text-[11px]"&gt;
              &lt;button
                type="button"
                className={`px-2 py-1 text-[11px] ${useCompressed ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setUseCompressed(true)}
              &gt;
                Compressed
              &lt;/button&gt;
              &lt;button
                type="button"
                className={`px-2 py-1 text-[11px] ${!useCompressed ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setUseCompressed(false)}
              &gt;
                Full list
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/section&gt;

      &lt;!-- Main two-column layout: Input left, Missing IDs right --&gt;
      &lt;section className="grid gap-8 lg:grid-cols-2 items-stretch animate-enter"&gt;
        &lt;Card className="flex h-full flex-col border-border/70 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur-sm hover:shadow-primary/20 transition-shadow duration-300"&gt;
          &lt;CardHeader className="pb-5 border-b border-border/60"&gt;
            &lt;CardTitle className="text-base font-semibold tracking-tight"&gt;Input configuration&lt;/CardTitle&gt;
            &lt;CardDescription&gt;Define the numeric window and load your mutation file.&lt;/CardDescription&gt;
          &lt;/CardHeader&gt;
          &lt;CardContent className="space-y-6 pt-5 flex-1"&gt;
            &lt;section className="grid gap-4 md:grid-cols-2"&gt;
              &lt;div className="space-y-2"&gt;
                &lt;Label htmlFor="start"&gt;Range start&lt;/Label&gt;
                &lt;Input id="start" type="number" value={start} onChange={(e) => setStart(e.target.value)} min={1} /&gt;
                &lt;p className="text-xs text-muted-foreground"&gt;Lowest mutation ID to include in the scan.&lt;/p&gt;
              &lt;/div&gt;
              &lt;div className="space-y-2"&gt;
                &lt;Label htmlFor="end"&gt;Range end&lt;/Label&gt;
                &lt;Input id="end" type="number" value={end} onChange={(e) => setEnd(e.target.value)} min={1} /&gt;
                &lt;p className="text-xs text-muted-foreground"&gt;Highest mutation ID to include in the scan.&lt;/p&gt;
              &lt;/div&gt;
            &lt;/section&gt;

            &lt;section className="space-y-2"&gt;
              &lt;Label htmlFor="file"&gt;Mutation numbers text file (.txt)&lt;/Label&gt;
              &lt;Input id="file" type="file" accept=".txt" onChange={handleFileChange} /&gt;
              {fileName && &lt;p className="text-sm text-muted-foreground"&gt;Loaded file: {fileName}&lt;/p&gt;}
              &lt;p className="text-xs text-muted-foreground"&gt;
                Supports tens of thousands of entries separated by commas, spaces, or new lines.
              &lt;/p&gt;
            &lt;/section&gt;

            &lt;section className="space-y-2"&gt;
              &lt;Label&gt;Preview of uploaded content&lt;/Label&gt;
              &lt;Textarea
                readOnly
                value={fileContent.slice(0, 12000)}
                placeholder="First part of your uploaded file will appear here (preview is truncated for very large files)."
                className="h-32 font-mono text-xs"
              /&gt;
            &lt;/section&gt;

            &lt;div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-4"&gt;
              &lt;p className="text-xs md:text-[13px] text-muted-foreground max-w-xs"&gt;
                All processing happens locally in your browser. No servers or external APIs are called.
              &lt;/p&gt;
              &lt;Button
                type="button"
                onClick={handleProcess}
                disabled={isLoading}
                className="hover:scale-105 active:scale-100 px-5 py-2 text-sm font-semibold shadow-md shadow-primary/20"
              &gt;
                {isLoading ? "Processing..." : "Find missing numbers"}
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/CardContent&gt;
        &lt;/Card&gt;

        &lt;Card className="flex h-full flex-col border-dashed border-border/70 bg-card/70 shadow-sm animate-enter"&gt;
          &lt;CardHeader className="flex items-start justify-between gap-3 pb-3"&gt;
            &lt;div&gt;
              &lt;CardTitle className="text-base font-semibold"&gt;Missing IDs&lt;/CardTitle&gt;
              &lt;CardDescription&gt;
                View missing IDs as compact ranges or a full list within the selected window.
              &lt;/CardDescription&gt;
            &lt;/div&gt;
            &lt;div className="flex flex-col items-end gap-1 text-[11px]"&gt;
              &lt;Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy("missing IDs", missingDisplay)}
                className="h-7 px-3 text-[11px]"
              &gt;
                Copy
              &lt;/Button&gt;
              &lt;Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-3 text-[11px]"
              &gt;
                Download
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/CardHeader&gt;
          &lt;CardContent className="space-y-4 flex-1"&gt;
            &lt;div className="grid grid-cols-3 gap-2 rounded-lg border border-dashed border-border/80 bg-muted/40 px-3 py-2 text-center text-[11px] text-muted-foreground"&gt;
              &lt;div&gt;
                &lt;p className="font-medium text-foreground"&gt;{stats ? stats.total.toLocaleString() : "—"}&lt;/p&gt;
                &lt;p&gt;IDs in range&lt;/p&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;p className="font-medium text-destructive"&gt;{stats ? stats.missing.toLocaleString() : "—"}&lt;/p&gt;
                &lt;p&gt;Missing IDs&lt;/p&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;p className="font-medium text-foreground"&gt;{stats ? stats.present.toLocaleString() : "—"}&lt;/p&gt;
                &lt;p&gt;Present IDs&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="space-y-1"&gt;
              &lt;div className="flex items-center justify-between text-[11px] text-muted-foreground"&gt;
                &lt;p className="font-medium"&gt;Gap distribution across range&lt;/p&gt;
                &lt;span className="text-[10px]"&gt;Taller red bars = more missing IDs&lt;/span&gt;
              &lt;/div&gt;
              &lt;div className="h-28 rounded-md border border-border/60 bg-muted/40 px-2 py-1"&gt;
                &lt;ResponsiveContainer width="100%" height="100%"&gt;
                  &lt;BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}&gt;
                    &lt;XAxis dataKey="bucketLabel" hide tickLine={false} axisLine={false} /&gt;
                    &lt;Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        fontSize: 11,
                      }}
                      formatter={(value: number) => [\`\${Math.round((value as number) * 1000) / 10}% missing\`, "Missing share"]}
                    /&gt;
                    &lt;Bar dataKey="missingRatio" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} /&gt;
                  &lt;/BarChart&gt;
                &lt;/ResponsiveContainer&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;div className="text-xs text-muted-foreground"&gt;
              {!stats
                ? "Run a scan to see missing IDs here."
                : stats.missing === 0
                ? "No gaps detected in the selected range. Your coverage is complete."
                : useCompressed
                ? "Viewing compressed ranges. Switch to full list to see every missing ID."
                : "Viewing full list of missing IDs in this range."}
            &lt;/div&gt;

            &lt;Textarea
              readOnly
              value={missingDisplay}
              placeholder={\`After processing, missing numbers will appear here as \${
                useCompressed ? "compressed ranges (e.g. 20001-20006)" : "a full comma-separated list"
              }. If there are no missing numbers, you will see 'NONE'.\`}
              className="h-64 font-mono text-xs md:h-72"
            /&gt;
          &lt;/CardContent&gt;
        &lt;/Card&gt;
      &lt;/section&gt;

      &lt;!-- Full-width Present IDs section beneath both columns --&gt;
      &lt;section className="animate-enter"&gt;
        &lt;Card className="mt-2 border border-border/70 bg-card/80 shadow-md shadow-primary/10"&gt;
          &lt;CardHeader className="flex flex-col gap-2 px-4 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between"&gt;
            &lt;div&gt;
              &lt;CardTitle className="text-base font-semibold"&gt;Present IDs&lt;/CardTitle&gt;
              &lt;CardDescription&gt;
                All IDs from your file within the selected range, shown as {useCompressed ? "compressed" : "full"} data.
              &lt;/CardDescription&gt;
            &lt;/div&gt;
            &lt;div className="flex items-center gap-2 text-[11px] sm:self-start"&gt;
              &lt;Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy("present IDs", presentDisplay)}
                className="h-7 px-3 text-[11px]"
              &gt;
                Copy present IDs
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/CardHeader&gt;
          &lt;CardContent className="space-y-3"&gt;
            &lt;Textarea
              readOnly
              value={presentDisplay}
              placeholder={
                useCompressed
                  ? "After processing, present numbers will appear here as compressed ranges."
                  : "After processing, present numbers will appear here as a full comma-separated list."
              }
              className="h-52 font-mono text-xs md:h-60"
            /&gt;
            &lt;p className="text-[11px] text-muted-foreground"&gt;
              Use this to verify exactly which IDs from your file are covered in this range, in either compressed or full form.
            &lt;/p&gt;
          &lt;/CardContent&gt;
        &lt;/Card&gt;
      &lt;/section&gt;
    &lt;/div&gt;
  );
}

    
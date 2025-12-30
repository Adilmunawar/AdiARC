
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { compressRanges } from "@/lib/forensic-utils";
import { ArrowLeftRight, ClipboardCheck, Copy, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type AuditorState = {
  sheetList: string;
  dbList: string;
};

type AuditorResult = {
  stats: {
    sheetTotal: number;
    dbTotal: number;
    common: number;
    sheetOnly: number;
    dbOnly: number;
  };
  sheetOnlyList: number[];
  dbOnlyList: number[];
};

export function AuditorTab() {
  const { toast } = useToast();
  const [state, setState] = useState<AuditorState>({ sheetList: "", dbList: "" });
  const [result, setResult] = useState<AuditorResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [sheetCount, setSheetCount] = useState(0);
  const [dbCount, setDbCount] = useState(0);

  const expandList = (list: string): Set<number> => {
    const numbers = new Set<number>();
    if (!list) return numbers;
    const tokens = list.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);

    for (const token of tokens) {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          for (let i = start; i <= end; i++) {
            numbers.add(i);
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (!isNaN(num)) {
          numbers.add(num);
        }
      }
    }
    return numbers;
  };
  
  useEffect(() => {
    setSheetCount(expandList(state.sheetList).size);
    setDbCount(expandList(state.dbList).size);
  }, [state.sheetList, state.dbList]);

  const handleCopy = async (label: string, value: string) => {
    if (!value) {
      toast({
        title: `Nothing to copy for ${label}`,
        description: "Run a comparison first to generate data.",
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

  const handleDownload = async (filename: string, content: string) => {
     if (!content) {
      toast({
        title: "Nothing to download",
        description: "Run a comparison first to generate data.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        setDownloadProgress(50);
        // Prepend the UTF-8 BOM to force correct encoding recognition.
        const contentWithBom = '\uFEFF' + content;
        const blob = new Blob([contentWithBom], { type: "text/plain;charset=utf-8" });
        await new Promise(resolve => setTimeout(resolve, 50));
        
        setDownloadProgress(100);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download preparation failed", error);
        toast({
            title: "Download failed",
            description: "An error occurred while preparing the file.",
            variant: "destructive",
        });
    } finally {
        setIsDownloading(false);
    }
  };


  const handleCompare = async () => {
    if (!state.sheetList || !state.dbList) {
      toast({
        title: "Missing lists",
        description: "Please provide both the Sheet List and the DB List to compare.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    await new Promise(res => setTimeout(res, 50));

    try {
      const sheetNumbers = expandList(state.sheetList);
      const dbNumbers = expandList(state.dbList);

      const sheetOnly = new Set(Array.from(sheetNumbers).filter(x => !dbNumbers.has(x)));
      const dbOnly = new Set(Array.from(dbNumbers).filter(x => !sheetNumbers.has(x)));
      const common = new Set(Array.from(sheetNumbers).filter(x => dbNumbers.has(x)));
      
      const sortedSheetOnly = Array.from(sheetOnly).sort((a,b) => a-b);
      const sortedDbOnly = Array.from(dbOnly).sort((a,b) => a-b);

      setResult({
        stats: {
          sheetTotal: sheetNumbers.size,
          dbTotal: dbNumbers.size,
          common: common.size,
          sheetOnly: sheetOnly.size,
          dbOnly: dbOnly.size,
        },
        sheetOnlyList: sortedSheetOnly,
        dbOnlyList: sortedDbOnly,
      });

       toast({
        title: "Comparison Complete",
        description: `Found ${sheetOnly.size + dbOnly.size} discrepancies.`,
      });

    } catch (error) {
      console.error("Comparison failed", error);
      toast({
        title: "An Error Occurred",
        description: "Something went wrong during the comparison process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const sheetOnlyCompressed = result ? compressRanges(result.sheetOnlyList) : "";
  const dbOnlyCompressed = result ? compressRanges(result.dbOnlyList) : "";

  return (
    <>
      <Dialog open={isDownloading}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Preparing Your Download</DialogTitle>
            <DialogDescription>
                Please wait while we generate the text file.
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
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Mutation Auditor
          </CardTitle>
          <CardDescription>
            Compare your sheet-based mutation list against the database master list to find discrepancies. This tool supports single numbers, comma/space/line separators, and ranges (e.g., 5001-5010).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
            {/* LEFT: Inputs */}
            <div className="flex flex-col gap-4">
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sheet-list">1. Your Sheet List (Unverified)</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {sheetCount} unique IDs
                  </span>
                </div>
                <Textarea
                  id="sheet-list"
                  value={state.sheetList}
                  onChange={(e) => setState({ ...state, sheetList: e.target.value })}
                  placeholder="Paste the mutation numbers from your manual sheets here. These are the numbers you believe are implemented."
                  className="h-64 font-mono text-xs"
                  disabled={isLoading}
                />
              </section>
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="db-list">2. DB Master List (Verified)</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {dbCount} unique IDs
                  </span>
                </div>
                <Textarea
                  id="db-list"
                  value={state.dbList}
                  onChange={(e) => setState({ ...state, dbList: e.target.value })}
                  placeholder="Paste the full list of implemented mutations from the database here. This is your source of truth."
                  className="h-64 font-mono text-xs"
                  disabled={isLoading}
                />
              </section>
            </div>

            {/* RIGHT: Action and Results */}
            <div className="flex flex-col gap-4 mt-6 lg:mt-0">
              <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-primary/50 bg-primary/10 px-4 py-3">
                  <p className="text-sm font-medium text-primary max-w-xs">
                      Ready to find what's missing?
                  </p>
                  <Button
                    type="button"
                    onClick={handleCompare}
                    disabled={isLoading}
                    className="shrink-0 shadow-md text-sm"
                    size="lg"
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Comparing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4" />
                          Compare Lists
                      </span>
                    )}
                  </Button>
              </div>

              {result && (
                  <section className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground p-3 rounded-lg border bg-muted/40">
                          <div>
                              <p className="font-semibold text-foreground text-lg">{result.stats.common.toLocaleString()}</p>
                              <p>Matching IDs</p>
                          </div>
                          <div>
                              <p className="font-semibold text-destructive text-lg">{result.stats.sheetOnly.toLocaleString()}</p>
                              <p>Sheet Only</p>
                          </div>
                          <div>
                              <p className="font-semibold text-blue-600 text-lg">{result.stats.dbOnly.toLocaleString()}</p>
                              <p>DB Only</p>
                          </div>
                      </div>
                      {/* Sheet Only Results */}
                      <div className="space-y-2">
                          <div className="flex items-center justify-between">
                              <Label htmlFor="sheet-only-results">Found on Sheet but <span className="font-bold text-destructive">Missing from DB</span></Label>
                              <div className="flex items-center gap-1">
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleCopy("Sheet-only IDs", sheetOnlyCompressed)}
                                      disabled={!sheetOnlyCompressed}
                                      title="Copy"
                                  >
                                      <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDownload("sheet-only-mutations.txt", result.sheetOnlyList.join('\n'))}
                                      disabled={!result.sheetOnlyList.length || isDownloading}
                                      title="Download"
                                  >
                                      <Download className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                          <Textarea
                              id="sheet-only-results"
                              readOnly
                              value={sheetOnlyCompressed || "None"}
                              className="h-32 font-mono text-xs bg-muted/30 border-destructive/30 focus-visible:ring-destructive/50"
                          />
                      </div>
                      {/* DB Only Results */}
                      <div className="space-y-2">
                          <div className="flex items-center justify-between">
                              <Label htmlFor="db-only-results">Found in DB but <span className="font-bold text-blue-600">Not on Sheet</span></Label>
                              <div className="flex items-center gap-1">
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleCopy("DB-only IDs", dbOnlyCompressed)}
                                      disabled={!dbOnlyCompressed}
                                      title="Copy"
                                  >
                                      <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleDownload("db-only-mutations.txt", result.dbOnlyList.join('\n'))}
                                      disabled={!result.dbOnlyList.length || isDownloading}
                                      title="Download"
                                  >
                                      <Download className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                          <Textarea
                              id="db-only-results"
                              readOnly
                              value={dbOnlyCompressed || "None"}
                              className="h-32 font-mono text-xs bg-muted/30 border-blue-600/30 focus-visible:ring-blue-600/50"
                          />
                      </div>
                  </section>
              )}

              {!result && !isLoading && (
                  <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/40 text-sm text-muted-foreground">
                      <p>Your comparison results will appear here.</p>
                  </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

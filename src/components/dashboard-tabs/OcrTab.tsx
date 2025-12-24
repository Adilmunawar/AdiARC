
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

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
  const workerRef = useRef<any | null>(null);
  const isOcrScanningRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        // Ensure OCR worker is cleaned up if component unmounts mid-scan
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
      title: "OCR scan stopping",
      description: "Finishing current file and shutting down the OCR worker.",
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
    if (!files || files.length === 0) {
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      toast({
        title: "No image files detected",
        description: "Only image files are scanned for OCR.",
        variant: "destructive",
      });
      return;
    }

    setOcrResults([]);

    setIsOcrScanning(true);
    isOcrScanningRef.current = true;
    setOcrProgress({ current: 0, total: imageFiles.length, currentFileName: "" });

    toast({
      title: "Initializing OCR worker",
      description: "Loading Tesseract.js language data. This may take a few seconds.",
    });

    try {
      const worker = await createWorker("eng");
      workerRef.current = worker;

      let processed = 0;
      const resultMap = new Map<string, OcrResult>();

      for (const file of imageFiles) {
        if (!isOcrScanningRef.current) {
          break;
        }

        processed += 1;
        setOcrProgress({ current: processed, total: imageFiles.length, currentFileName: file.name });

        try {
          const { data } = await worker.recognize(file);
          const cleaned = (data?.text ?? "").replace(/[^0-9]/g, " ");
          const tokens = cleaned
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean);

          if (!tokens.length) {
            continue;
          }

          const tokenSet = new Set(tokens);

          Array.from(tokenSet).forEach((token) => {
            if (!resultMap.has(token)) {
              const updated: OcrResult = {
                mutationNumber: token,
                fileName: file.name,
                confidence: typeof data?.confidence === "number" ? data.confidence : undefined,
              };
              resultMap.set(token, updated);
            }
          });

          setOcrResults(Array.from(resultMap.values()));
        } catch (error) {
          console.error("OCR failed for", file.name, error);
        }
      }
    } catch (error) {
      console.error("Failed to initialize or run OCR worker", error);
      toast({
        title: "OCR error",
        description: "Something went wrong while running OCR on your images.",
        variant: "destructive",
      });
    } finally {
      try {
        if (workerRef.current) {
          await workerRef.current.terminate();
          workerRef.current = null;
        }
      } catch {
        // ignore
      }
      setIsOcrScanning(false);
      isOcrScanningRef.current = false;
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Local OCR Detective</CardTitle>
        <CardDescription>
          Run OCR on local images to search for mutation numbers directly in the visible text when filenames and metadata are
          unreliable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-6 md:grid-cols-2 items-stretch">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Select a local image folder and AdiARC will run OCR on each file, collecting every numeric token it sees as a
                potential mutation number.
              </p>
            </div>

            <div className="space-y-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-[11px]">
              <p className="font-medium">Scan a local image folder with OCR</p>
              <p className="text-muted-foreground">
                OCR runs entirely in your browser using Tesseract.js. No images leave your machine, but processing can be
                slow (1–2 seconds per image).
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
                    {isOcrScanning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{isOcrScanning ? "Scanning folder..." : "Select folder & start OCR"}</span>
                  </Button>
                  {isOcrScanning && (
                    <Button type="button" size="sm" variant="destructive" onClick={handleOcrStop}>
                      Stop scan
                    </Button>
                  )}
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  {ocrProgress.total > 0 ? (
                    <>
                      <span>
                        Processing file {ocrProgress.current.toLocaleString()} of {ocrProgress.total.toLocaleString()}...{" "}
                        (Found {ocrResults.length} unique IDs)
                      </span>
                      {ocrProgress.currentFileName && (
                        <p className="truncate text-[10px] text-muted-foreground/80">
                          Scanning <span className="font-medium">{ocrProgress.currentFileName}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <span>Select an image folder to begin OCR scanning.</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Progress
                  value={
                    ocrProgress.total > 0
                      ? (Math.min(ocrProgress.current, ocrProgress.total) / ocrProgress.total) * 100
                      : 0
                  }
                  className="h-1.5"
                />
              </div>
            </div>

            <input
              ref={ocrFolderInputRef}
              type="file"
              multiple
              // @ts-ignore - non-standard folder selection attributes
              webkitdirectory=""
              // @ts-ignore
              directory=""
              className="hidden"
              onChange={handleOcrFolderSelected}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">OCR results by mutation ID</p>
                <p className="text-[11px] text-muted-foreground">
                  Each row shows whether a mutation number was seen in any image text and, if found, in which file.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-[11px]">
                {ocrResults.length > 0 && (
                  <span className="text-muted-foreground">
                    {ocrResults.length} mutation numbers found in image text
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-md border border-border bg-card/70">
              <ScrollArea className="h-72 w-full rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mutation ID</TableHead>
                      <TableHead>Found in file</TableHead>
                      <TableHead>Extracted text (confidence)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ocrResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-[12px] text-muted-foreground">
                          Run an OCR folder scan to see which mutation numbers appear in your image text.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ocrResults.map((result) => (
                        <TableRow key={result.mutationNumber} className="bg-background">
                          <TableCell className="text-sm font-medium">{result.mutationNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{result.fileName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span>
                              Seen in image text
                              {typeof result.confidence === "number" && (
                                <span className="text-muted-foreground/70">
                                  {" "}
                                  ({Math.round(result.confidence)}% confidence)
                                </span>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

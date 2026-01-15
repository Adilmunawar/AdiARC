
"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Download, Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type LayoutMode = "rows" | "columns";

export function PrintLayoutTab() {
  const { toast } = useToast();
  const [mutationNumbers, setMutationNumbers] = useState("");
  const [rowsPerColumn, setRowsPerColumn] = useState("50");
  const [numberOfColumns, setNumberOfColumns] = useState("5");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("rows");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [fileName, setFileName] = useState("mutation_print_layout.xlsx");
  const [shouldSort, setShouldSort] = useState(true);

  const handleGenerateClick = () => {
    const rawNumbers = mutationNumbers.split(/[\s,;\n]+/).map((n) => n.trim()).filter(Boolean);

    if (rawNumbers.length === 0) {
      toast({
        title: "No Mutation Numbers",
        description: "Please paste the mutation numbers you want to format.",
        variant: "destructive",
      });
      return;
    }

    if (layoutMode === 'rows') {
        const rows = parseInt(rowsPerColumn, 10);
        if (isNaN(rows) || rows <= 0) {
          toast({
            title: "Invalid Rows Per Column",
            description: "Please enter a positive number for rows per column.",
            variant: "destructive",
          });
          return;
        }
    } else {
        const cols = parseInt(numberOfColumns, 10);
         if (isNaN(cols) || cols <= 0) {
          toast({
            title: "Invalid Number of Columns",
            description: "Please enter a positive number for the column count.",
            variant: "destructive",
          });
          return;
        }
    }
    
    setFileName(`mutation_print_layout_${rawNumbers.length}_items.xlsx`);
    setIsPromptOpen(true);
  }

  const handleGenerateExcel = async () => {
    setIsPromptOpen(false); // Close the name prompt
    let rawNumbers = mutationNumbers.split(/[\s,;\n]+/).map((n) => n.trim()).filter(Boolean);
    
    if (shouldSort) {
        const numericSorted = rawNumbers
            .map(n => parseInt(n, 10))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        rawNumbers = numericSorted.map(String);
    }

    setIsGenerating(true);
    setGenerateProgress(0);
    await new Promise(r => setTimeout(r, 50)); // Allow UI to update

    try {
      // Step 1: Create the snaking column layout
      setGenerateProgress(25);

      let rows: number;
      let numColumns: number;

      if (layoutMode === 'rows') {
        rows = parseInt(rowsPerColumn, 10);
        numColumns = Math.ceil(rawNumbers.length / rows);
      } else {
        numColumns = parseInt(numberOfColumns, 10);
        rows = Math.ceil(rawNumbers.length / numColumns);
      }

      const grid: (string | number)[][] = [];
      
      for (let c = 0; c < numColumns; c++) {
        const start = c * rows;
        const end = start + rows;
        const columnData = rawNumbers.slice(start, end);
        columnData.forEach((num, r) => {
          if (!grid[r]) {
            grid[r] = [];
          }
          while (grid[r].length < c) {
            grid[r].push("");
          }
          grid[r][c] = isNaN(Number(num)) ? num : Number(num);
        });
      }
      setGenerateProgress(50);
      await new Promise(r => setTimeout(r, 10));

      // Step 2: Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(grid);
      const wb = XLSX.utils.book_new();

      // Step 3: Apply Styling
      const allCellsRange = XLSX.utils.decode_range(ws["!ref"]!);
      const cols = [];
      for (let C = allCellsRange.s.c; C <= allCellsRange.e.c; ++C) {
        let max_w = 10;
        for (let R = allCellsRange.s.r; R <= allCellsRange.e.r; ++R) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!ws[cell_ref]) continue;

            ws[cell_ref].s = {
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } },
                }
            };
            const cell_w = String(ws[cell_ref].v).length + 2;
            if (max_w < cell_w) max_w = cell_w;
        }
        cols.push({ wch: max_w });
      }
      ws['!cols'] = cols;
      ws['!pageMargins'] = { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
      
      setGenerateProgress(75);
      await new Promise(r => setTimeout(r, 10));

      // Step 4: Append sheet and download
      XLSX.utils.book_append_sheet(wb, ws, "Mutation Layout");
      
      const finalFileName = fileName.trim() ? (fileName.trim().endsWith('.xlsx') ? fileName.trim() : `${fileName.trim()}.xlsx`) : "mutation_print_layout.xlsx";
      XLSX.writeFile(wb, finalFileName);
      
      setGenerateProgress(100);
      toast({
        title: "Excel File Generated",
        description: `Your formatted mutation list is downloading as ${finalFileName}.`,
      });

    } catch (error) {
      console.error("Failed to generate Excel file", error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred while creating the file.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={isGenerating}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Generating Your Excel File</DialogTitle>
            <DialogDescription>
              Please wait while we format the mutation numbers. This may take a moment for very large lists.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Progress value={generateProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Processing... {Math.round(generateProgress)}%
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name Your Excel File</DialogTitle>
            <DialogDescription>
              Enter the desired name for your Excel file. The `.xlsx` extension will be added automatically if you omit it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                File Name
              </Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateExcel();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleGenerateExcel}>
              Confirm & Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Printer className="h-5 w-5 text-primary" />
            Mutation Print Layout Formatter
          </CardTitle>
          <CardDescription>
            Paste a long list of mutation numbers and this tool will reorganize them into a print-friendly, multi-column
            Excel file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
            <div className="flex flex-col gap-4">
              <section className="space-y-2">
                <Label htmlFor="mutation-numbers">1. Paste Mutation Numbers Here</Label>
                <Textarea
                  id="mutation-numbers"
                  value={mutationNumbers}
                  onChange={(e) => setMutationNumbers(e.target.value)}
                  placeholder="Paste your newline, comma, or space-separated mutation numbers here."
                  className="h-96 font-mono text-xs"
                  disabled={isGenerating}
                />
              </section>
            </div>
            <div className="flex flex-col gap-4 mt-6 lg:mt-0">
                <section className="space-y-4">
                    <Label>2. Layout Configuration</Label>
                    <RadioGroup value={layoutMode} onValueChange={(value) => setLayoutMode(value as LayoutMode)} className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 rounded-md border bg-muted/30">
                            <RadioGroupItem value="rows" id="mode-rows" />
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="mode-rows" className="cursor-pointer">Define Rows per Column</Label>
                                <Input
                                    id="rows-per-column"
                                    type="number"
                                    value={rowsPerColumn}
                                    onChange={(e) => setRowsPerColumn(e.target.value)}
                                    className="w-40"
                                    disabled={isGenerating || layoutMode !== 'rows'}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Optimized for A4 paper (e.g., 50 rows).
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-md border bg-muted/30">
                           <RadioGroupItem value="columns" id="mode-columns" />
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="mode-columns" className="cursor-pointer">Define Total Number of Columns</Label>
                                 <Input
                                    id="number-of-columns"
                                    type="number"
                                    value={numberOfColumns}
                                    onChange={(e) => setNumberOfColumns(e.target.value)}
                                    className="w-40"
                                    disabled={isGenerating || layoutMode !== 'columns'}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Specify the exact number of columns to use.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="sort-numbers" checked={shouldSort} onCheckedChange={setShouldSort} />
                        <Label htmlFor="sort-numbers" className="cursor-pointer">Sort Numbers Numerically Before Layout</Label>
                    </div>
                </section>

                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-primary/50 bg-primary/10 px-4 py-3 mt-4">
                    <p className="text-sm font-medium text-primary max-w-xs">
                        Ready to create your printable sheet?
                    </p>
                    <Button
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        className="shrink-0 shadow-md text-sm"
                        size="lg"
                    >
                        {isGenerating ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                        </span>
                        ) : (
                        <span className="inline-flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Generate Excel
                        </span>
                        )}
                    </Button>
                </div>
                 <div className="text-xs text-muted-foreground space-y-2 pt-2">
                    <p><span className="font-semibold">How it works:</span> The tool uses a "snaking column" layout. If you have 150 numbers and set it to 50 rows, the output will be:</p>
                    <ul className="list-disc pl-5">
                        <li>Column A: Numbers 1-50</li>
                        <li>Column B: Numbers 51-100</li>
                        <li>Column C: Numbers 101-150</li>
                    </ul>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

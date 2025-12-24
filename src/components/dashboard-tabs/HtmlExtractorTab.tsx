
"use client";
import React, { useState } from "react";
import { ArrowRight, Copy, Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function HtmlExtractorTab() {
  const { toast } = useToast();
  const [mutationSource, setMutationSource] = useState<string>("");
  const [mutationNumbers, setMutationNumbers] = useState<number[]>([]);
  const [mutationText, setMutationText] = useState<string>("");

  const handleCopy = async (label: string, value: string) => {
    if (!value) {
      toast({
        title: `Nothing to copy for ${label}`,
        description: "Run an extraction first to generate data.",
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

  const handleExtractMutationNumbers = () => {
    const source = mutationSource.trim();

    if (!source) {
      toast({
        title: "No HTML pasted",
        description: "Paste the HTML that contains your mutation dropdown first.",
        variant: "destructive",
      });
      return;
    }

    if (source.length > 2_000_000) {
      toast({
        title: "Input too large",
        description: "Please paste a smaller HTML snippet (max ~2M characters).",
        variant: "destructive",
      });
      return;
    }

    try {
      const optionRegex = /<option[^>]*>([\s\S]*?)<\/option>/gi;
      const numbers: number[] = [];

      let match: RegExpExecArray | null;
      while ((match = optionRegex.exec(source)) !== null) {
        const text = match[1]
          .replace(/<[^>]+>/g, "") // strip any nested tags
          .trim();

        if (!text) continue;
        if (!/^\d+$/.test(text)) continue; // only pure digits

        const n = Number(text);
        if (Number.isInteger(n)) {
          numbers.push(n);
        }
      }

      const uniqueSorted = Array.from(new Set(numbers)).sort((a, b) => a - b);

      if (!uniqueSorted.length) {
        setMutationNumbers([]);
        setMutationText("");
        toast({
          title: "No mutation numbers found",
          description: "Make sure the HTML contains <option> tags with numeric values.",
          variant: "destructive",
        });
        return;
      }

      setMutationNumbers(uniqueSorted);
      const textExport = uniqueSorted.join("\n");
      setMutationText(textExport);

      toast({
        title: "Mutation numbers extracted",
        description: `Found ${uniqueSorted.length} numeric options in the pasted HTML.`,
      });
    } catch (error) {
      console.error("Failed to extract mutation numbers", error);
      toast({
        title: "Extraction error",
        description: "Something went wrong while parsing the HTML.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadMutationNumbers = () => {
    if (!mutationNumbers.length) {
      toast({
        title: "Nothing to download",
        description: "Extract mutation numbers first.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([mutationNumbers.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mutation-numbers.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your mutation numbers file is being downloaded.",
    });
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Fetch mutation numbers from HTML dropdown</CardTitle>
        <CardDescription>
          Paste raw HTML containing a <code>&lt;select&gt;</code> element to extract all numeric options. This is useful for grabbing mutation lists from legacy websites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
          
          {/* LEFT: Input Column */}
          <div className="flex flex-col gap-4">
             <section className="space-y-2">
                <Label htmlFor="mutation-html">1. Paste HTML source</Label>
                <Textarea
                    id="mutation-html"
                    value={mutationSource}
                    onChange={(e) => setMutationSource(e.target.value)}
                    placeholder="Paste the HTML that contains &lt;option&gt; elements with mutation numbers here."
                    className="h-64 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                    Example: a <code>&lt;select&gt;</code> element from a website where each <code>&lt;option&gt;</code> holds a mutation number. Non-numeric options are ignored.
                </p>
            </section>
            
            <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2">
                <p className="text-xs text-muted-foreground max-w-xs">
                    The extraction is done entirely in your browser for privacy and speed.
                </p>
                <Button type="button" onClick={handleExtractMutationNumbers} className="shrink-0">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Extract Numbers</span>
                </Button>
            </div>
          </div>

          {/* RIGHT: Output Column */}
          <div className="flex flex-col gap-4 mt-6 lg:mt-0">
            <section className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>2. Extracted numbers</Label>
                    {mutationNumbers.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">{mutationNumbers.length} unique numbers found</span>
                    )}
                </div>
                <Textarea
                    readOnly
                    value={mutationText}
                    placeholder={
                    "After extraction, mutation numbers will appear here, one per line, ready to copy or download."
                    }
                    className="h-64 font-mono text-xs bg-muted/30"
                />
            </section>
             <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy("mutation numbers", mutationText)}
                    disabled={!mutationText}
                >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy as text
                </Button>
                <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMutationNumbers}
                    disabled={!mutationNumbers.length}
                >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download as .txt
                </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

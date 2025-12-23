
"use client";
import React, { useState } from "react";

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
          Paste the raw HTML that contains the <code>&lt;select&gt;</code> with your mutation numbers. We will extract only the
          numeric options (e.g. 0, 288, 301, 303, 331, 342, 3261, 14018, ...).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2">
          <Label htmlFor="mutation-html">Paste HTML with mutation dropdown</Label>
          <Textarea
            id="mutation-html"
            value={mutationSource}
            onChange={(e) => setMutationSource(e.target.value)}
            placeholder="Paste the HTML that contains &lt;option&gt; elements with mutation numbers here."
            className="h-56 font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Example: a <code>&lt;select&gt;</code> element from a website where each <code>&lt;option&gt;</code> holds a mutation
            number. Non-numeric options like headings (e.g. چنیں) are ignored automatically.
          </p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-3">
          <p className="text-[11px] text-muted-foreground max-w-sm">
            The extraction is done entirely in your browser. We collect only numeric values from option text and ignore any
            IDs or labels.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExtractMutationNumbers}>
              Extract mutation numbers
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy("mutation numbers", mutationText)}
              disabled={!mutationText}
            >
              Copy as text
            </Button>
            <Button type="button" size="sm" onClick={handleDownloadMutationNumbers} disabled={!mutationNumbers.length}>
              Download as .txt
            </Button>
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <p className="font-medium">Extracted mutation numbers</p>
            <span>{mutationNumbers.length ? `${mutationNumbers.length} numbers found` : "No numbers extracted yet"}</span>
          </div>
          <Textarea
            readOnly
            value={mutationText}
            placeholder={
              "After extraction, mutation numbers will appear here, one per line, ready to copy or download as a .txt file."
            }
            className="h-48 font-mono text-xs"
          />
        </section>
      </CardContent>
    </Card>
  );
}

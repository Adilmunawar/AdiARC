"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Copy, FileX } from "lucide-react";

export function SqlGeneratorTab() {
  const { toast } = useToast();
  const [intiqalIds, setIntiqalIds] = useState("");
  const [mauzaId, setMauzaId] = useState("");
  const [generatedQuery, setGeneratedQuery] = useState("");

  const handleGenerateQuery = () => {
    const ids = intiqalIds
      .split(/[\s,;\n]+/)
      .map(id => id.trim())
      .filter(id => id); // Filter out empty strings

    if (ids.length === 0) {
      toast({
        title: "No Intiqal IDs",
        description: "Please paste at least one Intiqal ID.",
        variant: "destructive",
      });
      return;
    }

    if (!mauzaId.trim()) {
      toast({
        title: "Missing Mauza ID",
        description: "Please provide the Mauza ID.",
        variant: "destructive",
      });
      return;
    }

    const formattedIds = ids.map(id => `'${id}'`).join(",\n    ");

    const query = `BEGIN TRAN;

DELETE FROM transactions.Intiqal
WHERE mauza_id = '${mauzaId.trim()}'
AND intiqal_id IN (
    ${formattedIds}
);

COMMIT TRAN;`;

    setGeneratedQuery(query);
    toast({
      title: "Query Generated",
      description: "The DELETE query has been created successfully.",
    });
  };

  const handleCopy = async () => {
    if (!generatedQuery) {
      toast({
        title: "Nothing to copy",
        description: "Generate a query first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedQuery);
      toast({
        title: "Query Copied",
        description: "The SQL query is now in your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy the query to your clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileX className="h-5 w-5 text-primary" />
          Intiqal Deletion SQL Generator
        </CardTitle>
        <CardDescription>
          Generate a SQL script to delete multiple Intiqal records for a specific Mauza.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-2 lg:gap-8 items-start">
          <div className="flex flex-col gap-4">
            <section className="space-y-2">
              <Label htmlFor="mauza-id">1. Mauza ID</Label>
              <Input
                id="mauza-id"
                value={mauzaId}
                onChange={(e) => setMauzaId(e.target.value)}
                placeholder="e.g., 41402c3e-57ff-4435-9d79-183f6d6a90cb"
              />
            </section>
            <section className="space-y-2">
              <Label htmlFor="intiqal-ids">2. Intiqal IDs to Delete</Label>
              <Textarea
                id="intiqal-ids"
                value={intiqalIds}
                onChange={(e) => setIntiqalIds(e.target.value)}
                placeholder="Paste your list of Intiqal IDs here, separated by new lines, commas, or spaces."
                className="h-72 font-mono text-xs"
              />
            </section>
             <Button type="button" onClick={handleGenerateQuery}>
                Generate SQL Query
            </Button>
          </div>
          <div className="flex flex-col gap-4 mt-6 lg:mt-0">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="generated-query">3. Generated SQL Query</Label>
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!generatedQuery}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Textarea
                id="generated-query"
                readOnly
                value={generatedQuery}
                placeholder="Your generated SQL DELETE script will appear here."
                className="h-96 font-mono text-xs bg-muted/30"
              />
            </section>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

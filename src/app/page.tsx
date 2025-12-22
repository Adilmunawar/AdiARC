"use client";
import React, { useState } from "react";
import { Upload, ScanEye, ListChecks, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RangeGapsTab } from "@/components/dashboard-tabs/RangeGapsTab";
import { HtmlExtractorTab } from "@/components/dashboard-tabs/HtmlExtractorTab";
import { WirasatTab } from "@/components/dashboard-tabs/WirasatTab";
import { InventoryTab } from "@/components/dashboard-tabs/InventoryTab";
import { ServerSyncTab } from "@/components/dashboard-tabs/ServerSyncTab";
import { OcrTab } from "@/components/dashboard-tabs/OcrTab";

type InventoryItem = {
  id: string | null;
  file: string;
  folder: string;
  source: string;
  status: "valid" | "stripped" | "no-match";
  fileObject?: File;
};
export default function Home() {
  const [inventoryItems] = useState<InventoryItem[]>([]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/40 to-background px-4 py-8 sm:py-10 lg:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:gap-10">
        <header className="space-y-5 text-center animate-fade-in">
          <div className="mx-auto flex max-w-xl items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                1
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Upload className="h-3.5 w-3.5" /> Upload mutation file
              </span>
            </div>
            <div className="hidden flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] shadow-sm sm:flex">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                2
              </span>
              <span className="inline-flex items-center gap-1">
                <ScanEye className="h-3.5 w-3.5" /> Define range
              </span>
            </div>
            <div className="hidden flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] shadow-sm lg:flex">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                3
              </span>
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" /> Review gaps
              </span>
            </div>
          </div>

          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-balance text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl">
            AdiARC — Mutation & Range Calculator
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-sm md:text-base text-muted-foreground">
            Upload a large list of existing mutation IDs, choose the numeric window you care about, and AdiARC will compute all
            missing IDs locally in your browser with smart range compression.
          </p>
        </header>

        <Tabs defaultValue="find-missing" className="space-y-6">
          <TabsList className="inline-flex rounded-full border border-border bg-muted/60 p-1 text-xs shadow-sm">
            <TabsTrigger value="find-missing" className="px-3 py-1">
              Range gaps (Find missing IDs)
            </TabsTrigger>
            <TabsTrigger value="fetch-mutations" className="px-3 py-1">
              HTML dropdown extractor
            </TabsTrigger>
            <TabsTrigger value="wirasat" className="px-3 py-1">
              Partitions (Wirasat)
            </TabsTrigger>
            <TabsTrigger value="mutation-inventory" className="px-3 py-1">
              XMP Mutation Inventory
            </TabsTrigger>
            <TabsTrigger value="server-sync" className="px-3 py-1 inline-flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              <span>Server Sync</span>
            </TabsTrigger>
            <TabsTrigger value="local-ocr" className="px-3 py-1">
              Local OCR Detective
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find-missing">
            <RangeGapsTab />
          </TabsContent>
          <TabsContent value="fetch-mutations">
            <HtmlExtractorTab />
          </TabsContent>
          <TabsContent value="wirasat">
            <WirasatTab />
          </TabsContent>
          <TabsContent value="mutation-inventory">
            <InventoryTab />
          </TabsContent>
          <TabsContent value="server-sync">
            <ServerSyncTab inventoryItems={inventoryItems} />
          </TabsContent>
          <TabsContent value="local-ocr">
            <OcrTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

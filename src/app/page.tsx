"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Upload, ScanEye, ListChecks, Loader2, Database, Server, Key, Wifi } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import JSZip from "jszip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ExifReader from "exifreader";
import { createWorker } from "tesseract.js";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function compressRanges(numbers: number[]): string {
  if (!numbers.length) return "";

  // Ensure input is sorted and deduplicated to get clean ranges
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);

  const compressed: string[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      compressed.push(rangeStart === prev ? String(rangeStart) : `${rangeStart}-${prev}`);
      rangeStart = prev = current;
    }
  }

  compressed.push(rangeStart === prev ? String(rangeStart) : `${rangeStart}-${prev}`);

  return compressed.join(", ");
}

// --- CORE ENGINE: UNIVERSAL MUTATION HUNTER (Ported from Mutation Hunter Pro) ---
const extractMutationNumber = (tags: any): { number: string; source: string }[] => {
  const findings: { number: string; source: string }[] = [];

  // Helper: Recursive hunter for deep objects/arrays
  const hunt = (data: any, sourceLabel: string) => {
    if (!data) return;

    // 1. PRECISION CHECK (The "Golden Key" from LRMIS)
    if (typeof data === "object") {
      const attrs = (data as any).attributes || (data as any);
      const pathLabel = (attrs as any).path || (attrs as any)["hmx:path"] || "";

      if (typeof pathLabel === "string" && pathLabel.toLowerCase().includes("documentno")) {
        const value = (data as any).value || (data as any).description;
        if (value) {
          findings.push({
            number: String(value).trim(),
            source: "⭐ XMP:DocumentNo",
          });
          return; // Found the official tag, stop digging this branch
        }
      }
    }

    // 2. Recursion for Arrays
    if (Array.isArray(data)) {
      data.forEach((item, index) => hunt(item, `${sourceLabel}[${index}]`));
      return;
    }

    // 3. Recursion for Objects
    if (typeof data === "object") {
      // Prioritize value/description fields
      if ((data as any).value) hunt((data as any).value, `${sourceLabel}`);
      if ((data as any).description) hunt((data as any).description, `${sourceLabel}.desc`);

      // Also scan other keys if they are objects (deep dive)
      Object.keys(data as any).forEach((key) => {
        if (key !== "value" && key !== "attributes" && key !== "description" && typeof (data as any)[key] === "object") {
          hunt((data as any)[key], `${sourceLabel}.${key}`);
        }
      });
      return;
    }

    // 4. Fallback: String Regex (Only if Golden Key wasn't found in this branch)
    if (typeof data === "string") {
      const cleanText = data.replace(/[^\w\s-]/g, " ");
      // Strict Regex: 3-8 digits only
      const matches = cleanText.match(/\b\d{3,8}\b/g);
      if (matches) {
        matches.forEach((num) => {
          // Prevent duplicates from same source
          if (!findings.some((f) => f.number === num && f.source === sourceLabel)) {
            findings.push({ number: num, source: sourceLabel });
          }
        });
      }
    }
  };

  if (tags) {
    // START THE HUNT
    // We scan EVERYTHING because LRMIS tags can shift locations.
    hunt(tags, "ROOT");
  }

  return findings;
};

export default function Home() {
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
  const [gapBuckets, setGapBuckets] = useState<
    { start: number; end: number; missing: number; total: number }[] | null
  >(null);

  // New state for mutation-number HTML extraction tab
  const [mutationSource, setMutationSource] = useState<string>("");
  const [mutationNumbers, setMutationNumbers] = useState<number[]>([]);
  const [mutationText, setMutationText] = useState<string>("");

  // State for Partitions (Wirasat) tab
  const [wirasatKanal, setWirasatKanal] = useState<string>("0");
  const [wirasatMarla, setWirasatMarla] = useState<string>("0");
  const [wirasatFeet, setWirasatFeet] = useState<string>("0");
  const [wirasatMarlaSize, setWirasatMarlaSize] = useState<"225" | "272">("272");

  const [wirasatWidows, setWirasatWidows] = useState<string>("1");
  const [wirasatFatherAlive, setWirasatFatherAlive] = useState<boolean>(true);
  const [wirasatMotherAlive, setWirasatMotherAlive] = useState<boolean>(true);
  const [wirasatHusbandAlive, setWirasatHusbandAlive] = useState<boolean>(false);
  const [wirasatSons, setWirasatSons] = useState<string>("1");
  const [wirasatDaughters, setWirasatDaughters] = useState<string>("0");
  const [wirasatBrothers, setWirasatBrothers] = useState<string>("0");
  const [wirasatSisters, setWirasatSisters] = useState<string>("0");
  const [wirasatGrandsons, setWirasatGrandsons] = useState<string>("0");
  const [wirasatMode, setWirasatMode] = useState<"basic" | "advanced">("basic");

  type WirasatRow = {
    relation: string;
    shareLabel: string;
    areaSqFtRaw: number;
    areaSqFtRounded: number;
    kanal: number;
    marla: number;
    feet: number;
  };

  const [wirasatRows, setWirasatRows] = useState<WirasatRow[]>([]);
  const [wirasatTotalSqFt, setWirasatTotalSqFt] = useState<number | null>(null);
  const [wirasatError, setWirasatError] = useState<string | null>(null);

  // --- Mutation Inventory State ---
  type InventoryItem = {
    id: string | null;
    file: string;
    folder: string;
    source: string;
    status: "valid" | "stripped" | "no-match";
    fileObject?: File;
  };
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isInventoryScanning, setIsInventoryScanning] = useState(false);
  const isInventoryScanningRef = useRef<boolean>(false);
  const [inventoryProgress, setInventoryProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const inventoryInputRef = useRef<HTMLInputElement | null>(null);

  // Inventory table UI helpers
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<"all" | "valid" | "no-match" | "stripped">(
    "all",
  );
  const [inventoryFolderFilter, setInventoryFolderFilter] = useState<string>("all");
  const [inventoryIdMin, setInventoryIdMin] = useState<string>("");
  const [inventoryIdMax, setInventoryIdMax] = useState<string>("");
  const [inventorySortBy, setInventorySortBy] = useState<"id" | "file" | "status" | "folder">("id");
  const [inventorySortDir, setInventorySortDir] = useState<"asc" | "desc">("asc");
  type InventoryFilterPreset = {
    id: string;
    name: string;
    search: string;
    status: "all" | "valid" | "no-match" | "stripped";
    folder: string;
    idMin: string;
    idMax: string;
  };
  const [inventoryFilterPresets, setInventoryFilterPresets] = useState<InventoryFilterPreset[]>([]);
  const [activeInventoryPresetId, setActiveInventoryPresetId] = useState<string | null>(null);
  const [selectedMutationId, setSelectedMutationId] = useState<string | null>(null);
  const [inventoryGroupOpen, setInventoryGroupOpen] = useState<Record<string, boolean>>({});

  // Golden Key (XMP:DocumentNo) utilities
  const [missingListInput, setMissingListInput] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<{
    matched: string[];
    stillMissing: string[];
  } | null>(null);
  const [showCompressedStillMissing, setShowCompressedStillMissing] = useState<boolean>(false);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [cloneProgress, setCloneProgress] = useState<number>(0);

  // --- Server Sync (LRMIS bridge) state ---
  type ConnectionStatus = "disconnected" | "connecting" | "live";

  const safeLocalStorageGet = (key: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    try {
      const value = window.localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [serverIp, setServerIp] = useState<string>(() => safeLocalStorageGet("adiarc_sql_server", "192.125.6.11"));
  const [port, setPort] = useState<string>(() => safeLocalStorageGet("adiarc_sql_port", "1433"));
  const [databaseName, setDatabaseName] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_database", "Judiya_Pur"),
  );
  const [dbUser, setDbUser] = useState<string>(() => safeLocalStorageGet("adiarc_sql_user", "sa"));
  const [dbPassword, setDbPassword] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_password", "justice@123"),
  );
  const [encrypt, setEncrypt] = useState<boolean>(() => safeLocalStorageGet("adiarc_sql_encrypt", "false") === "true");
  const [trustServerCertificate, setTrustServerCertificate] = useState<boolean>(() =>
    safeLocalStorageGet("adiarc_sql_trustcert", "true") === "true",
  );
  const [connectionTimeout, setConnectionTimeout] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_timeout", "15000"),
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [isSyncingToServer, setIsSyncingToServer] = useState<boolean>(false);
  const [lastConnectionMessage, setLastConnectionMessage] = useState<string | null>(null);
  // Local OCR Detective (image text scanning) state
  type OcrResult = {
    mutationNumber: string;
    fileName: string;
    confidence?: number;
  };

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

  const { toast } = useToast();

  // --- Golden Key helpers ---
  const handleCopyGoldenKeyIds = async (goldenKeySummary: { id: string; count: number; files: string[] }[]) => {
    if (!goldenKeySummary.length) {
      toast({
        title: "No IDs to copy",
        description: "Run an inventory scan first to extract XMP:DocumentNo mutation numbers.",
      });
      return;
    }

    const text = goldenKeySummary.map((row) => row.id).join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied mutation IDs",
        description: `${goldenKeySummary.length} XMP:DocumentNo IDs copied to clipboard.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Your browser blocked clipboard access. Please copy manually.",
      });
    }
  };

  const handleCompareMissingWithGolden = (goldenKeySummary: { id: string; count: number; files: string[] }[]) => {
    if (!missingListInput.trim()) {
      toast({
        title: "Add missing numbers first",
        description: "Paste or type the list of missing mutation numbers you want to verify.",
      });
      return;
    }

    if (!goldenKeySummary.length) {
      toast({
        title: "No XMP numbers available",
        description: "Run an inventory scan to extract XMP:DocumentNo mutation numbers first.",
      });
      return;
    }

    const rawTokens = missingListInput
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Allow users to enter ranges like "12-17" as well as single numbers
    const expandedTokens: string[] = [];
    rawTokens.forEach((token) => {
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
          for (let n = start; n <= end; n++) {
            expandedTokens.push(String(n));
          }
          return;
        }
      }
      expandedTokens.push(token);
    });

    const uniqueInput = Array.from(new Set(expandedTokens));
    const goldenIds = new Set(goldenKeySummary.map((row) => row.id));

    const matched: string[] = [];
    const stillMissing: string[] = [];

    uniqueInput.forEach((id) => {
      if (goldenIds.has(id)) {
        matched.push(id);
      } else {
        stillMissing.push(id);
      }
    });

    setComparisonResult({ matched, stillMissing });

    toast({
      title: "Comparison complete",
      description: `${matched.length} numbers found in XMP:DocumentNo, ${stillMissing.length} still missing.`,
    });
  };

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

  const toTotalSqFt = (kanal: number, marla: number, feet: number, marlaSize: number) => {
    return kanal * 20 * marlaSize + marla * marlaSize + feet;
  };

  const fromSqFt = (
    areaSqFt: number,
    marlaSize: number,
  ): { kanal: number; marla: number; feet: number; areaSqFtRounded: number } => {
    const rounded = Math.round(areaSqFt);
    const totalMarlas = Math.floor(rounded / marlaSize);
    const feet = rounded - totalMarlas * marlaSize;
    const kanal = Math.floor(totalMarlas / 20);
    const marla = totalMarlas - kanal * 20;
    return { kanal, marla, feet, areaSqFtRounded: rounded };
  };

  type WirasatMode = "basic" | "advanced";

  type WirasatInputs = {
    totalSqFt: number;
    marlaSize: number;
    widows: number;
    husbandAlive: boolean;
    fatherAlive: boolean;
    motherAlive: boolean;
    sons: number;
    daughters: number;
    brothers: number;
    sisters: number;
    grandsons: number;
    mode: WirasatMode;
  };

  type WirasatCalculationResult = {
    rows: WirasatRow[];
    targetTotal: number;
    error?: string;
  };

  const calculateWirasatShares = (inputs: WirasatInputs): WirasatCalculationResult => {
    const {
      totalSqFt,
      marlaSize,
      widows,
      husbandAlive,
      fatherAlive,
      motherAlive,
      sons,
      daughters,
      brothers,
      sisters,
      grandsons,
      mode,
    } = inputs;

    if (totalSqFt <= 0) {
      return { rows: [], targetTotal: 0, error: "Total area must be greater than zero." };
    }

    const rows: WirasatRow[] = [];

    const hasDescendants = sons > 0 || daughters > 0 || grandsons > 0;
    const hasSiblings = brothers > 0 || sisters > 0;

    // --- Step A: Spouse & parents base shares ---
    if (widows > 0 && husbandAlive) {
      return {
        rows: [],
        targetTotal: 0,
        error: "Invalid spouse configuration: choose either widows (wives) OR a husband, not both.",
      };
    }

    let spouseTotalShare = 0;
    let widowIndividualShare = 0;

    if (widows > 0) {
      // Deceased is male; wives (widows) inherit collectively
      spouseTotalShare = hasDescendants ? totalSqFt / 8 : totalSqFt / 4;
      widowIndividualShare = spouseTotalShare / widows;
    } else if (husbandAlive) {
      // Deceased is female; husband inherits
      spouseTotalShare = hasDescendants ? totalSqFt / 4 : totalSqFt / 2;
    }

    // Mother share: 1/6 if children or siblings, otherwise 1/3 (advanced fiqh rule)
    let motherShare = 0;
    if (motherAlive) {
      if (hasDescendants || hasSiblings) {
        motherShare = totalSqFt / 6;
      } else {
        motherShare = mode === "advanced" ? totalSqFt / 3 : totalSqFt / 6;
      }
    }

    // Father share setup
    let fatherShare = 0;
    if (fatherAlive) {
      if (hasDescendants) {
        // With descendants, father is a sharer with 1/6 (as in basic mode)
        fatherShare = totalSqFt / 6;
      } else {
        // Without descendants, in our simplified model father will take residue after spouse + mother (advanced mode)
        fatherShare = 0;
      }
    }

    // Spouse rows
    if (widows > 0) {
      if (widows === 1) {
        rows.push({
          relation: "Widow",
          shareLabel: hasDescendants ? "1/8" : "1/4",
          areaSqFtRaw: spouseTotalShare,
          areaSqFtRounded: 0,
          kanal: 0,
          marla: 0,
          feet: 0,
        });
      } else {
        for (let i = 0; i < widows; i++) {
          rows.push({
            relation: `Widow ${i + 1}`,
            shareLabel: `${hasDescendants ? "1/8" : "1/4"} ÷ ${widows}`,
            areaSqFtRaw: widowIndividualShare,
            areaSqFtRounded: 0,
            kanal: 0,
            marla: 0,
            feet: 0,
          });
        }
      }
    } else if (husbandAlive) {
      rows.push({
        relation: "Husband",
        shareLabel: hasDescendants ? "1/4" : "1/2",
        areaSqFtRaw: spouseTotalShare,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });
    }

    if (motherAlive && motherShare > 0) {
      rows.push({
        relation: "Mother",
        shareLabel: hasDescendants || hasSiblings ? "1/6" : mode === "advanced" ? "1/3" : "1/6",
        areaSqFtRaw: motherShare,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });
    }

    if (fatherAlive && fatherShare > 0) {
      rows.push({
        relation: "Father",
        shareLabel: "1/6",
        areaSqFtRaw: fatherShare,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });
    }

    // --- Step B: Branching logic ---
    if (mode === "basic") {
      const widowsCount = widows;
      const sonsCount = sons;
      const daughtersCount = daughters;

      const baseForBasic = spouseTotalShare + motherShare + fatherShare;

      if (sonsCount > 0) {
        // Scenario 1: Sons present
        const usedBase = baseForBasic;
        const remainder = totalSqFt - usedBase;

        if (remainder < 0) {
          return { rows: [], targetTotal: 0, error: "Base shares exceed total area. Please review inputs." };
        }

        if (remainder > 0 && (sonsCount > 0 || daughtersCount > 0)) {
          const totalChildUnits = sonsCount * 2 + daughtersCount * 1;

          if (totalChildUnits <= 0) {
            return { rows: [], targetTotal: 0, error: "Children count is invalid for distribution." };
          }

          const singleUnitValue = remainder / totalChildUnits;
          const sonShare = singleUnitValue * 2;
          const daughterShare = singleUnitValue * 1;

          for (let i = 0; i < sonsCount; i++) {
            rows.push({
              relation: sonsCount === 1 ? "Son" : `Son ${i + 1}`,
              shareLabel: `Asaba ${2}/${totalChildUnits}`,
              areaSqFtRaw: sonShare,
              areaSqFtRounded: 0,
              kanal: 0,
              marla: 0,
              feet: 0,
            });
          }

          for (let i = 0; i < daughtersCount; i++) {
            rows.push({
              relation: daughtersCount === 1 ? "Daughter" : `Daughter ${i + 1}`,
              shareLabel: `Asaba ${1}/${totalChildUnits}`,
              areaSqFtRaw: daughterShare,
              areaSqFtRounded: 0,
              kanal: 0,
              marla: 0,
              feet: 0,
            });
          }
        }
      } else if (daughtersCount > 0) {
        // Scenario 2: No sons, only daughters
        let daughtersFixedShare = 0;
        let daughtersFractionLabel = "";

        if (daughtersCount === 1) {
          daughtersFixedShare = totalSqFt / 2; // 1/2
          daughtersFractionLabel = "1/2";
        } else {
          daughtersFixedShare = (2 * totalSqFt) / 3; // 2/3
          daughtersFractionLabel = "2/3";
        }

        const perDaughterFixed = daughtersFixedShare / daughtersCount;

        for (let i = 0; i < daughtersCount; i++) {
          rows.push({
            relation: daughtersCount === 1 ? "Daughter" : `Daughter ${i + 1}`,
            shareLabel: daughtersCount === 1 ? "1/2" : `2/3 ÷ ${daughtersCount}`,
            areaSqFtRaw: perDaughterFixed,
            areaSqFtRounded: 0,
            kanal: 0,
            marla: 0,
            feet: 0,
          });
        }

        const usedBase = spouseTotalShare + motherShare + fatherShare + daughtersFixedShare;
        let residue = totalSqFt - usedBase;

        if (residue < 0) {
          return { rows: [], targetTotal: 0, error: "Fixed shares exceed total area. Please review inputs." };
        }

        if (fatherAlive && residue > 0) {
          // Father takes residue in addition to his initial 1/6
          const updatedFatherShare = fatherShare + residue;

          const fatherRowIndex = rows.findIndex((r) => r.relation === "Father");
          if (fatherRowIndex !== -1) {
            rows[fatherRowIndex] = {
              ...rows[fatherRowIndex],
              shareLabel: "1/6 + residue",
              areaSqFtRaw: updatedFatherShare,
            };
          } else {
            rows.push({
              relation: "Father",
              shareLabel: "1/6 + residue",
              areaSqFtRaw: updatedFatherShare,
              areaSqFtRounded: 0,
              kanal: 0,
              marla: 0,
              feet: 0,
            });
          }

          residue = 0;
        }

        if (!fatherAlive && residue > 0) {
          rows.push({
            relation: "Residuary / Collaterals (Asaba)",
            shareLabel: "Remaining balance",
            areaSqFtRaw: residue,
            areaSqFtRounded: 0,
            kanal: 0,
            marla: 0,
            feet: 0,
          });
        }
      }

      if (!rows.length) {
        return {
          rows: [],
          targetTotal: 0,
          error: "No distributable shares were calculated. Please review the inputs.",
        };
      }

      return { rows, targetTotal: Math.round(totalSqFt) };
    }

    // --- Advanced mode ---
    const widowsCount = widows;
    const sonsCount = sons;
    const daughtersCount = daughters;
    const brothersCount = brothers;
    const sistersCount = sisters;

    // Children present (sons or daughters) -> reuse basic children logic
    if (sonsCount > 0 || daughtersCount > 0) {
      const basicResult = calculateWirasatShares({
        totalSqFt,
        marlaSize,
        widows,
        husbandAlive,
        fatherAlive,
        motherAlive,
        sons,
        daughters,
        brothers: 0,
        sisters: 0,
        grandsons,
        mode: "basic",
      });

      if (basicResult.error) {
        return basicResult;
      }

      return { ...basicResult, targetTotal: Math.round(totalSqFt) };
    }

    // No sons/daughters, but grandsons present (from sons)
    if (grandsons > 0) {
      // For safety, we currently do not auto-calculate exact shares for grandsons.
      // We still show a row explaining this.
      const usedSharers = spouseTotalShare + motherShare;
      const residue = totalSqFt - usedSharers;

      if (residue < 0) {
        return { rows: [], targetTotal: 0, error: "Base shares exceed total area. Please review inputs." };
      }

      rows.push({
        relation: "Grandsons (via sons)",
        shareLabel: "Not auto-calculated – consult scholar for exact shares",
        areaSqFtRaw: residue,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });

      return { rows, targetTotal: Math.round(totalSqFt) };
    }

    // No children, no grandsons
    const usedBySpouseAndMother = spouseTotalShare + motherShare;

    if (fatherAlive) {
      // Father takes entire residue after spouse + mother; siblings are blocked.
      const residue = totalSqFt - usedBySpouseAndMother;
      if (residue < 0) {
        return { rows: [], targetTotal: 0, error: "Base shares exceed total area. Please review inputs." };
      }

      rows.push({
        relation: "Father",
        shareLabel: "Residue (Asaba)",
        areaSqFtRaw: residue,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });

      return { rows, targetTotal: Math.round(totalSqFt) };
    }

    // Father is dead, siblings may receive residue
    const residueAfterSpouseAndMother = totalSqFt - usedBySpouseAndMother;

    if (residueAfterSpouseAndMother < 0) {
      return { rows: [], targetTotal: 0, error: "Base shares exceed total area. Please review inputs." };
    }

    if (brothersCount > 0 || sistersCount > 0) {
      const totalUnits = brothersCount * 2 + sistersCount;
      if (totalUnits <= 0) {
        return { rows: [], targetTotal: 0, error: "Sibling count is invalid for distribution." };
      }

      const unitValue = residueAfterSpouseAndMother / totalUnits;
      const brotherShare = unitValue * 2;
      const sisterShare = unitValue * 1;

      for (let i = 0; i < brothersCount; i++) {
        rows.push({
          relation: brothersCount === 1 ? "Brother" : `Brother ${i + 1}`,
          shareLabel: `Asaba ${2}/${totalUnits}`,
          areaSqFtRaw: brotherShare,
          areaSqFtRounded: 0,
          kanal: 0,
          marla: 0,
          feet: 0,
        });
      }

      for (let i = 0; i < sistersCount; i++) {
        rows.push({
          relation: sistersCount === 1 ? "Sister" : `Sister ${i + 1}`,
          shareLabel: `Asaba ${1}/${totalUnits}`,
          areaSqFtRaw: sisterShare,
          areaSqFtRounded: 0,
          kanal: 0,
          marla: 0,
          feet: 0,
        });
      }

      return { rows, targetTotal: Math.round(totalSqFt) };
    }

    // No children, no father, no siblings -> residue to generic collaterals
    if (residueAfterSpouseAndMother > 0) {
      rows.push({
        relation: "Residuary / Collaterals (Asaba)",
        shareLabel: "Remaining balance",
        areaSqFtRaw: residueAfterSpouseAndMother,
        areaSqFtRounded: 0,
        kanal: 0,
        marla: 0,
        feet: 0,
      });

      return { rows, targetTotal: Math.round(totalSqFt) };
    }

    return {
      rows: [],
      targetTotal: Math.round(totalSqFt),
      error: "This heir combination is not fully supported in this version. Please consult a scholar.",
    };
  };
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

  // --- Fetch mutation numbers tab helpers ---
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

  const handleInventoryScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsInventoryScanning(true);
    isInventoryScanningRef.current = true;
    setInventoryItems([]);
    setSelectedMutationId(null);

    // Filter for images
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/") || /\.(jpg|jpeg|png|tif|tiff)$/i.test(file.name),
    );

    setInventoryProgress({ current: 0, total: imageFiles.length });

    const newItems: InventoryItem[] = [];
    const chunkSize = 10; // Process in small chunks to prevent freezing

    for (let i = 0; i < imageFiles.length; i += chunkSize) {
      if (!isInventoryScanningRef.current) {
        break;
      }

      const chunk = imageFiles.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (file) => {
          if (!isInventoryScanningRef.current) return;

          try {
            const tags = await ExifReader.load(file, { expanded: true });
            const folder = (file as any).webkitRelativePath
              ? (file as any).webkitRelativePath.split("/").slice(0, -1).join("/") || "(root)"
              : "(unknown)";

            // Health Check
            if (Object.keys(tags).length < 2) {
              newItems.push({ id: null, file: file.name, folder, source: "-", status: "stripped", fileObject: file });
              return;
            }

            // USE THE NEW EXTRACTOR
            const findings = extractMutationNumber(tags);

            if (findings.length > 0) {
              // Prefer the "Golden Key" (⭐) if available
              const bestMatch = findings.find((f) => f.source.includes("⭐")) || findings[0];

              newItems.push({
                id: bestMatch.number,
                file: file.name,
                folder,
                source: bestMatch.source,
                status: "valid",
                fileObject: file,
              });
            } else {
              newItems.push({ id: null, file: file.name, folder, source: "-", status: "no-match", fileObject: file });
            }
          } catch (err) {
            newItems.push({
              id: null,
              file: file.name,
              folder: "(unknown)",
              source: "Read Error",
              status: "stripped",
              fileObject: file,
            });
          }
        }),
      );

      // Update State
      setInventoryItems((prev) => [...prev, ...newItems.slice(prev.length)]);
      setInventoryProgress({ current: Math.min(i + chunkSize, imageFiles.length), total: imageFiles.length });
      await new Promise((r) => setTimeout(r, 0));
    }

    isInventoryScanningRef.current = false;
    setIsInventoryScanning(false);
  };

  const handleInventoryScanCancel = () => {
    if (!isInventoryScanningRef.current) return;
    isInventoryScanningRef.current = false;
    setIsInventoryScanning(false);
    toast({
      title: "Scan cancellation requested",
      description: "Finishing the current batch, then the folder scan will stop.",
    });
  };

  const downloadBlob = (filename: string, mimeType: string, content: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadInventory = (format: "csv" | "json") => {
    const rows = filteredInventoryItems;
    if (!rows.length) {
      toast({
        title: "No inventory data",
        description: "Run a scan first or adjust your filters to include some rows.",
      });
      return;
    }

    if (format === "csv") {
      const header = "Mutation ID,File Name,Source Field,Status\n";
      const body = rows
        .map((item) => `${item.id ?? ""},${item.file},"${item.source}",${item.status}`)
        .join("\n");
      downloadBlob("mutation_inventory.csv", "text/csv", header + body);
    } else {
      const json = JSON.stringify(rows, null, 2);
      downloadBlob("mutation_inventory.json", "application/json", json);
    }

    toast({
      title: "Inventory export started",
      description: `Exported ${rows.length} rows from the current table view.`,
    });
  };

  const handleSaveServerConfig = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("adiarc_sql_server", serverIp.trim());
        window.localStorage.setItem("adiarc_sql_port", port.trim());
        window.localStorage.setItem("adiarc_sql_database", databaseName.trim());
        window.localStorage.setItem("adiarc_sql_user", dbUser.trim());
        window.localStorage.setItem("adiarc_sql_password", dbPassword.trim());
        window.localStorage.setItem("adiarc_sql_encrypt", String(encrypt));
        window.localStorage.setItem("adiarc_sql_trustcert", String(trustServerCertificate));
        window.localStorage.setItem("adiarc_sql_timeout", connectionTimeout.trim());
      }
      toast({
        title: "Configuration saved",
        description: "SQL Server connection details stored in this browser.",
      });
    } catch {
      toast({
        title: "Unable to save configuration",
        description: "Your browser blocked access to local storage.",
        variant: "destructive",
      });
    }
  };

  const handleTestServerConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("connecting");
    setLastConnectionMessage(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "test",
          serverIp,
          port,
          dbName: databaseName,
          dbUser,
          dbPassword,
          encrypt,
          trustServerCertificate,
          connectionTimeout,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus("live");
        setLastConnectionMessage(`✅ ${result.message}`);
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        setConnectionStatus("disconnected");
        setLastConnectionMessage(`❌ ${result.error}`);
        toast({
          title: "Connection Test Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus("disconnected");
      const message = "Network Error: Could not reach the API route.";
      setLastConnectionMessage(`❌ ${message}`);
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncToServer = async () => {
    const validItems = inventoryItems.filter((i) => i.status === "valid" && i.id && i.file);
    if (validItems.length === 0) {
      toast({ title: "Nothing to sync", description: "No valid mutation items to upload." });
      return;
    }

    setIsSyncingToServer(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upload",
          serverIp,
          port,
          dbName: databaseName,
          dbUser,
          dbPassword,
          encrypt,
          trustServerCertificate,
          connectionTimeout,
          mutations: validItems.map((item) => ({ id: item.id, file: item.file })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Sync Complete", description: `Uploaded ${result.count} new records successfully.` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncingToServer(false);
    }
  };

  const handleDownloadGoldenKey = (format: "csv" | "json", data: { id: string; count: number; files: string[] }[]) => {
    if (!data.length) {
      toast({
        title: "No XMP numbers",
        description: "Run an inventory scan first to extract XMP:DocumentNo mutation numbers.",
      });
      return;
    }

    if (format === "csv") {
      const header = "Mutation ID,File Count,Files\n";
      const body = data
        .map((row) => `${row.id},${row.count},"${row.files.join("; ")}"`)
        .join("\n");
      downloadBlob("xmp_documentno_summary.csv", "text/csv", header + body);
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadBlob("xmp_documentno_summary.json", "application/json", json);
    }

    toast({
      title: "XMP summary export started",
      description: `Exported ${data.length} official XMP:DocumentNo IDs.`,
    });
  };

  const handleDownloadComparison = (format: "csv" | "json") => {
    if (!comparisonResult) {
      toast({
        title: "No comparison data",
        description: "Paste your missing list and run a comparison first.",
      });
      return;
    }

    const { matched, stillMissing } = comparisonResult;

    if (format === "csv") {
      const header = "Status,Mutation ID\n";
      const matchedRows = matched.map((id) => `Found in XMP,${id}`).join("\n");
      const missingRows = stillMissing.map((id) => `Still missing,${id}`).join("\n");
      const body = [matchedRows, missingRows].filter(Boolean).join("\n");
      downloadBlob("mutation_comparison.csv", "text/csv", header + body);
    } else {
      const json = JSON.stringify({ matched, stillMissing }, null, 2);
      downloadBlob("mutation_comparison.json", "application/json", json);
    }

    toast({
      title: "Comparison export started",
      description: "Your comparison results file is being downloaded.",
    });
  };

  const handleCloneMatchedImages = async () => {
    if (!comparisonResult) {
      toast({
        title: "No comparison data",
        description: "Paste your missing list and run a comparison first.",
      });
      return;
    }

    const { matched } = comparisonResult;
    if (!matched.length) {
      toast({
        title: "No matches to clone",
        description: "None of the missing IDs were found in the XMP list.",
      });
      return;
    }

    const matchedSet = new Set(matched);
    const filesToClone = inventoryItems.filter(
      (item) => item.status === "valid" && item.id && matchedSet.has(item.id) && item.fileObject,
    );

    if (!filesToClone.length) {
      toast({
        title: "No image files available",
        description: "Please rescan the folder in this session, then run the comparison again.",
      });
      return;
    }

    try {
      setIsCloning(true);
      setCloneProgress(0);

      const zip = new JSZip();
      for (const item of filesToClone) {
        if (item.fileObject) {
          const folderLabel = item.folder === "(root)" ? "" : item.folder === "(unknown)" ? "unknown" : item.folder;
          const zipPath = folderLabel ? `${folderLabel}/${item.file}` : item.file;
          zip.file(zipPath, item.fileObject);
        }
      }

      const blob = await zip.generateAsync(
        { type: "blob" },
        (metadata) => {
          if (typeof metadata.percent === "number") {
            setCloneProgress(metadata.percent);
          }
        },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cloned_mutations_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Clone download ready",
        description: `${filesToClone.length} images packaged into a ZIP file. Extract it and paste to your desired folder.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clone failed",
        description: "There was a problem preparing the ZIP file in your browser.",
      });
    }
  };

  const inventoryFolders = Array.from(new Set(inventoryItems.map((item) => item.folder))).sort();
  const matchedCloneCount = comparisonResult
    ? (() => {
        const matchedSet = new Set(comparisonResult.matched);
        return inventoryItems.filter(
          (item) => item.status === "valid" && item.id && matchedSet.has(item.id) && item.fileObject,
        ).length;
      })()
    : 0;
  const pendingUploadCount = inventoryItems.filter((item) => item.status === "valid").length;

  const filteredInventoryItems = (() => {
    const term = inventorySearch.trim().toLowerCase();
    const minId = inventoryIdMin ? Number(inventoryIdMin) : null;
    const maxId = inventoryIdMax ? Number(inventoryIdMax) : null;

    const base = inventoryItems.filter((item) => {
      const matchesStatus = inventoryStatusFilter === "all" || item.status === inventoryStatusFilter;
      const matchesFolder = inventoryFolderFilter === "all" || item.folder === inventoryFolderFilter;

      if (!matchesStatus || !matchesFolder) return false;

      const inId = (item.id || "").toLowerCase().includes(term);
      const inFile = item.file.toLowerCase().includes(term);
      const inSource = item.source.toLowerCase().includes(term);
      const textMatch = !term || inId || inFile || inSource;

      if (!textMatch) return false;

      if (minId !== null || maxId !== null) {
        const numericId = item.id ? Number(item.id) : NaN;
        if (!Number.isFinite(numericId)) return false;
        if (minId !== null && numericId < minId) return false;
        if (maxId !== null && numericId > maxId) return false;
      }

      return true;
    });

    const sorted = [...base].sort((a, b) => {
      const dir = inventorySortDir === "asc" ? 1 : -1;
      const getKey = (item: InventoryItem) => {
        switch (inventorySortBy) {
          case "file":
            return item.file.toLowerCase();
          case "status":
            return item.status;
          case "folder":
            return item.folder.toLowerCase();
          case "id":
          default:
            return (item.id || "").toLowerCase();
        }
      };
      const aKey = getKey(a);
      const bKey = getKey(b);
      if (aKey < bKey) return -1 * dir;
      if (aKey > bKey) return 1 * dir;
      return 0;
    });

    return sorted;
  })();

  const groupedInventory = filteredInventoryItems.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const key = item.id || "⟂ No DocumentNo";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // --- Local OCR Detective helpers ---
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

  // --- Partitions (Wirasat) helpers ---

  const handleCalculatePartitions = () => {
    setWirasatError(null);
    setWirasatRows([]);
    setWirasatTotalSqFt(null);

    const marlaSize = Number(wirasatMarlaSize);
    const kanal = Number(wirasatKanal) || 0;
    const marla = Number(wirasatMarla) || 0;
    const feet = Number(wirasatFeet) || 0;

    if (kanal < 0 || marla < 0 || feet < 0) {
      setWirasatError("Area values cannot be negative.");
      return;
    }

    const totalSqFt = toTotalSqFt(kanal, marla, feet, marlaSize);

    const widowsCount = Math.max(0, Number(wirasatWidows) || 0);
    const sonsCount = Math.max(0, Number(wirasatSons) || 0);
    const daughtersCount = Math.max(0, Number(wirasatDaughters) || 0);
    const brothersCount = Math.max(0, Number(wirasatBrothers) || 0);
    const sistersCount = Math.max(0, Number(wirasatSisters) || 0);
    const grandsonsCount = Math.max(0, Number(wirasatGrandsons) || 0);

    if (widowsCount > 0 && wirasatHusbandAlive) {
      setWirasatError("Please choose either widows (wives) OR a husband, not both.");
      return;
    }

    if (
      !widowsCount &&
      !wirasatHusbandAlive &&
      !wirasatFatherAlive &&
      !wirasatMotherAlive &&
      !sonsCount &&
      !daughtersCount &&
      !brothersCount &&
      !sistersCount &&
      !grandsonsCount
    ) {
      setWirasatError("Please specify at least one heir.");
      return;
    }

    const calcResult = calculateWirasatShares({
      totalSqFt,
      marlaSize,
      widows: widowsCount,
      husbandAlive: wirasatHusbandAlive,
      fatherAlive: wirasatFatherAlive,
      motherAlive: wirasatMotherAlive,
      sons: sonsCount,
      daughters: daughtersCount,
      brothers: brothersCount,
      sisters: sistersCount,
      grandsons: grandsonsCount,
      mode: wirasatMode,
    });

    if (calcResult.error) {
      setWirasatError(calcResult.error);
      if (!calcResult.rows.length) {
        return;
      }
    }

    let sumRounded = 0;
    const marlaSizeForFormat = marlaSize;
    const formattedRows = calcResult.rows.map((row) => {
      const formatted = fromSqFt(row.areaSqFtRaw, marlaSizeForFormat);
      sumRounded += formatted.areaSqFtRounded;
      return {
        ...row,
        areaSqFtRounded: formatted.areaSqFtRounded,
        kanal: formatted.kanal,
        marla: formatted.marla,
        feet: formatted.feet,
      };
    });

    const targetTotal = Math.round(totalSqFt);
    const diff = targetTotal - sumRounded;

    if (diff !== 0 && formattedRows.length > 0) {
      const adjustIndex = formattedRows.length - 1;
      const row = formattedRows[adjustIndex];
      const adjustedSqFt = row.areaSqFtRounded + diff;
      const formatted = fromSqFt(adjustedSqFt, marlaSizeForFormat);
      formattedRows[adjustIndex] = {
        ...row,
        areaSqFtRounded: formatted.areaSqFtRounded,
        kanal: formatted.kanal,
        marla: formatted.marla,
        feet: formatted.feet,
      };
    }

    setWirasatRows(formattedRows);
    setWirasatTotalSqFt(targetTotal);
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

  const goldenKeySummary = (() => {
    const map = new Map<string, { count: number; files: string[] }>();

    for (const item of inventoryItems) {
      if (item.status === "valid" && item.id && item.source.includes("XMP:DocumentNo")) {
        const existing = map.get(item.id) || { count: 0, files: [] };
        if (!existing.files.includes(item.file)) {
          existing.files.push(item.file);
        }
        existing.count += 1;
        map.set(item.id, existing);
      }
    }

    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }));
  })();

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

          <TabsContent value="find-missing" className="space-y-6 animate-fade-in">
            {/* Coverage summary always visible above both columns */}
            <section className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-xs shadow-sm shadow-primary/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Coverage summary</p>
                  <p className="text-sm font-semibold text-foreground">
                    {coverage !== null ? `${coverage.toFixed(1)}% IDs present in range` : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {gapSeverity === "none"
                      ? "Perfect coverage. No missing IDs."
                      : gapSeverity === "high"
                        ? "Critical gaps detected. Consider investigating missing ranges."
                        : gapSeverity === "medium"
                          ? "Moderate gaps detected across the range."
                          : gapSeverity === "low"
                            ? "Light gaps detected. Coverage is mostly complete."
                            : "Run a scan to see coverage details."}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80">
                    Coverage = present IDs ÷ total IDs in your selected range.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {stats ? stats.missing : "—"}
                    </span>
                    <span>{stats ? `missing of ${stats.total.toLocaleString()}` : "Run a scan to see missing counts"}</span>
                  </div>
                  <div className="inline-flex overflow-hidden rounded-full border border-border bg-card text-[11px]">
                    <button
                      type="button"
                      className={`px-2 py-1 text-[11px] ${useCompressed ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      onClick={() => setUseCompressed(true)}
                    >
                      Compressed
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 text-[11px] ${!useCompressed ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      onClick={() => setUseCompressed(false)}
                    >
                      Full list
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Main two-column layout: Input left, Missing IDs right */}
            <section className="grid gap-8 lg:grid-cols-2 items-stretch animate-enter">
              <Card className="flex h-full flex-col border-border/70 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur-sm hover-scale">
                <CardHeader className="pb-5 border-b border-border/60">
                  <CardTitle className="text-base font-semibold tracking-tight">Input configuration</CardTitle>
                  <CardDescription>Define the numeric window and load your mutation file.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-5 flex-1">
                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start">Range start</Label>
                      <Input
                        id="start"
                        type="number"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Lowest mutation ID to include in the scan.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">Range end</Label>
                      <Input
                        id="end"
                        type="number"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Highest mutation ID to include in the scan.</p>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <Label htmlFor="file">Mutation numbers text file (.txt)</Label>
                    <Input id="file" type="file" accept=".txt" onChange={handleFileChange} />
                    {fileName && <p className="text-sm text-muted-foreground">Loaded file: {fileName}</p>}
                    <p className="text-xs text-muted-foreground">
                      Supports tens of thousands of entries separated by commas, spaces, or new lines.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <Label>Preview of uploaded content</Label>
                    <Textarea
                      readOnly
                      value={fileContent.slice(0, 12000)}
                      placeholder="First part of your uploaded file will appear here (preview is truncated for very large files)."
                      className="h-32 font-mono text-xs"
                    />
                  </section>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border pt-4">
                    <p className="text-xs md:text-[13px] text-muted-foreground max-w-xs">
                      All processing happens locally in your browser. No servers or external APIs are called.
                    </p>
                    <Button
                      type="button"
                      onClick={handleProcess}
                      disabled={isLoading}
                      className="hover-scale px-5 py-2 text-sm font-semibold shadow-md shadow-primary/20"
                    >
                      {isLoading ? "Processing..." : "Find missing numbers"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex h-full flex-col border-dashed border-border/70 bg-card/70 shadow-sm animate-enter">
                <CardHeader className="flex items-start justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Missing IDs</CardTitle>
                    <CardDescription>
                      View missing IDs as compact ranges or a full list within the selected window.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("missing IDs", missingDisplay)}
                      className="h-7 px-3 text-[11px]"
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 px-3 text-[11px]"
                    >
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-dashed border-border/80 bg-muted/40 px-3 py-2 text-center text-[11px] text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">{stats ? stats.total.toLocaleString() : "—"}</p>
                      <p>IDs in range</p>
                    </div>
                    <div>
                      <p className="font-medium text-destructive">{stats ? stats.missing.toLocaleString() : "—"}</p>
                      <p>Missing IDs</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{stats ? stats.present.toLocaleString() : "—"}</p>
                      <p>Present IDs</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <p className="font-medium">Gap distribution across range</p>
                      <span className="text-[10px]">Taller red bars = more missing IDs</span>
                    </div>
                    <div className="h-28 rounded-md border border-border/60 bg-muted/40 px-2 py-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <XAxis dataKey="bucketLabel" hide tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              fontSize: 11,
                            }}
                            formatter={(value: number) => [`${Math.round((value as number) * 1000) / 10}% missing`, "Missing share"]}
                          />
                          <Bar dataKey="missingRatio" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {!stats
                      ? "Run a scan to see missing IDs here."
                      : stats.missing === 0
                        ? "No gaps detected in the selected range. Your coverage is complete."
                        : useCompressed
                          ? "Viewing compressed ranges. Switch to full list to see every missing ID."
                          : "Viewing full list of missing IDs in this range."}
                  </div>

                  <Textarea
                    readOnly
                    value={missingDisplay}
                    placeholder={`After processing, missing numbers will appear here as ${
                      useCompressed ? "compressed ranges (e.g. 20001-20006)" : "a full comma-separated list"
                    }. If there are no missing numbers, you will see 'NONE'.`}
                    className="h-64 font-mono text-xs md:h-72"
                  />
                </CardContent>
              </Card>
            </section>

            {/* Full-width Present IDs section beneath both columns */}
            <section className="animate-enter">
              <Card className="mt-2 border border-border/70 bg-card/80 shadow-md shadow-primary/10">
                <CardHeader className="flex flex-col gap-2 px-4 pb-3 pt-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Present IDs</CardTitle>
                    <CardDescription>
                      All IDs from your file within the selected range, shown as {useCompressed ? "compressed" : "full"} data.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] sm:self-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("present IDs", presentDisplay)}
                      className="h-7 px-3 text-[11px]"
                    >
                      Copy present IDs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    readOnly
                    value={presentDisplay}
                    placeholder={
                      useCompressed
                        ? "After processing, present numbers will appear here as compressed ranges."
                        : "After processing, present numbers will appear here as a full comma-separated list."
                    }
                    className="h-52 font-mono text-xs md:h-60"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use this to verify exactly which IDs from your file are covered in this range, in either compressed or full form.
                  </p>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="fetch-mutations" className="space-y-6 animate-fade-in">
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
          </TabsContent>

          <TabsContent value="wirasat" className="space-y-6 animate-fade-in">
            <Card className="border-border/70 bg-card/80 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Partitions (Wirasat Zabani)</CardTitle>
                <CardDescription>
                  Calculate proposed oral inheritance mutation (Wirasat Zabani) based on Islamic inheritance rules for spouse, parents,
                  children, and (in advanced mode) selected sibling / no-children scenarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="space-y-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-[11px]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">Wirasat mode</p>
                      <p className="text-muted-foreground">
                        Basic mode covers the standard case of spouse, parents, and children. Advanced mode (beta) adds no‑children,
                        siblings, and limited multi‑generation logic.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Basic</span>
                      <Switch
                        id="wirasat-mode"
                        checked={wirasatMode === "advanced"}
                        onCheckedChange={(checked) => setWirasatMode(checked ? "advanced" : "basic")}
                      />
                      <span className="text-[11px] font-medium text-foreground">Advanced (beta)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This calculator is for educational and draft-mutation purposes only. Islamic inheritance is complex; always
                    confirm with a qualified scholar or official instructions before using these numbers in any legal document.
                    Spouse rules differ when the deceased is male vs female — choose either widows (wives) or a husband, not both.
                  </p>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Total area</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="wirasat-kanal" className="text-[11px]">Kanal</Label>
                          <Input
                            id="wirasat-kanal"
                            type="number"
                            min={0}
                            value={wirasatKanal}
                            onChange={(e) => setWirasatKanal(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="wirasat-marla" className="text-[11px]">Marla</Label>
                          <Input
                            id="wirasat-marla"
                            type="number"
                            min={0}
                            value={wirasatMarla}
                            onChange={(e) => setWirasatMarla(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="wirasat-feet" className="text-[11px]">Sq Ft</Label>
                          <Input
                            id="wirasat-feet"
                            type="number"
                            min={0}
                            value={wirasatFeet}
                            onChange={(e) => setWirasatFeet(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        All calculations are performed internally in square feet and then converted back to Kanal / Marla / Sq Ft.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wirasat-marla-size">Marla standard</Label>
                      <Select
                        value={wirasatMarlaSize}
                        onValueChange={(value) => setWirasatMarlaSize(value as "225" | "272")}
                      >
                        <SelectTrigger id="wirasat-marla-size">
                          <SelectValue placeholder="Select marla size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="225">225 Sq Ft (traditional)</SelectItem>
                          <SelectItem value="272">272 Sq Ft (standard)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">
                        The selected marla size is used consistently for both calculation and display.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="wirasat-widows" className="text-[11px]">
                        Widows (wives)
                      </Label>
                      <Input
                        id="wirasat-widows"
                        type="number"
                        min={0}
                        value={wirasatWidows}
                        onChange={(e) => setWirasatWidows(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use this when the deceased is male. Wives collectively receive 1/8 with descendants and 1/4 when there are
                        none.
                      </p>
                    </div>
                      <div className="space-y-1">
                        <Label htmlFor="wirasat-sons" className="text-[11px]">Number of sons</Label>
                        <Input
                          id="wirasat-sons"
                          type="number"
                          min={0}
                          value={wirasatSons}
                          onChange={(e) => setWirasatSons(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="wirasat-daughters" className="text-[11px]">Number of daughters</Label>
                        <Input
                          id="wirasat-daughters"
                          type="number"
                          min={0}
                          value={wirasatDaughters}
                          onChange={(e) => setWirasatDaughters(e.target.value)}
                        />
                      </div>
                      {wirasatMode === "advanced" && (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor="wirasat-brothers" className="text-[11px]">Full brothers</Label>
                            <Input
                              id="wirasat-brothers"
                              type="number"
                              min={0}
                              value={wirasatBrothers}
                              onChange={(e) => setWirasatBrothers(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="wirasat-sisters" className="text-[11px]">Full sisters</Label>
                            <Input
                              id="wirasat-sisters"
                              type="number"
                              min={0}
                              value={wirasatSisters}
                              onChange={(e) => setWirasatSisters(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <Label htmlFor="wirasat-grandsons" className="text-[11px]">Grandsons (from sons)</Label>
                            <Input
                              id="wirasat-grandsons"
                              type="number"
                              min={0}
                              value={wirasatGrandsons}
                              onChange={(e) => setWirasatGrandsons(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Grandsons are only considered when there are no sons or daughters. Exact fiqh for these cases varies;
                              treat this output as a draft and confirm with a scholar.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3 rounded-md border border-dashed border-border px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-medium">Father alive</p>
                          <p className="text-muted-foreground">
                            In basic mode, father receives 1/6 (and residue with daughters only). In advanced mode, he may take the
                            full residue when there are no children.
                          </p>
                        </div>
                        <Switch id="wirasat-father" checked={wirasatFatherAlive} onCheckedChange={setWirasatFatherAlive} />
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-2">
                        <div className="space-y-0.5">
                          <p className="font-medium">Mother alive</p>
                          <p className="text-muted-foreground">
                            Mother receives 1/6 when there are children or siblings, and 1/3 in advanced no‑children scenarios.
                          </p>
                        </div>
                        <Switch id="wirasat-mother" checked={wirasatMotherAlive} onCheckedChange={setWirasatMotherAlive} />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-[11px]">
                      <div className="space-y-0.5">
                        <p className="font-medium">Husband alive</p>
                        <p className="text-muted-foreground">
                          Use this when the deceased is female. Husband receives 1/4 with descendants and 1/2 when there are none.
                        </p>
                      </div>
                      <Switch
                        id="wirasat-husband"
                        checked={wirasatHusbandAlive}
                        onCheckedChange={setWirasatHusbandAlive}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-3">
                      <p className="text-[11px] text-muted-foreground max-w-sm">
                        Basic mode: spouse + parents + children (sons/daughters). Advanced mode: adds no‑children cases, father taking
                        residue, and siblings as residuaries when father is deceased.
                      </p>
                      <Button type="button" size="sm" onClick={handleCalculatePartitions}>
                        Calculate partition
                      </Button>
                    </div>

                    {wirasatError && <p className="text-xs text-destructive">{wirasatError}</p>}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Proposed Mutation Details</p>
                      <p className="text-[11px] text-muted-foreground">
                        Shares are shown as approximate fractions and precise square-foot areas with Kanal / Marla / Sq Ft breakdown.
                        Always verify with a scholar for complex family trees.
                      </p>
                    </div>
                    {wirasatTotalSqFt !== null && (
                      <p className="text-[11px] text-muted-foreground">
                        Total area: <span className="font-medium">{wirasatTotalSqFt.toLocaleString()} Sq Ft</span>
                      </p>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-md border border-border bg-card/70">
                    <Table>
                      <TableCaption className="text-[11px]">
                        Verify that the sum of all shares equals the total area. Small rounding adjustments (±1–2 Sq Ft) are applied to
                        the final row automatically. Advanced mode reflects a simplified fiqh model and does not cover every school or
                        rare scenario.
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-40">Relation</TableHead>
                          <TableHead>Share fraction</TableHead>
                          <TableHead className="text-right">Area (Sq Ft)</TableHead>
                          <TableHead className="text-right">Formatted area</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wirasatRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-[12px] text-muted-foreground">
                              Enter area and heirs above, then click
                              <span className="font-medium"> Calculate partition </span>
                              to see proposed mutation details. In advanced mode, double-check especially when there are no children
                              or multiple sibling groups.
                            </TableCell>
                          </TableRow>
                        ) : (
                          wirasatRows.map((row, index) => (
                            <TableRow key={`${row.relation}-${index}`}>
                              <TableCell className="text-sm font-medium">{row.relation}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{row.shareLabel}</TableCell>
                              <TableCell className="text-right text-sm">{row.areaSqFtRounded.toLocaleString()}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {`${row.kanal} Kanal — ${row.marla} Marla — ${row.feet} Sq Ft`}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutation-inventory" className="space-y-6 animate-fade-in">
            <Card className="border-border/70 bg-card/80 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Mutation Inventory Dashboard</CardTitle>
                <CardDescription>
                  Forensic scan of a local folder to inventory all mutation IDs embedded in XMP metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ACTION AREA */}
                <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-[11px]">
                  <div className="space-y-1 max-w-md">
                    <p className="font-medium">Scan a folder of mutation images</p>
                    <p className="text-muted-foreground">
                      AdiARC will inspect XMP metadata for the official LRMIS <code>DocumentNo</code> field and build a clean
                      inventory of mutation numbers.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => inventoryInputRef.current?.click()}
                      disabled={isInventoryScanning}
                      className="inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold shadow-md shadow-primary/20"
                    >
                      {isInventoryScanning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>{isInventoryScanning ? "Scanning folder..." : "Select folder to scan"}</span>
                    </Button>
                    {inventoryItems.some((item) => item.status === "valid") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInventory("csv")}
                      >
                        Download CSV
                      </Button>
                    )}
                  </div>
                  <input
                    ref={inventoryInputRef}
                    type="file"
                    multiple
                    // @ts-ignore - non-standard folder selection attributes
                    webkitdirectory=""
                    // @ts-ignore
                    directory=""
                    className="hidden"
                    onChange={handleInventoryScan}
                  />
                </section>

                {/* PROGRESS BAR */}
                {inventoryProgress.total > 0 && (
                  <section className="space-y-2 rounded-md border border-border bg-card/70 px-3 py-2 text-[11px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-medium">Scan progress</p>
                        <p className="text-muted-foreground">
                          Progress: {Math.round((inventoryProgress.current / inventoryProgress.total) * 100)}% dd
                          {" "}
                          {inventoryProgress.current} / {inventoryProgress.total} files
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={
                        inventoryProgress.total > 0
                          ? (Math.min(inventoryProgress.current, inventoryProgress.total) / inventoryProgress.total) * 100
                          : 0
                      }
                      className="h-1.5"
                    />
                  </section>
                )}

                {/* STATS CARDS */}
                <section className="grid gap-3 md:grid-cols-3 text-[11px]">
                  <Card className="border-border/70 bg-card/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Found IDs</CardTitle>
                      <CardDescription>Total files with a valid DocumentNo value.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold">
                        {inventoryItems.filter((item) => item.status === "valid").length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">No Tag Found</CardTitle>
                      <CardDescription>Files where metadata exists but no DocumentNo was detected.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold">
                        {inventoryItems.filter((item) => item.status === "no-match").length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Stripped Files</CardTitle>
                      <CardDescription>Files with missing or minimal metadata (likely stripped).</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold">
                        {inventoryItems.filter((item) => item.status === "stripped").length}
                      </p>
                    </CardContent>
                  </Card>
                </section>

                {/* DATA TABLE CONTROLS */}
                <section className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Inventory results</p>
                      {inventoryItems.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {inventoryItems.length} files scanned
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] items-end">
                      <Input
                        placeholder="Search by ID, file name, or source..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="h-8 w-52 text-xs"
                      />
                      <Select
                        value={inventoryStatusFilter}
                        onValueChange={(value) =>
                          setInventoryStatusFilter(value as "all" | "valid" | "no-match" | "stripped")
                        }
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="valid">Valid</SelectItem>
                          <SelectItem value="no-match">No Tag</SelectItem>
                          <SelectItem value="stripped">Stripped</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={inventoryFolderFilter}
                        onValueChange={(value) => setInventoryFolderFilter(value)}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All folders</SelectItem>
                          {inventoryFolders.map((folder) => (
                            <SelectItem key={folder} value={folder}>
                              {folder}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-end gap-1 text-[10px]">
                        <div className="space-y-1">
                          <Label htmlFor="inventory-id-min" className="text-[10px]">
                            ID from
                          </Label>
                          <Input
                            id="inventory-id-min"
                            type="number"
                            value={inventoryIdMin}
                            onChange={(e) => setInventoryIdMin(e.target.value)}
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="inventory-id-max" className="text-[10px]">
                            to
                          </Label>
                          <Input
                            id="inventory-id-max"
                            type="number"
                            value={inventoryIdMax}
                            onChange={(e) => setInventoryIdMax(e.target.value)}
                            className="h-8 w-24 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={activeInventoryPresetId ?? ""}
                        onValueChange={(value) => {
                          if (!value) {
                            setActiveInventoryPresetId(null);
                            return;
                          }
                          const preset = inventoryFilterPresets.find((p) => p.id === value);
                          if (!preset) return;
                          setActiveInventoryPresetId(preset.id);
                          setInventorySearch(preset.search);
                          setInventoryStatusFilter(preset.status);
                          setInventoryFolderFilter(preset.folder);
                          setInventoryIdMin(preset.idMin);
                          setInventoryIdMax(preset.idMax);
                        }}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Filter presets" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No preset</SelectItem>
                          {inventoryFilterPresets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => {
                          const name = window.prompt("Preset name", "My filters");
                          if (!name) return;
                          const id = typeof crypto !== "undefined" && "randomUUID" in crypto
                            ? crypto.randomUUID()
                            : String(Date.now());
                          const preset: InventoryFilterPreset = {
                            id,
                            name,
                            search: inventorySearch,
                            status: inventoryStatusFilter,
                            folder: inventoryFolderFilter,
                            idMin: inventoryIdMin,
                            idMax: inventoryIdMax,
                          };
                          setInventoryFilterPresets((prev) => [...prev, preset]);
                          setActiveInventoryPresetId(id);
                        }}
                      >
                        Save preset
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-[11px]"
                        onClick={() => {
                          setInventorySearch("");
                          setInventoryStatusFilter("all");
                          setInventoryFolderFilter("all");
                          setInventoryIdMin("");
                          setInventoryIdMax("");
                          setActiveInventoryPresetId(null);
                        }}
                      >
                        Clear all filters
                      </Button>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-muted-foreground">Sort by</span>
                        <Select
                          value={inventorySortBy}
                          onValueChange={(value) =>
                            setInventorySortBy(value as "id" | "file" | "status" | "folder")
                          }
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">ID</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="folder">Folder</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={inventorySortDir}
                          onValueChange={(value) => setInventorySortDir(value as "asc" | "desc")}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Asc</SelectItem>
                            <SelectItem value="desc">Desc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-card/70">
                    <ScrollArea className="h-80 w-full rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-28">Status</TableHead>
                            <TableHead>Mutation ID</TableHead>
                            <TableHead>Folder</TableHead>
                            <TableHead>File name</TableHead>
                            <TableHead>Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInventoryItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-[12px] text-muted-foreground">
                                {inventoryItems.length === 0
                                  ? "Select a folder above to begin building your mutation inventory."
                                  : "No rows match your current filters. Try clearing the search or status filter."}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredInventoryItems.map((item, index) => (
                              <TableRow
                                key={`${item.file}-${index}`}
                                className={
                                  `cursor-pointer transition-all duration-150 ` +
                                  (selectedMutationId && item.id === selectedMutationId
                                    ? "bg-primary/10 border-l-4 border-primary/80 shadow-sm"
                                    : "bg-background hover:bg-muted/60 hover:-translate-y-px hover:shadow-sm")
                                }
                                onClick={() => {
                                  if (!item.id) return;
                                  setSelectedMutationId((current) => (current === item.id ? null : item.id));
                                }}
                              >
                                <TableCell>
                                  {item.status === "valid" && <Badge variant="outline">Valid</Badge>}
                                  {item.status === "no-match" && <Badge variant="secondary">No Tag</Badge>}
                                  {item.status === "stripped" && <Badge variant="destructive">Stripped</Badge>}
                                </TableCell>
                                <TableCell className="text-sm font-medium">{item.id || "—"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.folder}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{item.file}</TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">{item.source}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </section>

                {/* GOLDEN KEY SUMMARY */}
                <section className="space-y-3 pt-4 border-t border-dashed border-border/70">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Official XMP:DocumentNo numbers</p>
                      <p className="text-[11px] text-muted-foreground">
                        These are the mutation numbers extracted from the authoritative <code>DocumentNo</code> XMP tag.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyGoldenKeyIds(goldenKeySummary)}
                        disabled={goldenKeySummary.length === 0}
                      >
                        Copy all IDs
                      </Button>
                    </div>
                  </div>
                  {goldenKeySummary.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      No official <code>DocumentNo</code> tags detected yet. Run a scan above to see extracted IDs.
                    </p>
                  ) : (
                    <div className="rounded-md border border-border bg-card/70">
                      <ScrollArea className="h-40 w-full rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-32">Mutation ID</TableHead>
                              <TableHead className="w-20 text-right">File count</TableHead>
                              <TableHead>Files</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {goldenKeySummary.map((row) => (
                              <TableRow
                                key={row.id}
                                className={
                                  `cursor-pointer transition-all duration-150 ` +
                                  (selectedMutationId === row.id
                                    ? "bg-primary/10 border-l-4 border-primary/80 shadow-sm"
                                    : "bg-background hover:bg-muted/60 hover:-translate-y-px hover:shadow-sm")
                                }
                                onClick={() =>
                                  setSelectedMutationId((current) => (current === row.id ? null : row.id))
                                }
                              >
                                <TableCell className="text-sm font-medium">{row.id}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{row.count}</TableCell>
                                <TableCell className="text-[11px] text-muted-foreground">{row.files.join(", ")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Missing list comparison */}
                  <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium">Compare with your missing mutation list</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompareMissingWithGolden(goldenKeySummary)}
                          disabled={goldenKeySummary.length === 0}
                        >
                          Run comparison
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          onClick={handleCloneMatchedImages}
                          disabled={!comparisonResult || comparisonResult.matched.length === 0}
                        >
                          Clone them
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Paste the mutation numbers you believe are missing (you can mix single IDs and ranges like
                      <code className="mx-1">5501-5505</code>) separated by spaces, commas, or new lines. We'll highlight which of them
                      actually exist in the official XMP list.
                    </p>
                    <Textarea
                      rows={3}
                      placeholder="e.g. 5501 5502 5503 7108 8001..."
                      value={missingListInput}
                      onChange={(e) => setMissingListInput(e.target.value)}
                      className="h-20 text-xs"
                    />

                    {comparisonResult && (
                      <div className="grid gap-3 border-t border-dashed border-border pt-2 text-[11px]">
                        <div>
                          <p className="font-medium">Found in XMP:DocumentNo ({comparisonResult.matched.length})</p>
                          {comparisonResult.matched.length === 0 ? (
                            <p className="text-muted-foreground">None of the pasted numbers exist in the XMP list.</p>
                          ) : (
                            <p className="break-words text-muted-foreground">{comparisonResult.matched.join(", ")}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">Still missing ({comparisonResult.stillMissing.length})</p>
                            {comparisonResult.stillMissing.length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px]"
                                onClick={() => setShowCompressedStillMissing((prev) => !prev)}
                              >
                                {showCompressedStillMissing ? "Show full list" : "Show compressed ranges"}
                              </Button>
                            )}
                          </div>
                          {comparisonResult.stillMissing.length === 0 ? (
                            <p className="text-muted-foreground">All pasted numbers exist in the XMP list.</p>
                          ) : (
                            <p className="break-words text-muted-foreground">
                              {showCompressedStillMissing
                                ? (() => {
                                    const numeric = comparisonResult.stillMissing
                                      .map((id) => Number(id))
                                      .filter((n) => Number.isFinite(n));
                                    if (!numeric.length) return comparisonResult.stillMissing.join(", ");
                                    return compressRanges(numeric);
                                  })()
                                : comparisonResult.stillMissing.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                 </section>
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="server-sync" className="space-y-6 animate-fade-in">
             <Card className="border-border/70 bg-card/80 shadow-md">
               <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                 <div>
                   <CardTitle className="flex items-center gap-2 text-base font-semibold">
                     <Database className="h-4 w-4 text-primary" />
                     <span>Server Sync (LRMIS Bridge)</span>
                   </CardTitle>
                   <CardDescription>
                     Configure the SQL Server connection used by the legacy desktop app and drive uploads from the browser.
                   </CardDescription>
                 </div>
                 <div className="flex items-center gap-2 text-xs">
                   <Wifi
                     className={
                       connectionStatus === "live"
                         ? "h-4 w-4 text-primary animate-pulse"
                         : connectionStatus === "connecting"
                           ? "h-4 w-4 text-muted-foreground animate-pulse"
                           : "h-4 w-4 text-destructive"
                     }
                   />
                   <Badge
                     variant={connectionStatus === "live" ? "default" : connectionStatus === "connecting" ? "secondary" : "destructive"}
                     className="uppercase tracking-wide"
                   >
                     {connectionStatus === "live"
                       ? "Live"
                       : connectionStatus === "connecting"
                         ? "Connecting"
                         : "Disconnected"}
                   </Badge>
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                 <section className="grid gap-6 md:grid-cols-2 items-start">
                   {/* Left: Connection settings */}
                   <div className="space-y-4 rounded-md border border-border bg-card/70 p-4">
                     <div className="flex items-center justify-between gap-2">
                       <p className="text-sm font-semibold">Connection settings</p>
                       <span className="text-[11px] text-muted-foreground">Stored in this browser only</span>
                     </div>

                     <div className="grid gap-3 sm:grid-cols-2">
                       <div className="space-y-1.5">
                         <Label htmlFor="sql-server-ip" className="flex items-center gap-1 text-xs">
                           <Server className="h-3.5 w-3.5" />
                           <span>Server IP</span>
                         </Label>
                         <Input
                           id="sql-server-ip"
                           value={serverIp}
                           onChange={(e) => setServerIp(e.target.value)}
                           placeholder="192.125.6.11"
                           className="h-8 text-xs"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <Label htmlFor="sql-db-name" className="text-xs">
                           Database name
                         </Label>
                         <Input
                           id="sql-db-name"
                           value={databaseName}
                           onChange={(e) => setDatabaseName(e.target.value)}
                           placeholder="Judiya_Pur"
                           className="h-8 text-xs"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <Label htmlFor="sql-user" className="text-xs">
                           Username
                         </Label>
                         <Input
                           id="sql-user"
                           value={dbUser}
                           onChange={(e) => setDbUser(e.target.value)}
                           placeholder="sa"
                           className="h-8 text-xs"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <Label htmlFor="sql-password" className="flex items-center gap-1 text-xs">
                           <Key className="h-3.5 w-3.5" />
                           <span>Password</span>
                         </Label>                         <Input
                           id="sql-password"
                           type="password"
                           value={dbPassword}
                           onChange={(e) => setDbPassword(e.target.value)}
                           placeholder="justice@123"
                           className="h-8 text-xs"
                         />
                       </div>
                     </div>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                           <Button variant="link" className="p-0 h-auto text-xs">Advanced Connection Settings</Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
                           <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                 <Label htmlFor="sql-port" className="text-xs">Port</Label>
                                 <Input id="sql-port" type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder="1433" className="h-8 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                 <Label htmlFor="sql-timeout" className="text-xs">Timeout (ms)</Label>
                                 <Input id="sql-timeout" type="number" value={connectionTimeout} onChange={(e) => setConnectionTimeout(e.target.value)} placeholder="15000" className="h-8 text-xs" />
                              </div>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Switch id="sql-encrypt" checked={encrypt} onCheckedChange={setEncrypt} />
                              <Label htmlFor="sql-encrypt" className="text-xs">Force Encryption</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                               <Switch id="sql-trust-cert" checked={trustServerCertificate} onCheckedChange={setTrustServerCertificate} />
                               <Label htmlFor="sql-trust-cert" className="text-xs">Trust Self-Signed Cert</Label>
                           </div>
                        </CollapsibleContent>
                      </Collapsible>


                     <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-border">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={handleSaveServerConfig}
                         className="h-8 px-3 text-[11px]"
                         disabled={isTestingConnection || isSyncingToServer}
                       >
                         Save configuration
                       </Button>
                       <Button
                         type="button"
                         size="sm"
                         onClick={handleTestServerConnection}
                         disabled={isTestingConnection}
                         className="h-9 px-4 text-[12px] font-semibold"
                       >
                         {isTestingConnection ? (
                           <span className="inline-flex items-center gap-2">
                             <Loader2 className="h-3.5 w-3.5 animate-spin" />
                             Connecting...
                           </span>
                         ) : (
                           "Test connection"
                         )}
                       </Button>
                     </div>

                     {lastConnectionMessage && (
                       <p className="pt-1 text-[11px] text-muted-foreground">{lastConnectionMessage}</p>
                     )}
                   </div>

                   {/* Right: Sync status */}
                   <div className="space-y-4 rounded-md border border-border bg-card/70 p-4">
                     <div className="flex items-center justify-between gap-2">
                       <div>
                         <p className="text-sm font-semibold">Pending uploads</p>
                         <p className="text-[11px] text-muted-foreground">
                           Valid mutation IDs discovered in the XMP Mutation Inventory tab.
                         </p>
                       </div>
                       <Badge variant="outline" className="text-xs">
                         {pendingUploadCount} pending
                       </Badge>
                     </div>

                     <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px]">
                       <p className="font-medium mb-1">Current configuration snapshot</p>
                       <p className="text-muted-foreground">
                         Server: <span className="font-mono">{serverIp || "—"}:{port || "1433"}</span>
                       </p>
                       <p className="text-muted-foreground">
                         Database: <span className="font-mono">{databaseName || "—"}</span>
                       </p>
                       <p className="text-muted-foreground">
                         User: <span className="font-mono">{dbUser || "—"}</span>
                       </p>
                     </div>

                     <div className="space-y-2">
                       <Button
                         type="button"
                         onClick={handleSyncToServer}
                         disabled={
                           connectionStatus !== "live" || pendingUploadCount === 0 || isSyncingToServer || isTestingConnection
                         }
                         className="w-full justify-center text-[13px] font-semibold"
                       >
                         {isSyncingToServer ? (
                           <span className="inline-flex items-center gap-2">
                             <Loader2 className="h-3.5 w-3.5 animate-spin" />
                             Syncing to server...
                           </span>
                         ) : (
                           "Sync to server"
                         )}
                       </Button>
                       <p className="text-[11px] text-muted-foreground">
                         This web UI only drives the sync workflow. Actual SQL connections are executed by your local server proxy
                         listening on <code>/api/sync</code>.
                       </p>
                     </div>
                   </div>
                 </section>
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="local-ocr" className="space-y-6 animate-fade-in">
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
                                Processing file {ocrProgress.current.toLocaleString()} of {ocrProgress.total.toLocaleString()}...
                                {" "}
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
           </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}


"use client";
import React, { useState, useMemo, useEffect } from "react";
import Draggable from "react-draggable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateWirasatShares, WirasatMode, WirasatRow } from "@/lib/wirasat-calculator";
import { cn } from "@/lib/utils";

// --- Diagram Component ---
const DistributionDiagram = ({ rows, totalAreaFormatted }: { rows: WirasatRow[]; totalAreaFormatted: string }) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const heirGroups = useMemo(() => {
    return {
      parents: rows.filter((r) => r.relation.startsWith("Father") || r.relation.startsWith("Mother")),
      spouses: rows.filter((r) => r.relation.startsWith("Widow") || r.relation.startsWith("Husband")),
      children: rows.filter((r) => r.relation.startsWith("Son") || r.relation.startsWith("Daughter")),
      others: rows.filter(
        (r) => !["Father", "Mother", "Widow", "Husband", "Son", "Daughter"].some((prefix) => r.relation.startsWith(prefix)),
      ),
    };
  }, [rows]);

  const NODE_WIDTH = 120;
  const NODE_HEIGHT = 80;

  useEffect(() => {
    const initialPositions: Record<string, { x: number, y: number }> = {};
    const center = (containerRef.current?.offsetWidth || 800) / 2;
    
    // Parents
    if (heirGroups.parents.length === 1) {
        const parentKey = heirGroups.parents[0].relation;
        initialPositions[parentKey] = { x: center - NODE_WIDTH / 2, y: 0 };
    } else if (heirGroups.parents.length > 1) {
        initialPositions['Father'] = { x: center - NODE_WIDTH - 20, y: 0 };
        initialPositions['Mother'] = { x: center + 20, y: 0 };
    }

    // Deceased & Spouse
    initialPositions['Deceased'] = { x: center - NODE_WIDTH / 2, y: 150 };
     if (heirGroups.spouses.length > 0) {
        heirGroups.spouses.forEach((s, i) => {
             initialPositions[s.relation] = { x: center - NODE_WIDTH - 160, y: 150 + i * (NODE_HEIGHT + 20) };
        });
    }

    // Children
    const childrenAndOthers = [...heirGroups.children, ...heirGroups.others];
    const childrenCount = childrenAndOthers.length;
    const childrenTotalWidth = childrenCount * (NODE_WIDTH + 20) - 20;
    let startX = center - childrenTotalWidth / 2;
    childrenAndOthers.forEach((c) => {
        initialPositions[c.relation] = { x: startX, y: 300 };
        startX += NODE_WIDTH + 20;
    });

    setPositions(initialPositions);
  }, [rows, heirGroups.parents, heirGroups.spouses, heirGroups.children, heirGroups.others]);


  const handleDrag = (e: any, data: any, key: string) => {
    setPositions(prev => ({ ...prev, [key]: { x: data.x, y: data.y } }));
  };

  const getNodeShape = (relation: string) => {
    if (relation.startsWith("Daughter")) return "triangle";
    if (["Mother", "Widow", "Sister"].some(prefix => relation.startsWith(prefix))) return "oval";
    return "square";
  };
  
  const Node = ({ title, area, share, isDeceased = false }: { title: string; area: string; share?: string; isDeceased?: boolean }) => {
    const shape = getNodeShape(title);
    
    const content = (
         <div className="flex flex-col items-center justify-center text-center p-1 w-full h-full">
            <p className="font-semibold text-xs whitespace-nowrap">{title}</p>
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">{area}</p>
            {share && <p className="text-[9px] text-primary font-medium pt-0.5">{share}</p>}
        </div>
    );

    const baseClasses = "relative flex items-center justify-center border-2 shadow-sm bg-background z-10";
    const sizeClasses = `w-[${NODE_WIDTH}px] h-[${NODE_HEIGHT}px]`;

    if (shape === "triangle") {
      return (
         <div className={cn("relative", sizeClasses, isDeceased ? "bg-primary/10 border-primary" : "border-border")}>
            <div 
                className="absolute top-0 left-0 w-full h-full bg-background border-2 border-border" 
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
            />
            <div className="relative z-10 w-full h-full flex items-center justify-center pt-4">{content}</div>
        </div>
      );
    }
    
    const shapeClasses = { oval: "rounded-full", square: "rounded-lg" };

    return <div className={cn(baseClasses, sizeClasses, shapeClasses[shape], isDeceased ? "bg-primary/10 border-primary" : "border-border")}>{content}</div>;
  };
  
    const SvgPath = ({ d, className }: { d: string, className?: string }) => (
        <path d={d} className={cn("stroke-border", className)} strokeWidth="1.5" fill="none" />
    );

    const getElbowPath = (x1: number, y1: number, x2: number, y2: number) => {
        const midY = y1 + (y2 - y1) / 2;
        return `M ${x1},${y1} V ${midY} H ${x2} V ${y2}`;
    };

    const fatherPos = positions['Father'];
    const motherPos = positions['Mother'];
    const spouses = heirGroups.spouses.map(s => ({ ...s, pos: positions[s.relation] }));
    const children = [...heirGroups.children, ...heirGroups.others].map(c => ({ ...c, pos: positions[c.relation] }));
    const deceasedPos = positions['Deceased'];
  
  return (
    <div ref={containerRef} className="relative w-full min-h-[450px] p-4 bg-muted/30 rounded-lg border overflow-hidden">
      {Object.keys(positions).length > 0 && (
        <>
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
              {/* Parent lines */}
              {fatherPos && motherPos && deceasedPos && (
                <>
                  <SvgPath d={`M ${fatherPos.x + NODE_WIDTH / 2},${fatherPos.y + NODE_HEIGHT / 2} H ${motherPos.x + NODE_WIDTH / 2}`} />
                  <SvgPath d={getElbowPath(
                    fatherPos.x + NODE_WIDTH / 2 + (motherPos.x - fatherPos.x)/2, 
                    fatherPos.y + NODE_HEIGHT / 2,
                    deceasedPos.x + NODE_WIDTH / 2,
                    deceasedPos.y + NODE_HEIGHT / 2
                  )} />
                </>
              )}
               {/* Single parent lines */}
              {fatherPos && !motherPos && deceasedPos && (
                <SvgPath d={getElbowPath(fatherPos.x + NODE_WIDTH / 2, fatherPos.y + NODE_HEIGHT / 2, deceasedPos.x + NODE_WIDTH / 2, deceasedPos.y + NODE_HEIGHT / 2)} />
              )}
              {!fatherPos && motherPos && deceasedPos && (
                <SvgPath d={getElbowPath(motherPos.x + NODE_WIDTH / 2, motherPos.y + NODE_HEIGHT / 2, deceasedPos.x + NODE_WIDTH / 2, deceasedPos.y + NODE_HEIGHT / 2)} />
              )}

              {/* Spouse line */}
              {spouses.length > 0 && spouses[0].pos && deceasedPos && (
                <SvgPath d={`M ${spouses[0].pos.x + NODE_WIDTH / 2},${spouses[0].pos.y + NODE_HEIGHT / 2} H ${deceasedPos.x + NODE_WIDTH / 2}`} />
              )}
              
              {/* Children lines */}
                {children.length > 0 && deceasedPos && (
                    <>
                         {children.length > 0 && children[0].pos && children[children.length - 1].pos && (
                           <SvgPath d={`M ${children[0].pos.x + NODE_WIDTH / 2},${deceasedPos.y + NODE_HEIGHT + 40} H ${children[children.length - 1].pos.x + NODE_WIDTH / 2}`} />
                        )}

                        <SvgPath d={`M ${deceasedPos.x + NODE_WIDTH / 2},${deceasedPos.y + NODE_HEIGHT / 2} V ${deceasedPos.y + NODE_HEIGHT + 40}`} />

                        {children.map((child, i) => {
                            if (!child.pos) return null;
                            return (
                                <SvgPath key={i} d={`M ${child.pos.x + NODE_WIDTH / 2},${deceasedPos.y + NODE_HEIGHT + 40} V ${child.pos.y + NODE_HEIGHT / 2}`} />
                            )
                        })}
                    </>
                )}
            </svg>

            {/* Render Nodes */}
            {rows.map(p => {
                 const pos = positions[p.relation];
                 if (!pos) return null;
                 return (
                    <Draggable key={p.relation} position={pos} onDrag={(e, data) => handleDrag(e, data, p.relation)}>
                        <div className="absolute cursor-move z-10" style={{width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px`}}>
                          <Node title={p.relation} area={`${p.kanal}K-${p.marla}M-${p.feet}ft`} share={p.shareLabel} />
                        </div>
                    </Draggable>
                 );
            })}
            {deceasedPos && (
                 <Draggable position={deceasedPos} onDrag={(e, data) => handleDrag(e, data, 'Deceased')}>
                    <div className="absolute cursor-move z-10" style={{width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px`}}>
                      <Node title="Deceased" area={totalAreaFormatted} isDeceased={true} />
                    </div>
                </Draggable>
            )}
        </>
      )}
    </div>
  );
};


export function WirasatTab() {
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
  const [wirasatMode, setWirasatMode] = useState<WirasatMode>("basic");

  const [wirasatRows, setWirasatRows] = useState<WirasatRow[]>([]);
  const [wirasatTotalSqFt, setWirasatTotalSqFt] = useState<number | null>(null);
  const [wirasatError, setWirasatError] = useState<string | null>(null);

  const toTotalSqFt = (kanal: number, marla: number, feet: number, marlaSize: number) => {
    return kanal * 20 * marlaSize + marla * marlaSize + feet;
  };

  const fromSqFt = (
    areaSqFt: number,
    marlaSize: number,
  ): { kanal: number; marla: number; feet: number; areaSqFtRounded: number } => {
    if (isNaN(areaSqFt) || areaSqFt <= 0) {
        return { kanal: 0, marla: 0, feet: 0, areaSqFtRounded: 0 };
    }
    const rounded = Math.round(areaSqFt);
    const totalMarlas = Math.floor(rounded / marlaSize);
    const feet = rounded - totalMarlas * marlaSize;
    const kanal = Math.floor(totalMarlas / 20);
    const marla = totalMarlas - kanal * 20;
    return { kanal, marla, feet, areaSqFtRounded: rounded };
  };
  
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
    if(totalSqFt <= 0) {
       setWirasatError("Total area must be greater than zero.");
       return;
    }


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
  
  const totalAreaFormatted = useMemo(() => {
    const kanal = Number(wirasatKanal) || 0;
    const marla = Number(wirasatMarla) || 0;
    const feet = Number(wirasatFeet) || 0;

    const totalSqFt = toTotalSqFt(kanal, marla, feet, Number(wirasatMarlaSize));
    if (isNaN(totalSqFt) || totalSqFt <= 0) return '0K-0M-0ft';

    const { kanal: fmtK, marla: fmtM, feet: fmtF } = fromSqFt(totalSqFt, Number(wirasatMarlaSize));
    return `${fmtK}K-${fmtM}M-${fmtF}ft`;
  }, [wirasatKanal, wirasatMarla, wirasatFeet, wirasatMarlaSize]);


  return (
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

        <section className="space-y-3 pt-4 border-t border-dashed">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Proposed Mutation Details</p>
              <p className="text-[11px] text-muted-foreground">
                Shares are shown as approximate fractions and precise square-foot areas with Kanal / Marla / Sq Ft breakdown.
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
                      to see proposed mutation details.
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
          
           {wirasatRows.length > 0 && (
                <div className="pt-4 space-y-3">
                     <h3 className="text-sm font-semibold">Distribution Diagram</h3>
                     <DistributionDiagram rows={wirasatRows} totalAreaFormatted={totalAreaFormatted} />
                </div>
            )}
        </section>
      </CardContent>
    </Card>
  );
}

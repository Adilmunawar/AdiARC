
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
import { calculateWirasatShares, WirasatMode, WirasatRow, ChildHeir, fromSqFt } from "@/lib/wirasat-calculator";
import { PlusCircle, Trash2, User, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Diagram Component ---
const DistributionDiagram = ({ rows, totalAreaFormatted, allHeirs }: { rows: WirasatRow[]; totalAreaFormatted: string; allHeirs: any; }) => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  const NODE_WIDTH = 120;
  const NODE_HEIGHT = 60;
  const LEVEL_GAP_Y = 120;
  const SIBLING_GAP_X = 40;

  useEffect(() => {
    const newPositions: Record<string, { x: number, y: number }> = {};
    if (!containerRef.current) return;

    const canvasWidth = containerRef.current.offsetWidth || 800;
    const center = canvasWidth / 2;
    let y = 0;

    // Parents
    const parentNodes = rows.filter(r => r.relation === 'Father' || r.relation === 'Mother');
    if (parentNodes.length === 1) {
        newPositions[parentNodes[0].relation] = { x: center - NODE_WIDTH / 2, y };
    } else if (parentNodes.length > 1) {
        newPositions['Father'] = { x: center - NODE_WIDTH - SIBLING_GAP_X / 2, y };
        newPositions['Mother'] = { x: center + SIBLING_GAP_X / 2, y };
    }

    y += LEVEL_GAP_Y;

    // Deceased & Spouse
    newPositions['Deceased'] = { x: center - NODE_WIDTH / 2, y };
    const spouseNodes = rows.filter(r => r.relation.startsWith('Widow') || r.relation.startsWith('Husband'));
    if (spouseNodes.length > 0) {
        let spouseX = center + NODE_WIDTH / 2 + 60;
        spouseNodes.forEach((node, index) => {
            newPositions[node.relation] = { x: spouseX, y: y + (index * (NODE_HEIGHT + 20))};
        });
    }

    // Children
    y += LEVEL_GAP_Y;
    const childrenRows = rows.filter(r => r.relation.startsWith('Son') || r.relation.startsWith('Daughter') || r.relation.startsWith('Deceased'));
    if (childrenRows.length > 0) {
        const childrenTotalWidth = childrenRows.length * (NODE_WIDTH + SIBLING_GAP_X) - SIBLING_GAP_X;
        let childX = center - childrenTotalWidth / 2;

        childrenRows.forEach(childRow => {
            newPositions[childRow.relation] = { x: childX, y: y };
            
            if (childRow.subRows && childRow.subRows.length > 0) {
                const grandchildY = y + LEVEL_GAP_Y;
                const grandchildrenTotalWidth = childRow.subRows.length * (NODE_WIDTH + SIBLING_GAP_X) - SIBLING_GAP_X;
                let grandchildX = childX + (NODE_WIDTH / 2) - (grandchildrenTotalWidth / 2);

                childRow.subRows.forEach(subRow => {
                    const subKey = `${childRow.relation}-${subRow.relation}`;
                    newPositions[subKey] = { x: grandchildX, y: grandchildY };
                    grandchildX += NODE_WIDTH + SIBLING_GAP_X;
                });
            }
            childX += NODE_WIDTH + SIBLING_GAP_X;
        });
    }
    setPositions(newPositions);
  }, [rows, allHeirs]);


  const handleDrag = (e: any, data: any, key: string) => {
    setPositions(prev => ({ ...prev, [key]: { x: data.x, y: data.y } }));
  };

  const getNodeShape = (relation: string) => {
    if (relation.toLowerCase().includes("daughter")) return "oval";
    if (["mother", "widow", "sister"].some(prefix => relation.toLowerCase().includes(prefix))) return "oval";
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

    const baseClasses = "relative flex items-center justify-center border-2 shadow-sm bg-background";
    const shapeClasses = { oval: "rounded-full", square: "rounded-lg" };

    return <div className={cn(baseClasses, shapeClasses[shape], isDeceased ? "border-amber-500/80 bg-amber-500/10" : "border-border")} style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}>{content}</div>;
  };
  
  const SvgPath = ({ d, className }: { d: string, className?: string }) => (
    <path d={d} className={cn("stroke-border", className)} strokeWidth="1.5" fill="none" />
  );

  const deceasedPos = positions['Deceased'];
  const childrenRows = rows.filter(r => r.relation.startsWith('Son') || r.relation.startsWith('Daughter') || r.relation.startsWith('Deceased'));
  
  return (
    <div ref={containerRef} className="relative w-full min-h-[600px] p-4 bg-muted/30 rounded-lg border overflow-auto">
      {deceasedPos && (
        <>
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
              {(() => {
                const parentNodes = rows.filter(r => r.relation === 'Father' || r.relation === 'Mother').map(r => positions[r.relation]).filter(Boolean);
                if (parentNodes.length > 0) {
                    const parentMidX = parentNodes.reduce((sum, p) => sum + p.x + NODE_WIDTH / 2, 0) / parentNodes.length;
                    const parentY = parentNodes[0].y + NODE_HEIGHT;
                    if (parentNodes.length > 1) {
                         return (
                            <React.Fragment key="parent-lines">
                                <SvgPath d={`M ${parentNodes[0].x + NODE_WIDTH / 2},${parentNodes[0].y + NODE_HEIGHT/2} H ${parentNodes[1].x + NODE_WIDTH / 2}`} />
                                <SvgPath d={`M ${parentMidX},${parentY} V ${deceasedPos.y}`} />
                            </React.Fragment>
                         );
                    }
                    return <SvgPath d={`M ${parentMidX},${parentY} V ${deceasedPos.y}`} />;
                }
                return null;
              })()}

              {rows.filter(r => r.relation.startsWith('Widow') || r.relation.startsWith('Husband')).map(r => positions[r.relation]).filter(Boolean).map((sp, i) => (
                  <SvgPath key={`sp-${i}`} d={`M ${deceasedPos.x},${deceasedPos.y + NODE_HEIGHT / 2} H ${sp.x + NODE_WIDTH}`} />
              ))}

              {childrenRows.map((childRow) => {
                if (childRow.subRows && childRow.subRows.length > 0) {
                  const parentNodePos = positions[childRow.relation];
                  const subRowsPos = childRow.subRows.map(sr => positions[`${childRow.relation}-${sr.relation}`]).filter(Boolean);
                  if (parentNodePos && subRowsPos.length > 0) {
                     const subBusY = parentNodePos.y + LEVEL_GAP_Y * 0.75;
                     const minSubX = Math.min(...subRowsPos.map(p => p.x + NODE_WIDTH/2));
                     const maxSubX = Math.max(...subRowsPos.map(p => p.x + NODE_WIDTH/2));

                     return (
                        <React.Fragment key={`sub-frag-${childRow.relation}`}>
                            <SvgPath d={`M ${parentNodePos.x + NODE_WIDTH / 2},${parentNodePos.y + NODE_HEIGHT} V ${subBusY}`} className="stroke-dashed" />
                            <SvgPath d={`M ${minSubX},${subBusY} H ${maxSubX}`} className="stroke-dashed" />
                            {subRowsPos.map((srPos, subIndex) => (
                               <SvgPath key={`sub-line-${subIndex}`} d={`M ${srPos.x + NODE_WIDTH / 2},${subBusY} V ${srPos.y}`} className="stroke-dashed" />
                            ))}
                        </React.Fragment>
                     );
                  }
                }
                return null;
              })}

              {(() => {
                const childrenPos = childrenRows.map(r => positions[r.relation]).filter(Boolean);
                if (childrenPos.length > 0) {
                    const childrenBusY = deceasedPos.y + LEVEL_GAP_Y * 0.75;
                    const minChildX = Math.min(...childrenPos.map(p => p.x + NODE_WIDTH/2));
                    const maxChildX = Math.max(...childrenPos.map(p => p.x + NODE_WIDTH/2));
                    return (
                      <React.Fragment key="children-lines">
                        <SvgPath d={`M ${deceasedPos.x + NODE_WIDTH / 2},${deceasedPos.y + NODE_HEIGHT} V ${childrenBusY}`} />
                        <SvgPath d={`M ${minChildX},${childrenBusY} H ${maxChildX}`} />
                        {childrenPos.map((cPos, i) => (
                           <SvgPath key={`c-line-${i}`} d={`M ${cPos.x + NODE_WIDTH / 2},${childrenBusY} V ${cPos.y}`} />
                        ))}
                      </React.Fragment>
                    );
                }
                return null;
              })()}
            </svg>

            {Object.entries(positions).map(([key, pos]) => {
              let heirData: any = { area: '', share: '', isDeceased: key.startsWith('Deceased') && key !== 'Deceased'};

              if (key === 'Deceased') {
                heirData = { area: totalAreaFormatted, share: '', isDeceased: true };
              } else {
                const mainRow = rows.find(r => r.relation === key);
                if (mainRow) {
                  heirData = { area: `${mainRow.kanal}K-${mainRow.marla}M-${mainRow.feet}ft`, share: mainRow.shareLabel, isDeceased: mainRow.relation.startsWith('Deceased') };
                } else {
                  for (const parentRow of rows) {
                    const subRow = parentRow.subRows?.find(sr => `${parentRow.relation}-${sr.relation}` === key);
                    if (subRow) {
                      heirData = { area: `${subRow.kanal}K-${subRow.marla}M-${subRow.feet}ft`, share: subRow.shareLabel };
                      break;
                    }
                  }
                }
              }
              if (!heirData.area) return null;

              return (
                <Draggable key={key} position={pos} onDrag={(e, data) => handleDrag(e, data, key)} cancel=".no-drag">
                  <div className="absolute cursor-move" style={{ zIndex: 10 }}>
                    <Node title={key.split('-').pop()!} area={heirData.area} share={heirData.share} isDeceased={heirData.isDeceased} />
                  </div>
                </Draggable>
              );
            })}
        </>
      )}
    </div>
  );
};


const HeirCard = ({
  child,
  onUpdate,
  onRemove,
  index,
}: {
  child: ChildHeir;
  onUpdate: (id: string, updates: Partial<ChildHeir>) => void;
  onRemove: (id: string) => void;
  index: number;
}) => {
  const handleHeirChange = (field: keyof ChildHeir['heirs'], value: string) => {
    const numericValue = Number(value) || 0;
    onUpdate(child.id, {
      heirs: { ...child.heirs, [field]: numericValue < 0 ? 0 : numericValue },
    });
  };
  
  const handleHusbandToggle = (checked: boolean) => {
      onUpdate(child.id, {
          heirs: { ...child.heirs, husbandAlive: checked, widows: 0 }
      })
  }
  
  const handleWidowsChange = (value: string) => {
     const numericValue = Number(value) || 0;
     onUpdate(child.id, {
         heirs: { ...child.heirs, widows: numericValue < 0 ? 0 : numericValue, husbandAlive: false }
     });
  }

  const handleChildlessToggle = (checked: boolean) => {
    onUpdate(child.id, {
      isChildless: checked,
      heirs: checked ? { widows: 0, husbandAlive: false, sons: 0, daughters: 0 } : child.heirs,
    });
  };

  return (
    <Card className={cn("relative p-4 animate-accordion-down border-dashed", !child.isAlive ? "border-amber-500/50 bg-amber-500/10" : "")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", child.type === 'son' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-pink-100 dark:bg-pink-900/50')}>
             <User className={cn("h-5 w-5", child.type === 'son' ? 'text-blue-600' : 'text-pink-600')} />
          </div>
          <div>
            <p className="font-semibold text-sm capitalize">{child.type} {index + 1}</p>
            <div className="flex items-center gap-2 mt-1">
              <UserCheck className={cn("h-4 w-4 transition-colors", child.isAlive ? "text-green-600" : "text-muted-foreground/50")} />
              <Switch
                checked={!child.isAlive}
                onCheckedChange={(checked) => onUpdate(child.id, { isAlive: !checked })}
                id={`deceased-switch-${child.id}`}
              />
              <UserX className={cn("h-4 w-4 transition-colors", !child.isAlive ? "text-amber-600" : "text-muted-foreground/50")} />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(child.id)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {!child.isAlive && (
        <div className="mt-4 pt-4 border-t border-dashed border-border/50 space-y-4">
           <div className="flex items-center space-x-2">
              <Switch id={`childless-switch-${child.id}`} checked={!!child.isChildless} onCheckedChange={handleChildlessToggle} />
              <Label htmlFor={`childless-switch-${child.id}`} className="text-xs cursor-pointer font-medium text-amber-800 dark:text-amber-300">Deceased was Childless (No Heirs)</Label>
            </div>

           <div className={cn("grid grid-cols-3 gap-3 transition-opacity", child.isChildless && "opacity-50 pointer-events-none")}>
                {child.type === 'son' ? (
                     <div className="space-y-1">
                        <Label htmlFor={`heir-widows-${child.id}`} className="text-[11px]">His Widow(s)</Label>
                        <Input id={`heir-widows-${child.id}`} type="number" min={0} value={child.heirs.widows} onChange={e => handleWidowsChange(e.target.value)} />
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 pt-5">
                       <Switch id={`heir-husband-${child.id}`} checked={child.heirs.husbandAlive} onCheckedChange={handleHusbandToggle}/>
                       <Label htmlFor={`heir-husband-${child.id}`} className="text-[11px] cursor-pointer">Her Husband Alive</Label>
                    </div>
                )}
                 <div className="space-y-1">
                    <Label htmlFor={`heir-sons-${child.id}`} className="text-[11px]">His/Her Son(s)</Label>
                    <Input id={`heir-sons-${child.id}`} type="number" min={0} value={child.heirs.sons} onChange={e => handleHeirChange('sons', e.target.value)} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor={`heir-daughters-${child.id}`} className="text-[11px]">His/Her Daughter(s)</Label>
                    <Input id={`heir-daughters-${child.id}`} type="number" min={0} value={child.heirs.daughters} onChange={e => handleHeirChange('daughters', e.target.value)} />
                </div>
           </div>
        </div>
      )}
    </Card>
  );
};


export function WirasatTab() {
  const [wirasatKanal, setWirasatKanal] = useState<string>("0");
  const [wirasatMarla, setWirasatMarla] = useState<string>("0");
  const [wirasatFeet, setWirasatFeet] = useState<string>("0");
  const [wirasatMarlaSize, setWirasatMarlaSize] = useState<"225" | "272">("272");

  const [wirasatWidows, setWirasatWidows] = useState<string>("1");
  const [wirasatFatherAlive, setWirasatFatherAlive] = useState<boolean>(false);
  const [wirasatMotherAlive, setWirasatMotherAlive] = useState<boolean>(false);
  const [wirasatHusbandAlive, setWirasatHusbandAlive] = useState<boolean>(false);
  
  const [children, setChildren] = useState<ChildHeir[]>([]);

  const [wirasatBrothers, setWirasatBrothers] = useState<string>("0");
  const [wirasatSisters, setWirasatSisters] = useState<string>("0");
  const [wirasatGrandsons, setWirasatGrandsons] = useState<string>("0");
  const [wirasatMode, setWirasatMode] = useState<WirasatMode>("basic");

  const [wirasatRows, setWirasatRows] = useState<WirasatRow[]>([]);
  const [wirasatTotalSqFt, setWirasatTotalSqFt] = useState<number | null>(null);
  const [wirasatError, setWirasatError] = useState<string | null>(null);
  
    const addChild = (type: 'son' | 'daughter') => {
        const newChild: ChildHeir = {
            id: crypto.randomUUID(),
            type,
            isAlive: true,
            isChildless: false,
            heirs: {
                widows: 0,
                husbandAlive: false,
                sons: 0,
                daughters: 0
            }
        };
        setChildren(prev => [...prev, newChild]);
    };

    const updateChild = (id: string, updates: Partial<ChildHeir>) => {
        setChildren(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const removeChild = (id: string) => {
        setChildren(prev => prev.filter(c => c.id !== id));
    };

  const toTotalSqFt = (kanal: number, marla: number, feet: number, marlaSize: number) => {
    return kanal * 20 * marlaSize + marla * marlaSize + feet;
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
    if (widowsCount > 0 && wirasatHusbandAlive) {
      setWirasatError("Please choose either widows (wives) OR a husband, not both.");
      return;
    }

    if (
      !widowsCount &&
      !wirasatHusbandAlive &&
      !wirasatFatherAlive &&
      !wirasatMotherAlive &&
      children.length === 0 &&
      Number(wirasatBrothers) <= 0 &&
      Number(wirasatSisters) <= 0 &&
      Number(wirasatGrandsons) <= 0
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
      children: children,
      brothers: Number(wirasatBrothers) || 0,
      sisters: Number(wirasatSisters) || 0,
      grandsons: Number(wirasatGrandsons) || 0,
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
    const formattedRows: WirasatRow[] = [];

    calcResult.rows.forEach(row => {
        const mainFormatted = fromSqFt(row.areaSqFtRaw, marlaSizeForFormat);
        sumRounded += mainFormatted.areaSqFtRounded;
        
        const newRow: WirasatRow = { ...row, ...mainFormatted };

        if(row.subRows) {
            let subSumRounded = 0;
            newRow.subRows = row.subRows.map(subRow => {
                const subFormatted = fromSqFt(subRow.areaSqFtRaw, marlaSizeForFormat);
                subSumRounded += subFormatted.areaSqFtRounded;
                return {...subRow, ...subFormatted};
            });
            const subDiff = mainFormatted.areaSqFtRounded - subSumRounded;
            if(subDiff !== 0 && newRow.subRows.length > 0) {
                 const lastSubRow = newRow.subRows[newRow.subRows.length-1];
                 const adjustedSubSqFt = lastSubRow.areaSqFtRounded + subDiff;
                 const finalSubFormatted = fromSqFt(adjustedSubSqFt, marlaSizeForFormat);
                 newRow.subRows[newRow.subRows.length-1] = {...lastSubRow, ...finalSubFormatted};
            }
        }
        formattedRows.push(newRow);
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

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total area</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="wirasat-kanal" className="text-[11px]">Kanal</Label>
                  <Input id="wirasat-kanal" type="number" min={0} value={wirasatKanal} onChange={(e) => setWirasatKanal(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wirasat-marla" className="text-[11px]">Marla</Label>
                  <Input id="wirasat-marla" type="number" min={0} value={wirasatMarla} onChange={(e) => setWirasatMarla(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wirasat-feet" className="text-[11px]">Sq Ft</Label>
                  <Input id="wirasat-feet" type="number" min={0} value={wirasatFeet} onChange={(e) => setWirasatFeet(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wirasat-marla-size">Marla standard</Label>
              <Select value={wirasatMarlaSize} onValueChange={(value) => setWirasatMarlaSize(value as "225" | "272")}>
                <SelectTrigger id="wirasat-marla-size"><SelectValue placeholder="Select marla size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="225">225 Sq Ft (traditional)</SelectItem>
                  <SelectItem value="272">272 Sq Ft (standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                    <Label htmlFor="wirasat-widows" className="text-[11px]">Primary Widow(s)</Label>
                    <Input id="wirasat-widows" type="number" min={0} value={wirasatWidows} onChange={(e) => setWirasatWidows(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2 pt-5">
                    <Switch id="wirasat-husband" checked={wirasatHusbandAlive} onCheckedChange={setWirasatHusbandAlive} />
                    <Label htmlFor="wirasat-husband" className="text-[11px] cursor-pointer">Primary Husband Alive</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="wirasat-father" checked={wirasatFatherAlive} onCheckedChange={setWirasatFatherAlive} />
                    <Label htmlFor="wirasat-father" className="text-[11px] cursor-pointer">Father Alive</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="wirasat-mother" checked={wirasatMotherAlive} onCheckedChange={setWirasatMotherAlive} />
                    <Label htmlFor="wirasat-mother" className="text-[11px] cursor-pointer">Mother Alive</Label>
                </div>
            </div>

             {wirasatMode === "advanced" && (
                <div className="space-y-4 pt-4 border-t border-dashed">
                    <Label className="font-semibold text-xs">Advanced Heirs (Residuaries)</Label>
                     <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="wirasat-brothers" className="text-[11px]">Full Brothers</Label>
                            <Input id="wirasat-brothers" type="number" min={0} value={wirasatBrothers} onChange={(e) => setWirasatBrothers(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="wirasat-sisters" className="text-[11px]">Full Sisters</Label>
                            <Input id="wirasat-sisters" type="number" min={0} value={wirasatSisters} onChange={(e) => setWirasatSisters(e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="wirasat-grandsons" className="text-[11px]">Grandsons</Label>
                            <Input id="wirasat-grandsons" type="number" min={0} value={wirasatGrandsons} onChange={(e) => setWirasatGrandsons(e.target.value)} />
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">These heirs typically inherit only if no direct male descendants (sons) exist.</p>
                </div>
            )}
          </div>
          
          <div className="space-y-4">
            <Label className="font-semibold text-sm">Children & Their Heirs</Label>
            <div className="space-y-3">
                {children.map((child, index) => (
                    <HeirCard key={child.id} child={child} onUpdate={updateChild} onRemove={removeChild} index={index} />
                ))}
            </div>
             <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => addChild('son')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Son
                </Button>
                <Button variant="outline" size="sm" onClick={() => addChild('daughter')}>
                     <PlusCircle className="mr-2 h-4 w-4" /> Add Daughter
                </Button>
            </div>
          </div>
        </section>
        
        <div className="flex items-center justify-end border-t border-dashed pt-4">
            <Button type="button" onClick={handleCalculatePartitions}>Calculate Partitions</Button>
        </div>
        
        {wirasatError && <p className="text-sm text-destructive font-medium text-center">{wirasatError}</p>}

        {wirasatRows.length > 0 && (
            <section className="space-y-6 pt-4 border-t border-dashed">
                <div className="space-y-3">
                     <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold">Proposed Mutation Details</p>
                            <p className="text-[11px] text-muted-foreground">Shares are shown as approximate fractions and precise square-foot areas.</p>
                        </div>
                        {wirasatTotalSqFt !== null && (<p className="text-[11px] text-muted-foreground">Total area: <span className="font-medium">{wirasatTotalSqFt.toLocaleString()} Sq Ft</span></p>)}
                    </div>

                    <div className="overflow-x-auto rounded-md border border-border bg-card/70">
                        <Table>
                        <TableCaption className="text-[11px]">
                            Verify that the sum of all shares equals the total area. Small rounding adjustments (±1–2 Sq Ft) are applied automatically.
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
                            {wirasatRows.map((row, index) => (
                               <React.Fragment key={`${row.relation}-${index}`}>
                                    <TableRow className={cn(row.subRows && "bg-muted/40 font-semibold")}>
                                        <TableCell className="py-3">{row.relation}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{row.shareLabel}</TableCell>
                                        <TableCell className="text-right text-sm">{row.areaSqFtRounded.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{`${row.kanal}K — ${row.marla}M — ${row.feet}ft`}</TableCell>
                                    </TableRow>
                                    {row.subRows?.map((subRow, subIndex) => (
                                        <TableRow key={`${row.relation}-${index}-${subIndex}`} className="bg-background hover:bg-muted/60">
                                            <TableCell className="pl-8 text-sm text-muted-foreground">{subRow.relation}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{subRow.shareLabel}</TableCell>
                                            <TableCell className="text-right text-sm">{subRow.areaSqFtRounded.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">{`${subRow.kanal}K — ${subRow.marla}M — ${subRow.feet}ft`}</TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                     <h3 className="text-sm font-semibold">Distribution Diagram</h3>
                     <DistributionDiagram 
                        rows={wirasatRows} 
                        totalAreaFormatted={totalAreaFormatted}
                        allHeirs={{
                            widows: Number(wirasatWidows) || 0,
                            husbandAlive: wirasatHusbandAlive,
                            fatherAlive: wirasatFatherAlive,
                            motherAlive: wirasatMotherAlive,
                            children: children
                        }}
                    />
                </div>
            </section>
        )}
      </CardContent>
    </Card>
  );
}

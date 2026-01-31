"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateWirasatShares, WirasatMode, WirasatRow, ChildHeir, fromSqFt } from "@/lib/wirasat-calculator";
import { PlusCircle, Trash2, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistributionDiagram } from "@/components/wirasat/FamilyTreeDiagram";

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
    <Card className={cn("relative p-4 animate-accordion-down border-dashed border-amber-500/50 bg-amber-500/10")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", child.type === 'son' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-pink-100 dark:bg-pink-900/50')}>
             <UserX className={cn("h-5 w-5", child.type === 'son' ? 'text-blue-600' : 'text-pink-600')} />
          </div>
          <div>
            <p className="font-semibold text-sm capitalize">Deceased {child.type} {index + 1}</p>
            <p className="text-xs text-muted-foreground">Specify their heirs below</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(child.id)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

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
  
  const [livingSons, setLivingSons] = useState<string>("0");
  const [livingDaughters, setLivingDaughters] = useState<string>("0");
  const [deceasedChildren, setDeceasedChildren] = useState<ChildHeir[]>([]);

  const [wirasatRows, setWirasatRows] = useState<WirasatRow[]>([]);
  const [wirasatTotalSqFt, setWirasatTotalSqFt] = useState<number | null>(null);
  const [wirasatError, setWirasatError] = useState<string | null>(null);
  
  const addDeceasedChild = (type: 'son' | 'daughter') => {
    const newChild: ChildHeir = {
        id: crypto.randomUUID(),
        type,
        isAlive: false, // Always deceased in this context
        isChildless: false,
        heirs: {
            widows: 0,
            husbandAlive: false,
            sons: 0,
            daughters: 0
        }
    };
    setDeceasedChildren(prev => [...prev, newChild]);
  };

  const updateDeceasedChild = (id: string, updates: Partial<ChildHeir>) => {
      setDeceasedChildren(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeDeceasedChild = (id: string) => {
      setDeceasedChildren(prev => prev.filter(c => c.id !== id));
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
    
    const livingSonsCount = Math.max(0, Number(livingSons) || 0);
    const livingDaughtersCount = Math.max(0, Number(livingDaughters) || 0);
    
    if (
      !widowsCount &&
      !wirasatHusbandAlive &&
      !wirasatFatherAlive &&
      !wirasatMotherAlive &&
      livingSonsCount === 0 &&
      livingDaughtersCount === 0 &&
      deceasedChildren.length === 0
    ) {
      setWirasatError("Please specify at least one heir.");
      return;
    }
    
    const allChildren: ChildHeir[] = [
      ...Array.from({ length: livingSonsCount }, (_, i) => ({ id: `living-son-${i}`, type: 'son' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
      ...Array.from({ length: livingDaughtersCount }, (_, i) => ({ id: `living-daughter-${i}`, type: 'daughter' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
      ...deceasedChildren,
    ];

    const calcResult = calculateWirasatShares({
      totalSqFt,
      marlaSize,
      widows: widowsCount,
      husbandAlive: wirasatHusbandAlive,
      fatherAlive: wirasatFatherAlive,
      motherAlive: wirasatMotherAlive,
      children: allChildren,
      brothers: 0,
      sisters: 0,
      grandsons: 0,
      mode: 'basic',
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
          Calculate proposed oral inheritance mutation (Wirasat Zabani) based on Islamic inheritance rules. This calculator is for educational and draft-mutation purposes only. Always confirm with a qualified scholar or official instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

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

            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                    <Label htmlFor="wirasat-sons" className="text-[11px]">Sons (Living)</Label>
                    <Input id="wirasat-sons" type="number" min={0} value={livingSons} onChange={(e) => setLivingSons(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="wirasat-daughters" className="text-[11px]">Daughters (Living)</Label>
                    <Input id="wirasat-daughters" type="number" min={0} value={livingDaughters} onChange={(e) => setLivingDaughters(e.target.value)} />
                </div>
            </div>

          </div>
          
          <div className="space-y-4">
            <Label className="font-semibold text-sm">Deceased Children &amp; Their Heirs</Label>
            <div className="space-y-3">
                {deceasedChildren.map((child, index) => (
                    <HeirCard key={child.id} child={child} onUpdate={updateDeceasedChild} onRemove={removeDeceasedChild} index={index} />
                ))}
            </div>
             <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => addDeceasedChild('son')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Deceased Son
                </Button>
                <Button variant="outline" size="sm" onClick={() => addDeceasedChild('daughter')}>
                     <PlusCircle className="mr-2 h-4 w-4" /> Add Deceased Daughter
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
                            children: [
                                ...Array.from({ length: Number(livingSons) || 0 }, () => ({ type: 'son', isAlive: true })),
                                ...Array.from({ length: Number(livingDaughters) || 0 }, () => ({ type: 'daughter', isAlive: true })),
                                ...deceasedChildren
                            ]
                        }}
                    />
                </div>
            </section>
        )}
      </CardContent>
    </Card>
  );
}

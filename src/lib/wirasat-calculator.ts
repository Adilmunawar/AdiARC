
export type WirasatRow = {
  relation: string;
  shareLabel: string;
  areaSqFtRaw: number;
  areaSqFtRounded: number;
  kanal: number;
  marla: number;
  feet: number;
  subRows?: WirasatRow[];
};

export type WirasatMode = "basic" | "advanced";

export type ChildHeir = {
  id: string;
  type: 'son' | 'daughter';
  isAlive: boolean;
  isChildless?: boolean;
  heirs: {
    husbandAlive: boolean;
    widows: number;
    sons: number;
    daughters: number;
  };
};

export type WirasatInputs = {
  totalSqFt: number;
  marlaSize: number;
  widows: number;
  husbandAlive: boolean;
  fatherAlive: boolean;
  motherAlive: boolean;
  children: ChildHeir[];
  brothers: number;
  sisters: number;
  grandsons: number;
  mode: WirasatMode;
};

export type WirasatCalculationResult = {
  rows: WirasatRow[];
  targetTotal: number;
  error?: string;
};

export const fromSqFt = (
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

export const calculateWirasatShares = (inputs: WirasatInputs): WirasatCalculationResult => {
  const {
    totalSqFt,
    marlaSize,
    widows,
    husbandAlive,
    fatherAlive,
    motherAlive,
    children,
    brothers,
    sisters,
    grandsons,
    mode,
  } = inputs;

  if (totalSqFt <= 0) {
    return { rows: [], targetTotal: 0, error: "Total area must be greater than zero." };
  }

  let rows: WirasatRow[] = [];
  
  const effectiveChildren = children.filter(c => c.isAlive || (c.isAlive === false && !c.isChildless));
  const hasLivingChildren = effectiveChildren.some(c => c.isAlive);
  const hasPredeceasedChildrenWithHeirs = effectiveChildren.some(c => !c.isAlive);
  const hasAnyDescendants = hasLivingChildren || hasPredeceasedChildrenWithHeirs || grandsons > 0;
  
  const hasSiblings = brothers > 0 || sisters > 0;

  let spouseTotalShare = 0;
  if (widows > 0) {
    spouseTotalShare = hasAnyDescendants ? totalSqFt / 8 : totalSqFt / 4;
    const individualShare = spouseTotalShare / widows;
    for (let i = 0; i < widows; i++) {
        rows.push({ relation: `Widow ${i+1}`, shareLabel: `${hasAnyDescendants ? "1/8" : "1/4"} ÷ ${widows}`, areaSqFtRaw: individualShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
    }
  } else if (husbandAlive) {
    spouseTotalShare = hasAnyDescendants ? totalSqFt / 4 : totalSqFt / 2;
    rows.push({ relation: "Husband", shareLabel: hasAnyDescendants ? "1/4" : "1/2", areaSqFtRaw: spouseTotalShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
  }

  let motherShare = 0;
  if (motherAlive) {
    motherShare = (hasAnyDescendants || hasSiblings || effectiveChildren.length > 1) ? totalSqFt / 6 : (mode === 'advanced' ? totalSqFt / 3 : totalSqFt / 6);
    rows.push({ relation: "Mother", shareLabel: (hasAnyDescendants || hasSiblings || effectiveChildren.length > 1) ? "1/6" : (mode === 'advanced' ? "1/3" : "1/6"), areaSqFtRaw: motherShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
  }

  let fatherFixedShare = 0;
  if (fatherAlive) {
      const hasMaleDescendants = effectiveChildren.some(c => (c.isAlive && c.type === 'son') || (!c.isAlive && c.heirs.sons > 0)) || grandsons > 0;
      if (hasMaleDescendants) {
          fatherFixedShare = totalSqFt / 6;
          rows.push({ relation: "Father", shareLabel: "1/6", areaSqFtRaw: fatherFixedShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
      } else if (hasAnyDescendants) { // Only female descendants
          fatherFixedShare = totalSqFt / 6;
      }
  }

  let remainder = totalSqFt - (spouseTotalShare + motherShare + fatherFixedShare);

  if (effectiveChildren.length > 0) {
    const totalChildUnits = effectiveChildren.reduce((acc, child) => acc + (child.type === 'son' ? 2 : 1), 0);
    const hasLivingSons = effectiveChildren.some(c => c.isAlive && c.type === 'son');
    
    let sonCounter = 1;
    let daughterCounter = 1;
    let deceasedSonCounter = 1;
    let deceasedDaughterCounter = 1;

    if (totalChildUnits === 0) {
        // All children are deceased and childless, remainder goes to other residuaries
    } else if (hasLivingSons) {
        const unitValue = remainder / totalChildUnits;
        children.forEach((child) => {
            if (!effectiveChildren.find(ec => ec.id === child.id)) return;

            const childShare = unitValue * (child.type === 'son' ? 2 : 1);
            let relationLabel = '';

            if (child.isAlive) {
                if (child.type === 'son') {
                    relationLabel = `Son ${sonCounter++}`;
                } else {
                    relationLabel = `Daughter ${daughterCounter++}`;
                }
                 rows.push({ relation: relationLabel, shareLabel: `Asaba (${child.type === 'son' ? 2 : 1}/${totalChildUnits})`, areaSqFtRaw: childShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
            } else {
                 if (child.type === 'son') {
                    relationLabel = `Deceased son ${deceasedSonCounter++}`;
                } else {
                    relationLabel = `Deceased daughter ${deceasedDaughterCounter++}`;
                }
                 const subResult = calculateWirasatShares({
                    totalSqFt: childShare, marlaSize, widows: child.heirs.widows, husbandAlive: child.heirs.husbandAlive,
                    fatherAlive: false, motherAlive: false, 
                    children: [
                        ...Array.from({ length: child.heirs.sons }, (_, i) => ({ id: `${child.id}-son-${i}`, type: 'son' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
                        ...Array.from({ length: child.heirs.daughters }, (_, i) => ({ id: `${child.id}-daughter-${i}`, type: 'daughter' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
                    ],
                    brothers: 0, sisters: 0, grandsons: 0, mode: 'basic'
                });
                const formattedParentShare = fromSqFt(childShare, marlaSize);
                rows.push({
                    relation: relationLabel,
                    shareLabel: `Asaba (${child.type === 'son' ? 2 : 1}/${totalChildUnits})`,
                    areaSqFtRaw: childShare, ...formattedParentShare, subRows: subResult.rows,
                });
            }
        });
        remainder = 0;

    } else { // No living sons
        const livingDaughters = effectiveChildren.filter(c => c.isAlive && c.type === 'daughter');
        const daughterFixedTotal = livingDaughters.length === 1 ? totalSqFt / 2 : (2 * totalSqFt) / 3;
        const individualDaughterShare = livingDaughters.length > 0 ? daughterFixedTotal / livingDaughters.length : 0;
        
        livingDaughters.forEach((_daughter) => {
             rows.push({ relation: `Daughter ${daughterCounter++}`, shareLabel: livingDaughters.length === 1 ? '1/2' : `2/3 ÷ ${livingDaughters.length}`, areaSqFtRaw: individualDaughterShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
        });
        
        let remainingForResidue = totalSqFt - (spouseTotalShare + motherShare + fatherFixedShare + daughterFixedTotal);
        
        const predeceasedWithHeirs = effectiveChildren.filter(c => !c.isAlive);
        if(predeceasedWithHeirs.length > 0 && remainingForResidue > 0){
             const predecChildUnits = predeceasedWithHeirs.reduce((acc, child) => acc + (child.type === 'son' ? 2 : 1), 0);
             if (predecChildUnits > 0) {
                const unitValue = remainingForResidue / predecChildUnits;
                predeceasedWithHeirs.forEach((child) => {
                    let relationLabel = '';
                     if (child.type === 'son') {
                        relationLabel = `Deceased son ${deceasedSonCounter++}`;
                    } else {
                        relationLabel = `Deceased daughter ${deceasedDaughterCounter++}`;
                    }
                    const childShare = unitValue * (child.type === 'son' ? 2 : 1);
                    const subResult = calculateWirasatShares({
                        totalSqFt: childShare, marlaSize, widows: child.heirs.widows, husbandAlive: child.heirs.husbandAlive,
                        fatherAlive: false, motherAlive: false, 
                        children: [
                            ...Array.from({ length: child.heirs.sons }, (_, i) => ({ id: `${child.id}-son-${i}`, type: 'son' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
                            ...Array.from({ length: child.heirs.daughters }, (_, i) => ({ id: `${child.id}-daughter-${i}`, type: 'daughter' as const, isAlive: true, isChildless: false, heirs: { widows: 0, husbandAlive: false, sons: 0, daughters: 0 }})),
                        ],
                        brothers: 0, sisters: 0, grandsons: 0, mode: 'basic'
                    });
                    const formattedParentShare = fromSqFt(childShare, marlaSize);
                    rows.push({
                        relation: relationLabel, shareLabel: `Residue`,
                        areaSqFtRaw: childShare, ...formattedParentShare, subRows: subResult.rows
                    });
                });
                remainingForResidue = 0;
             }
        }

        if(remainingForResidue > 0 && fatherAlive) {
             const fatherRow = rows.find(r => r.relation === 'Father');
             if(fatherRow) {
                fatherRow.areaSqFtRaw += remainingForResidue;
                fatherRow.shareLabel = "1/6 + Residue";
             } else {
                 rows.push({ relation: "Father", shareLabel: "1/6 + Residue", areaSqFtRaw: fatherFixedShare + remainingForResidue, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
             }
             remainingForResidue = 0;
        }
        remainder = remainingForResidue;

    }
  }
  
    if (mode === 'advanced' && !hasAnyDescendants) {
        if (fatherAlive) {
            const fatherRow = rows.find(r => r.relation === "Father");
            if (fatherRow) {
                fatherRow.areaSqFtRaw += remainder;
                fatherRow.shareLabel = "Asaba (Residue)";
            } else {
                rows.push({ relation: "Father", shareLabel: "Residue (Asaba)", areaSqFtRaw: remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
            }
            remainder = 0;
        } else if (brothers > 0 || sisters > 0) {
            const totalSiblingUnits = brothers * 2 + sisters;
            const unitValue = remainder / totalSiblingUnits;
            for(let i=0; i<brothers; i++) rows.push({relation: `Brother ${i+1}`, shareLabel: `Asaba (2/${totalSiblingUnits})`, areaSqFtRaw: unitValue*2, areaSqFtRounded:0, kanal:0, marla:0, feet:0});
            for(let i=0; i<sisters; i++) rows.push({relation: `Sister ${i+1}`, shareLabel: `Asaba (1/${totalSiblingUnits})`, areaSqFtRaw: unitValue, areaSqFtRounded:0, kanal:0, marla:0, feet:0});
            remainder = 0;
        }
    }

  if (remainder > 1) {
    const raddHeirs = rows.filter(r => ['Widow', 'Husband', 'Mother', 'Daughter'].some(prefix => r.relation.startsWith(prefix)));
    const fixedHeirs = rows.filter(r => ['Father'].some(prefix => r.relation.startsWith(prefix)));
    
    if (raddHeirs.length > 0 && fixedHeirs.length === 0) {
        const totalRaddArea = raddHeirs.reduce((acc, r) => acc + r.areaSqFtRaw, 0);
        raddHeirs.forEach(r => {
            const raddPortion = (r.areaSqFtRaw / totalRaddArea) * remainder;
            r.areaSqFtRaw += raddPortion;
        });
        remainder = 0;
    }
  }

  if (remainder > 1) {
    rows.push({ relation: 'Residue / Radd', shareLabel: 'Remaining Balance', areaSqFtRaw: remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
  }

  return { rows, targetTotal: Math.round(totalSqFt) };
};

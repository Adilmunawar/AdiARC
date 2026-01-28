
export type WirasatRow = {
  relation: string;
  shareLabel: string;
  areaSqFtRaw: number;
  areaSqFtRounded: number;
  kanal: number;
  marla: number;
  feet: number;
};

export type WirasatMode = "basic" | "advanced";

export type ChildHeir = {
  id: string;
  type: 'son' | 'daughter';
  isAlive: boolean;
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

const distributeShare = (
  share: number,
  heirs: { widows: number; husbandAlive: boolean; sons: number; daughters: number; },
  prefix: string,
  marlaSize: number
): WirasatRow[] => {
    const subResult = calculateWirasatShares({
        totalSqFt: share,
        marlaSize,
        widows: heirs.widows,
        husbandAlive: heirs.husbandAlive,
        fatherAlive: false,
        motherAlive: false,
        children: [],
        sons: heirs.sons,
        daughters: heirs.daughters,
        brothers: 0,
        sisters: 0,
        grandsons: 0,
        mode: 'basic'
    });
    
    return subResult.rows.map(row => ({ ...row, relation: `${prefix}'s ${row.relation}`}));
}

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
  
  const hasLivingChildren = children.some(c => c.isAlive);
  const hasPredeceasedChildrenWithHeirs = children.some(c => !c.isAlive && (c.heirs.sons > 0 || c.heirs.daughters > 0));
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
    motherShare = (hasAnyDescendants || hasSiblings || children.length > 1) ? totalSqFt / 6 : (mode === 'advanced' ? totalSqFt / 3 : totalSqFt / 6);
    rows.push({ relation: "Mother", shareLabel: (hasAnyDescendants || hasSiblings || children.length > 1) ? "1/6" : (mode === 'advanced' ? "1/3" : "1/6"), areaSqFtRaw: motherShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
  }

  let fatherFixedShare = 0;
  if (fatherAlive) {
      const hasMaleDescendants = children.some(c => (c.isAlive && c.type === 'son') || (!c.isAlive && c.heirs.sons > 0)) || grandsons > 0;
      if (hasMaleDescendants) {
          fatherFixedShare = totalSqFt / 6;
          rows.push({ relation: "Father", shareLabel: "1/6", areaSqFtRaw: fatherFixedShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
      } else if (hasAnyDescendants) { // Only female descendants
          fatherFixedShare = totalSqFt / 6;
          // Residue will be added later
      }
  }

  let remainder = totalSqFt - (spouseTotalShare + motherShare + fatherFixedShare);

  if (children.length > 0) {
    const totalChildUnits = children.reduce((acc, child) => acc + (child.type === 'son' ? 2 : 1), 0);
    const livingDaughters = children.filter(c => c.isAlive && c.type === 'daughter');
    const hasLivingSons = children.some(c => c.isAlive && c.type === 'son');

    if (hasLivingSons) {
        // Asaba rule applies
        const unitValue = remainder / totalChildUnits;
        children.forEach((child, index) => {
            const childShare = unitValue * (child.type === 'son' ? 2 : 1);
            if (child.isAlive) {
                 rows.push({ relation: `${child.type === 'son' ? 'Son' : 'Daughter'} ${index + 1}`, shareLabel: `Asaba (${child.type === 'son' ? 2 : 1}/${totalChildUnits})`, areaSqFtRaw: childShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
            } else {
                const subRows = distributeShare(childShare, child.heirs, `Deceased ${child.type} ${index+1}`, marlaSize);
                rows = [...rows, ...subRows];
            }
        });
        remainder = 0;

    } else if (livingDaughters.length > 0) {
        // Daughters are fixed sharers
        const daughterFixedTotal = livingDaughters.length === 1 ? totalSqFt / 2 : (2 * totalSqFt) / 3;
        const individualDaughterShare = daughterFixedTotal / livingDaughters.length;
        
        livingDaughters.forEach((daughter, index) => {
             rows.push({ relation: `Daughter ${index + 1}`, shareLabel: livingDaughters.length === 1 ? '1/2' : `2/3 ÷ ${livingDaughters.length}`, areaSqFtRaw: individualDaughterShare, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
        });
        
        remainder -= daughterFixedTotal;

        const predeceasedSons = children.filter(c => !c.isAlive && c.type === 'son');
        if(predeceasedSons.length > 0 && remainder > 0){
             const unitValue = remainder / (predeceasedSons.length * 2);
             predeceasedSons.forEach((son, index) => {
                const sonShare = unitValue * 2;
                const subRows = distributeShare(sonShare, son.heirs, `Deceased Son ${index+1}`, marlaSize);
                rows = [...rows, ...subRows];
             });
             remainder = 0;
        }

        if(remainder > 0 && fatherAlive) {
             const fatherRow = rows.find(r => r.relation === 'Father');
             if(fatherRow) {
                fatherRow.areaSqFtRaw += remainder;
                fatherRow.shareLabel = "1/6 + Residue";
             } else {
                 rows.push({ relation: "Father", shareLabel: "1/6 + Residue", areaSqFtRaw: fatherFixedShare + remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
             }
             remainder = 0;
        }
    } else { // Only predeceased children
        const unitValue = remainder / totalChildUnits;
        children.forEach((child, index) => {
             const childShare = unitValue * (child.type === 'son' ? 2 : 1);
             const subRows = distributeShare(childShare, child.heirs, `Deceased ${child.type} ${index+1}`, marlaSize);
             rows = [...rows, ...subRows];
        });
        remainder = 0;
    }
  }
  
    if (mode === 'advanced' && !hasAnyDescendants) {
        if (fatherAlive) {
            rows.push({ relation: "Father", shareLabel: "Residue (Asaba)", areaSqFtRaw: remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
            remainder = 0;
        } else if (brothers > 0 || sisters > 0) {
            const totalSiblingUnits = brothers * 2 + sisters;
            const unitValue = remainder / totalSiblingUnits;
            for(let i=0; i<brothers; i++) rows.push({relation: `Brother ${i+1}`, shareLabel: `Asaba (2/${totalSiblingUnits})`, areaSqFtRaw: unitValue*2, areaSqFtRounded:0, kanal:0, marla:0, feet:0});
            for(let i=0; i<sisters; i++) rows.push({relation: `Sister ${i+1}`, shareLabel: `Asaba (1/${totalSiblingUnits})`, areaSqFtRaw: unitValue, areaSqFtRounded:0, kanal:0, marla:0, feet:0});
            remainder = 0;
        }
    }

  if (remainder > 1) { // Allow for tiny rounding errors
    rows.push({ relation: 'Residue / Radd', shareLabel: 'Remaining Balance', areaSqFtRaw: remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0 });
  }

  return { rows, targetTotal: Math.round(totalSqFt) };
};

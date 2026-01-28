
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

export type PredeceasedSonHeirs = {
    widows: number;
    sons: number;
    daughters: number;
};

export type WirasatInputs = {
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
  predeceasedSon?: PredeceasedSonHeirs;
};

export type WirasatCalculationResult = {
  rows: WirasatRow[];
  targetTotal: number;
  error?: string;
};

export const calculateWirasatShares = (inputs: WirasatInputs): WirasatCalculationResult => {
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
    predeceasedSon
  } = inputs;

  if (totalSqFt <= 0) {
    return { rows: [], targetTotal: 0, error: "Total area must be greater than zero." };
  }

  const rows: WirasatRow[] = [];

  const hasLivingDescendants = sons > 0 || daughters > 0 || (predeceasedSon && (predeceasedSon.sons > 0 || predeceasedSon.daughters > 0));
  const hasAnyDescendants = hasLivingDescendants || grandsons > 0;
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
    spouseTotalShare = hasAnyDescendants ? totalSqFt / 8 : totalSqFt / 4;
    widowIndividualShare = spouseTotalShare / widows;
  } else if (husbandAlive) {
    // Deceased is female; husband inherits
    spouseTotalShare = hasAnyDescendants ? totalSqFt / 4 : totalSqFt / 2;
  }

  // Mother share: 1/6 if children or siblings, otherwise 1/3 (advanced fiqh rule)
  let motherShare = 0;
  if (motherAlive) {
    if (hasAnyDescendants || hasSiblings) {
      motherShare = totalSqFt / 6;
    } else {
      motherShare = mode === "advanced" ? totalSqFt / 3 : totalSqFt / 6;
    }
  }

  // Father share setup
  let fatherShare = 0;
  if (fatherAlive) {
    if (hasAnyDescendants) {
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
        shareLabel: hasAnyDescendants ? "1/8" : "1/4",
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
          shareLabel: `${hasAnyDescendants ? "1/8" : "1/4"} ÷ ${widows}`,
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
      shareLabel: hasAnyDescendants ? "1/4" : "1/2",
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
      shareLabel: hasAnyDescendants || hasSiblings ? "1/6" : mode === "advanced" ? "1/3" : "1/6",
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

    const sonsCount = sons;
    const daughtersCount = daughters;
    const hasPredeceasedSon = !!predeceasedSon;

    const usedBase = spouseTotalShare + motherShare + fatherShare;
    let remainder = totalSqFt - usedBase;

    if(remainder < 0) {
        return { rows: [], targetTotal: 0, error: "Base shares exceed total area. Please review inputs." };
    }

    if (sonsCount > 0 || daughtersCount > 0 || hasPredeceasedSon) {
        const totalChildUnits = sonsCount * 2 + daughtersCount * 1 + (hasPredeceasedSon ? 2 : 0);

        if (totalChildUnits > 0) {
            const singleUnitValue = remainder / totalChildUnits;
            const sonShare = singleUnitValue * 2;
            const daughterShare = singleUnitValue;

            for (let i = 0; i < sonsCount; i++) {
                rows.push({
                    relation: sonsCount === 1 ? "Son" : `Son ${i + 1}`,
                    shareLabel: `Asaba (${2}/${totalChildUnits})`,
                    areaSqFtRaw: sonShare,
                    areaSqFtRounded: 0, canal: 0, marla: 0, feet: 0,
                });
            }

            for (let i = 0; i < daughtersCount; i++) {
                rows.push({
                    relation: daughtersCount === 1 ? "Daughter" : `Daughter ${i + 1}`,
                    shareLabel: `Asaba (${1}/${totalChildUnits})`,
                    areaSqFtRaw: daughterShare,
                    areaSqFtRounded: 0, canal: 0, marla: 0, feet: 0,
                });
            }

            if (hasPredeceasedSon) {
                const predeceasedSonShare = sonShare;
                const subResult = calculateWirasatShares({
                    totalSqFt: predeceasedSonShare,
                    marlaSize: marlaSize,
                    widows: predeceasedSon.widows,
                    husbandAlive: false,
                    fatherAlive: false,
                    motherAlive: false,
                    sons: predeceasedSon.sons,
                    daughters: predeceasedSon.daughters,
                    brothers: 0, sisters: 0, grandsons: 0,
                    mode: 'basic',
                });
                 if (subResult.rows.length > 0) {
                    subResult.rows.forEach(subRow => {
                        rows.push({
                            ...subRow,
                            relation: `Predeceased Son's ${subRow.relation}`
                        });
                    });
                }
            }
        }
         remainder = 0;
    }

    if (daughtersCount > 0 && sonsCount === 0 && !hasPredeceasedSon) {
      let daughtersFixedShare = daughtersCount === 1 ? totalSqFt / 2 : (2 * totalSqFt) / 3;
      const perDaughterFixed = daughtersFixedShare / daughtersCount;

      for (let i = 0; i < daughtersCount; i++) {
        rows.push({
          relation: `Daughter ${i + 1}`,
          shareLabel: daughtersCount === 1 ? '1/2' : `2/3 ÷ ${daughtersCount}`,
          areaSqFtRaw: perDaughterFixed,
          areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0,
        });
      }
      
      const newUsedBase = usedBase + daughtersFixedShare;
      let residueAfterDaughters = totalSqFt - newUsedBase;
      
      if(residueAfterDaughters > 0 && fatherAlive) {
          const fatherRowIndex = rows.findIndex(r => r.relation === "Father");
          if(fatherRowIndex !== -1) {
              rows[fatherRowIndex].areaSqFtRaw += residueAfterDaughters;
              rows[fatherRowIndex].shareLabel = "1/6 + Residue";
          }
           residueAfterDaughters = 0;
      }
       remainder = residueAfterDaughters;
    }


    if (mode === 'advanced' && !hasAnyDescendants) {
        if (fatherAlive) {
            const fatherRow = rows.find(r => r.relation === 'Father');
            if (fatherRow) { // Should not happen but for safety
                fatherRow.areaSqFtRaw += remainder;
                fatherRow.shareLabel = "Residue (Asaba)";
            } else {
                 rows.push({ relation: 'Father', shareLabel: 'Residue (Asaba)', areaSqFtRaw: remainder, areaSqFtRounded: 0, kanal: 0, marla: 0, feet: 0});
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
  
    if(remainder > 1) { // Allow for tiny rounding errors
        rows.push({relation: 'Residue / Radd', shareLabel: 'Remaining Balance', areaSqFtRaw: remainder, areaSqFtRounded:0, kanal:0, marla:0, feet:0});
    }

  return { rows, targetTotal: Math.round(totalSqFt) };
};

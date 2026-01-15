
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

      if (daughtersCount === 1) {
        daughtersFixedShare = totalSqFt / 2; // 1/2
      } else {
        daughtersFixedShare = (2 * totalSqFt) / 3; // 2/3
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
    rows,
    targetTotal: Math.round(totalSqFt),
    error: "This heir combination is not fully supported in this version. Please consult a scholar.",
  };
};

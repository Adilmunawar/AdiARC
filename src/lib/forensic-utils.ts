
// --- CORE ENGINE: UNIVERSAL MUTATION HUNTER (Ported from Mutation Hunter Pro) ---
export const extractMutationNumber = (tags: any): { number: string; source: string; isGoldenKey: boolean }[] => {
  const findings: { number: string; source: string; isGoldenKey: boolean }[] = [];

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
            isGoldenKey: true,
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
            findings.push({ number: num, source: sourceLabel, isGoldenKey: false });
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

export function compressRanges(numbers: number[]): string {
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

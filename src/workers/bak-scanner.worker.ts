/// <reference lib="webworker" />

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data;
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (Smaller to prevent crash)
  const MAX_SCAN_SIZE = 100 * 1024 * 1024; // Only scan first 100MB to be fast
  const fileSize = file.size;
  let offset = 0;

  const results: any[] = [];
  let foundCount = 0;
  let entropySum = 0;
  let chunksProcessed = 0;

  // READ HEADER (First 1KB) for Debugging
  const headerSlice = file.slice(0, 1024);
  const headerBuffer = await headerSlice.arrayBuffer();
  const headerBytes = new Uint8Array(headerBuffer);
  const headerHex = Array.from(headerBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  const headerText = new TextDecoder().decode(headerBytes).replace(/[^\x20-\x7E]/g, '.'); // ASCII Only

  results.push({
    id: 'HEADER',
    type: 'FILE_HEADER',
    offset: 0,
    preview: `Hex: ${headerHex}\nASCII: ${headerText.substring(0, 50)}...`,
    fullCode: `File Header Analysis:\nHex: ${headerHex}\nDecoded: ${headerText}`
  });

  try {
    while (offset < Math.min(fileSize, MAX_SCAN_SIZE)) {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // 1. CALCULATE ENTROPY (To detect Compression)
      // High entropy (>7.5) usually means Compressed/Encrypted
      let chunkEntropy = 0;
      const frequencies = new Array(256).fill(0);
      for (let i = 0; i < bytes.length; i += 100) frequencies[bytes[i]]++; // Sample every 100th byte
      const totalSamples = Math.floor(bytes.length / 100);
      chunkEntropy = frequencies.reduce((sum, freq) => {
        if (freq === 0) return sum;
        const p = freq / totalSamples;
        return sum - (p * Math.log2(p));
      }, 0);
      entropySum += chunkEntropy;
      chunksProcessed++;

      // 2. CONVERT TO STRING (Binary Safe)
      // We use a safe conversion that treats bytes as Latin-1 to preserve binary patterns
      let rawString = "";
      for (let i = 0; i < bytes.length; i++) {
        rawString += String.fromCharCode(bytes[i]);
      }

      // 3. SEARCH PATTERNS (Relaxed)
      const patterns = [
        // Standard SQL (ASCII)
        { type: 'PROC_ASCII', regex: /CREATE\s+PROC(?:EDURE)?\s+(?:\[?dbo\]?\.\[?)?(\w+)/gi },
        { type: 'VIEW_ASCII', regex: /CREATE\s+VIEW\s+(?:\[?dbo\]?\.\[?)?(\w+)/gi },
        
        // SQL Server Internal (UTF-16LE / Null Separated)
        // C.R.E.A.T.E. .P.R.O.C
        { type: 'PROC_UTF16', regex: /C\x00R\x00E\x00A\x00T\x00E\x00\s+\x00P\x00R\x00O\x00C/g },
        
        // "Fuzzy" Object Finder (Finds object names even in compressed streams sometimes)
        { type: 'POSSIBLE_OBJECT', regex: /(?:\[dbo\]\.)?\[(\w{5,50})\]/g } 
      ];

      for (const pattern of patterns) {
        let match;
        // Limit regex run time
        while ((match = pattern.regex.exec(rawString)) !== null) {
          if (foundCount > 500) break; // Limit results

          const start = Math.max(0, match.index - 50);
          const end = Math.min(start + 1000, rawString.length);
          let extracted = rawString.substring(start, end);

          // Clean up UTF-16LE nulls for display
          extracted = extracted.replace(/\x00/g, '');

          // Filter garbage
          if (extracted.includes('CREATE') || extracted.includes('dbo')) {
             results.push({
              id: foundCount++,
              type: pattern.type,
              offset: offset + match.index,
              preview: extracted.substring(0, 100).replace(/[^\x20-\x7E]/g, ''),
              fullCode: extracted
            });
          }
        }
      }

      offset += CHUNK_SIZE;
      
      self.postMessage({ 
        type: 'progress', 
        payload: { progress: Math.round((offset / MAX_SCAN_SIZE) * 100), count: foundCount } 
      });
    }

    // FINAL DIAGNOSIS
    const avgEntropy = entropySum / chunksProcessed;
    if (foundCount === 0 && avgEntropy > 6.0) {
       results.unshift({
        id: 'WARNING',
        type: 'COMPRESSION_DETECTED',
        offset: 0,
        preview: `High Entropy (${avgEntropy.toFixed(2)}). File is likely COMPRESSED.`,
        fullCode: `DIAGNOSIS:\nThis file appears to be a Compressed SQL Backup.\n\nEvidence:\n1. Zero readable SQL patterns found.\n2. High Data Entropy (${avgEntropy.toFixed(2)}/8.0).\n\nSolution:\nThis scanner looks for plain-text SQL. Since this file is compressed, the text is scrambled.\nYou MUST restore this .bak file to a real SQL Server instance to read it.`
      });
    }

    self.postMessage({ type: 'complete', payload: results });

  } catch (error: any) {
    self.postMessage({ type: 'error', payload: error.message });
  }
};

export {};

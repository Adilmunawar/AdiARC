/// <reference lib="webworker" />

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data;
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const MAX_SCAN_SIZE = 100 * 1024 * 1024; // Only scan first 100MB for performance
  const fileSize = file.size;
  let offset = 0;

  const results: any[] = [];
  let foundCount = 0;
  let entropySum = 0;
  let chunksProcessed = 0;

  // --- Start Forensic Header Analysis ---
  const headerSlice = file.slice(0, 4096);
  const headerBuffer = await headerSlice.arrayBuffer();
  const headerBytes = new Uint8Array(headerBuffer);
  
  // Convert header to a string where non-ASCII chars are replaced by '.'
  const headerAsciiPreview = new TextDecoder().decode(headerBytes).replace(/[^\x20-\x7E\r\n]/g, '.');
  
  // Try to decode as UTF-16LE to find metadata strings
  const headerUnicodeText = new TextDecoder('utf-16le').decode(headerBuffer);

  const dbNameMatch = headerUnicodeText.match(/R\x00h\x00z\x00_\x00L\x00r\x00m\x00i\x00s/);
  const serverNameMatch = headerUnicodeText.match(/L\x00H\x00R\x00-\x00D\x00B\x00-\x000\x001/);
  
  const dbName = dbNameMatch ? "Rhz_Lrmis" : null;
  const serverName = serverNameMatch ? "LHR-DB-01" : null;

  results.push({
    id: 'HEADER_ANALYSIS',
    type: 'FILE_HEADER',
    offset: 0,
    preview: `Scanned file header for metadata...`,
    fullCode: `File Header Raw Preview (ASCII):\n=================================\n${headerAsciiPreview}`
  });
  // --- End Forensic Header Analysis ---

  try {
    while (offset < Math.min(fileSize, MAX_SCAN_SIZE)) {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // --- Entropy Calculation ---
      let chunkEntropy = 0;
      const frequencies = new Array(256).fill(0);
      for (let i = 0; i < bytes.length; i += 100) frequencies[bytes[i]]++;
      const totalSamples = Math.floor(bytes.length / 100);
      if (totalSamples > 0) {
        chunkEntropy = frequencies.reduce((sum, freq) => {
          if (freq === 0) return sum;
          const p = freq / totalSamples;
          return sum - (p * Math.log2(p));
        }, 0);
        entropySum += chunkEntropy;
        chunksProcessed++;
      }
      
      // --- Pattern Search (only if entropy is low) ---
      const avgEntropy = chunksProcessed > 0 ? entropySum / chunksProcessed : 0;
      if (avgEntropy < 6.5) { // Heuristic: Don't bother searching if it's clearly compressed
        let rawString = "";
        for (let i = 0; i < bytes.length; i++) rawString += String.fromCharCode(bytes[i]);
        
        const patterns = [
          { type: 'PROC_ASCII', regex: /CREATE\s+PROC(?:EDURE)?\s+(?:\[?dbo\]?\.\[?)?(\w+)/gi },
          { type: 'VIEW_ASCII', regex: /CREATE\s+VIEW\s+(?:\[?dbo\]?\.\[?)?(\w+)/gi },
          { type: 'PROC_UTF16', regex: /C\x00R\x00E\x00A\x00T\x00E\x00\s+\x00P\x00R\x00O\x00C/g },
          { type: 'POSSIBLE_OBJECT', regex: /(?:\[dbo\]\.)?\[(\w{5,50})\]/g }
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(rawString)) !== null) {
              if (foundCount > 500) break;
              let extracted = rawString.substring(match.index, match.index + 2000).replace(/\x00/g, '');
              const cutoff = extracted.search(/(\r\nGO)|(\nGO)|(CREATE\s+)/i);
              if (cutoff > 20) extracted = extracted.substring(0, cutoff);
              
              if (extracted.includes('CREATE') || extracted.includes('dbo')) {
                 results.push({
                  id: foundCount++,
                  type: pattern.type,
                  offset: offset + match.index,
                  preview: extracted.substring(0, 100).replace(/[^\x20-\x7E]/g, '.'),
                  fullCode: extracted
                });
              }
            }
        }
      }

      offset += CHUNK_SIZE;
      self.postMessage({ type: 'progress', payload: { progress: Math.round((offset / Math.min(fileSize, MAX_SCAN_SIZE)) * 100), count: foundCount } });
    }

    // --- Final Diagnosis ---
    const finalAvgEntropy = chunksProcessed > 0 ? entropySum / chunksProcessed : 0;
    if (foundCount === 0 && finalAvgEntropy > 7.0) { // High entropy is a strong sign of compression
       results.unshift({
        id: 'DIAGNOSIS',
        type: 'DIAGNOSTIC_REPORT',
        offset: 0,
        preview: `COMPRESSED BACKUP (Entropy: ${finalAvgEntropy.toFixed(2)}/8.0).`,
        fullCode: `FORENSIC ANALYSIS REPORT
========================
File: ${file.name}
Size: ${(fileSize / (1024*1024)).toFixed(2)} MB

DIAGNOSIS:
This is a Native Compressed SQL Server Backup. The tool cannot read the code within it directly.

EVIDENCE:
1.  Compression Status: COMPRESSED (Entropy: ${finalAvgEntropy.toFixed(2)} / 8.00)
    This high level of randomness confirms the file data is compressed.
${dbName ? `2.  Database Name: ${dbName} (Detected in header)` : ''}
${serverName ? `3.  Origin Server: ${serverName} (Detected in header)` : ''}

SOLUTION:
To access the data, you MUST restore this .bak file to a running instance of Microsoft SQL Server (2008 R2 or newer). This scanner is designed for uncompressed backups only.`
      });
    }

    self.postMessage({ type: 'complete', payload: results });

  } catch (error: any) {
    self.postMessage({ type: 'error', payload: error.message });
  }
};

export {};

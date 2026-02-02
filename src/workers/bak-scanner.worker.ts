/// <reference lib="webworker" />

self.onmessage = async (event: MessageEvent) => {
  const { file } = event.data;
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  const fileSize = file.size;
  let offset = 0;

  // Patterns to hunt (both ASCII and UTF-16LE for SQL Server)
  // We use regex to find "C R E A T E   P R O C" patterns
  const patterns = [
    { type: 'PROCEDURE', regex: /C\x00R\x00E\x00A\x00T\x00E\x00\s+\x00P\x00R\x00O\x00C/g },
    { type: 'VIEW', regex: /C\x00R\x00E\x00A\x00T\x00E\x00\s+\x00V\x00I\x00E\x00W/g },
    { type: 'TABLE', regex: /C\x00R\x00E\x00A\x00T\x00E\x00\s+\x00T\x00A\x00B\x00L\x00E/g },
    { type: 'ASCII_PROC', regex: /CREATE\s+PROC/g }, // Fallback for some older backups
  ];

  const results: any[] = [];
  let foundCount = 0;

  try {
    while (offset < fileSize) {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      
      // We convert buffer to a "binary string" to run regex on it (efficient for searching large binary)
      const rawString = Array.from(new Uint8Array(buffer))
        .map(b => String.fromCharCode(b))
        .join('');

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.regex.exec(rawString)) !== null) {
          // Capture context (e.g., 5000 characters after the match)
          const start = match.index;
          const end = Math.min(start + 5000, rawString.length);
          
          let extracted = rawString.substring(start, end);
          const isWide = extracted.includes('\x00');
          if (isWide) {
            extracted = extracted.replace(/\x00/g, '');
          }

          const cutoff = extracted.search(/(\r\nGO)|(\nGO)|(CREATE\s+)/i);
          if (cutoff > 50) extracted = extracted.substring(0, cutoff);

          results.push({
            id: foundCount++,
            type: pattern.type,
            offset: offset + start,
            preview: extracted.trim(),
            fullCode: extracted.trim()
          });
        }
      }

      offset += CHUNK_SIZE;
      
      self.postMessage({ 
        type: 'progress', 
        payload: { progress: Math.round((offset / fileSize) * 100), count: foundCount } 
      });
    }

    self.postMessage({ type: 'complete', payload: results });

  } catch (error: any) {
    self.postMessage({ type: 'error', payload: error.message });
  }
};

export {};


/// <reference lib="webworker" />
import ExifReader from "exifreader";
import { extractMutationNumber, InventoryItem } from "@/lib/forensic-utils";

self.onmessage = async (event: MessageEvent) => {
  const { type, files } = event.data;

  if (type === 'start') {
    let processedCount = 0;
    const totalFiles = files.length;

    for (const file of files) {
      try {
        const tags = await ExifReader.load(file);
        processedCount++;
        
        self.postMessage({ 
            type: 'progress', 
            payload: { current: processedCount, total: totalFiles, filename: file.name } 
        });

        if (Object.keys(tags).length < 2 || (tags.file && Object.keys(tags.file).length < 2)) {
            self.postMessage({ type: 'result', payload: { id: null, file: file.name, folder: (file as any).webkitRelativePath.split('/').slice(0, -1).join('/') || '(root)', source: "Minimal Metadata", status: "stripped" } });
            continue;
        }

        const findings = extractMutationNumber(tags);
        const goldenKeyFinding = findings.find(f => f.isGoldenKey);

        if (goldenKeyFinding) {
          self.postMessage({ type: 'result', payload: { id: goldenKeyFinding.number, file: file.name, folder: (file as any).webkitRelativePath.split('/').slice(0, -1).join('/') || '(root)', source: goldenKeyFinding.source, status: 'valid' } });
        } else {
          self.postMessage({ type: 'result', payload: { id: null, file: file.name, folder: (file as any).webkitRelativePath.split('/').slice(0, -1).join('/') || '(root)', source: "No XMP:DocumentNo", status: 'no-match' } });
        }
      } catch (err) {
        self.postMessage({ type: 'result', payload: { id: null, file: file.name, folder: "(unknown)", source: "Read Error", status: 'stripped' } });
      }
    }
    
    self.postMessage({ type: 'complete', payload: { totalFiles } });
  }
};

export {};

// src/lib/image-forensics.ts

export type ImageHealthReport = {
  status: 'HEALTHY' | 'CORRUPT' | 'MISLABELED';
  detectedFormat: string;
  originalFormat: string;
  fixable: boolean;
  suggestedAction: string;
  repairedFile?: Blob; // The fixed file
};

const MAGIC_BYTES: Record<string, string> = {
  'ffd8ff': 'jpg',
  '89504e47': 'png',
  '47494638': 'gif',
  '25504446': 'pdf',
  '49492a00': 'tiff', // Intel byte order
  '4d4d002a': 'tiff', // Motorola byte order
  '424d': 'bmp',
  '52494646': 'webp'  // Partial check for WEBP
};

export async function diagnoseAndRepairImage(file: File): Promise<ImageHealthReport> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Get the first 4 bytes as hex
  const header = Array.from(bytes.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 1. Detect True Format
  let detectedExt = 'unknown';
  for (const [signature, ext] of Object.entries(MAGIC_BYTES)) {
    if (header.startsWith(signature)) {
      detectedExt = ext;
      break;
    }
  }

  const currentExt = file.name.split('.').pop()?.toLowerCase() || '';

  // 2. Diagnosis Logic
  if (detectedExt === 'unknown') {
    return {
      status: 'CORRUPT',
      detectedFormat: 'Unknown/Garbage',
      originalFormat: currentExt,
      fixable: false,
      suggestedAction: 'File header is completely destroyed. Restore from backup.'
    };
  }

  if (detectedExt !== currentExt && detectedExt !== 'unknown') {
    // MISLABELED CASE (e.g., PNG saved as JPG)
    // The "Fix" is simply creating a new blob with the correct type
    const repairedBlob = new Blob([buffer], { type: `image/${detectedExt}` });
    
    return {
      status: 'MISLABELED',
      detectedFormat: detectedExt,
      originalFormat: currentExt,
      fixable: true,
      suggestedAction: `File is actually a ${detectedExt.toUpperCase()}. We can auto-rename it.`,
      repairedFile: repairedBlob
    };
  }

  // 3. Truncation Check (Advanced)
  // Check specifically for JPG end-of-file marker (FF D9)
  if (detectedExt === 'jpg') {
    const lastBytes = Array.from(bytes.slice(-2))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (lastBytes !== 'ffd9') {
       return {
        status: 'CORRUPT',
        detectedFormat: 'jpg',
        originalFormat: 'jpg',
        fixable: false, // Hard to fix perfectly without AI
        suggestedAction: 'Image is truncated (incomplete download). Bottom part is missing.'
      };
    }
  }

  return {
    status: 'HEALTHY',
    detectedFormat: detectedExt,
    originalFormat: currentExt,
    fixable: false,
    suggestedAction: 'No issues found.'
  };
}

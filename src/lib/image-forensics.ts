// src/lib/image-forensics.ts

export type ImageHealthReport = {
  status: 'HEALTHY' | 'CORRUPT' | 'MISLABELED';
  detectedFormat: string;
  originalFormat: string;
  fixable: boolean;
  suggestedAction: string;
  repairedFile?: Blob; // The fixed file
};

const MAGIC_BYTES: Record<string, { ext: string; mime: string }> = {
  'ffd8ff': { ext: 'jpg', mime: 'image/jpeg' },
  '89504e47': { ext: 'png', mime: 'image/png' },
  '47494638': { ext: 'gif', mime: 'image/gif' },
  '25504446': { ext: 'pdf', mime: 'application/pdf' },
  '49492a00': { ext: 'tiff', mime: 'image/tiff' }, // Intel byte order
  '4d4d002a': { ext: 'tiff', mime: 'image/tiff' }, // Motorola byte order
  '424d': { ext: 'bmp', mime: 'image/bmp' },
  '52494646': { ext: 'webp', mime: 'image/webp' }
};

// Helper function to find a signature within a byte array
const findSignatureOffset = (bytes: Uint8Array): { signature: string, offset: number } | null => {
    const hexString = Array.from(bytes.slice(0, Math.min(bytes.length, 4096))) // Scan first 4KB for performance
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    for (const [signature, _] of Object.entries(MAGIC_BYTES)) {
        const index = hexString.indexOf(signature);
        if (index !== -1 && index % 2 === 0) { // Ensure it's on a byte boundary
            return { signature, offset: index / 2 };
        }
    }
    return null;
};


export async function diagnoseAndRepairImage(file: File): Promise<ImageHealthReport> {
  // 1. Safety Check: Is the file literally empty (0 bytes)?
  if (file.size === 0) {
    return {
      status: 'CORRUPT',
      detectedFormat: 'EMPTY_FILE',
      originalFormat: file.name.split('.').pop()?.toLowerCase() || '',
      fixable: false,
      suggestedAction: 'This file is 0 bytes. The data was never written to disk. Impossible to recover.'
    };
  }
  
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 2. "The Zero-Fill Check" (New Feature)
  // Checks if the file has size but is filled with only zeros (0x00 0x00...)
  const isAllZeros = bytes.slice(0, 100).every(b => b === 0); // Check first 100 bytes
  if (isAllZeros) {
    return {
      status: 'CORRUPT',
      detectedFormat: 'NULL_BYTES',
      originalFormat: file.name.split('.').pop()?.toLowerCase() || '',
      fixable: false,
      suggestedAction: 'File contains only blank space (Null Bytes). Upload likely failed midway. Unrecoverable.'
    };
  }

  const currentExt = file.name.split('.').pop()?.toLowerCase() || '';

  const signatureInfo = findSignatureOffset(bytes);

  if (!signatureInfo) {
    return {
      status: 'CORRUPT',
      detectedFormat: 'Unknown/Garbage',
      originalFormat: currentExt,
      fixable: false,
      suggestedAction: 'File header is completely destroyed and no known signature was found. Recovery is not possible with this tool.'
    };
  }
  
  const { signature, offset } = signatureInfo;
  const detectedInfo = MAGIC_BYTES[signature];
  const isJpg = detectedInfo.ext === 'jpg';

  let isTruncated = false;
  let dataToProcess = bytes;

  if (offset > 0) {
    // Garbage header detected. We will work with the sliced data.
    dataToProcess = bytes.slice(offset);
  }

  // Check for JPEG truncation *on the relevant data part*
  if (isJpg) {
    const eoiMarker = new Uint8Array([0xFF, 0xD9]);
    let eoiFound = false;
    // Search for EOI in the last few bytes for performance
    for (let i = dataToProcess.length - 2; i > dataToProcess.length - 1024 && i >= 0; i--) {
        if (dataToProcess[i] === eoiMarker[0] && dataToProcess[i+1] === eoiMarker[1]) {
            eoiFound = true;
            break;
        }
    }
    if (!eoiFound) {
      isTruncated = true;
    }
  }

  // Build the report based on our findings.
  if (offset === 0) { // Signature is at the start
    if (isTruncated) {
      const repairedBuffer = new Uint8Array(dataToProcess.length + 2);
      repairedBuffer.set(dataToProcess);
      repairedBuffer.set([0xFF, 0xD9], dataToProcess.length);
      const repairedBlob = new Blob([repairedBuffer], { type: detectedInfo.mime });
      return {
        status: 'CORRUPT',
        detectedFormat: 'jpg',
        originalFormat: currentExt,
        fixable: true,
        suggestedAction: `JPEG is truncated (missing end-of-file marker). Attempting to repair by appending a valid footer.`,
        repairedFile: repairedBlob,
      };
    }
    if (detectedInfo.ext === currentExt) {
      return {
        status: 'HEALTHY',
        detectedFormat: detectedInfo.ext,
        originalFormat: currentExt,
        fixable: false,
        suggestedAction: 'No issues found.'
      };
    } else {
      const repairedBlob = new Blob([dataToProcess], { type: detectedInfo.mime });
      return {
        status: 'MISLABELED',
        detectedFormat: detectedInfo.ext,
        originalFormat: currentExt,
        fixable: true,
        suggestedAction: `File has a .${currentExt.toUpperCase()} extension but is actually a ${detectedInfo.ext.toUpperCase()}. Repairing the file type.`,
        repairedFile: repairedBlob
      };
    }
  } else { // Signature is inside the file (offset > 0)
    let repairedBuffer = dataToProcess;
    let action = `Found a valid ${detectedInfo.ext.toUpperCase()} signature after ${offset} bytes of garbage data. Carving out the valid data.`;
    
    if (isTruncated) {
      // Append EOI marker to the carved data.
      const tempBuffer = new Uint8Array(dataToProcess.length + 2);
      tempBuffer.set(dataToProcess);
      tempBuffer.set([0xFF, 0xD9], dataToProcess.length);
      repairedBuffer = tempBuffer;
      action += ' The carved data also appears to be a truncated JPEG, so a footer has been appended.'
    }
    
    const repairedBlob = new Blob([repairedBuffer], { type: detectedInfo.mime });
    return {
      status: 'CORRUPT',
      detectedFormat: detectedInfo.ext,
      originalFormat: currentExt,
      fixable: true,
      suggestedAction: action,
      repairedFile: repairedBlob,
    };
  }
}

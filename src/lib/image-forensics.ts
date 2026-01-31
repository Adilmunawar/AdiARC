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
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
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

  if (offset === 0) {
    // The signature is at the start of the file, it's either HEALTHY or MISLABELED
    if (detectedInfo.ext === currentExt) {
       // Optional: Advanced check for truncation etc.
        if (detectedInfo.ext === 'jpg') {
            const lastBytesHex = Array.from(bytes.slice(-2)).map(b => b.toString(16).padStart(2, '0')).join('');
            if (lastBytesHex !== 'ffd9') {
                return {
                    status: 'CORRUPT',
                    detectedFormat: 'jpg',
                    originalFormat: 'jpg',
                    fixable: false,
                    suggestedAction: 'Image is truncated (incomplete download). The end of the file is missing.'
                };
            }
        }
       return {
            status: 'HEALTHY',
            detectedFormat: detectedInfo.ext,
            originalFormat: currentExt,
            fixable: false,
            suggestedAction: 'File appears healthy. No repair needed.'
        };
    } else {
        // MISLABELED CASE
        const repairedBlob = new Blob([buffer], { type: detectedInfo.mime });
        return {
            status: 'MISLABELED',
            detectedFormat: detectedInfo.ext,
            originalFormat: currentExt,
            fixable: true,
            suggestedAction: `File has a .${currentExt.toUpperCase()} extension but is actually a ${detectedInfo.ext.toUpperCase()}.`,
            repairedFile: repairedBlob
        };
    }
  } else {
    // The signature was found inside the file. This is the GARBAGE HEADER / RECOVERY case.
    const recoveredBuffer = buffer.slice(offset);
    const repairedBlob = new Blob([recoveredBuffer], { type: detectedInfo.mime });

    return {
        status: 'CORRUPT',
        detectedFormat: detectedInfo.ext,
        originalFormat: currentExt,
        fixable: true,
        suggestedAction: `Found a valid ${detectedInfo.ext.toUpperCase()} signature after ${offset} bytes of garbage data. We can attempt a full recovery.`,
        repairedFile: repairedBlob
    };
  }
}

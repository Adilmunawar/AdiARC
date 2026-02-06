// src/lib/image-forensics.ts

export type ImageHealthReport = {
  status: 'HEALTHY' | 'CORRUPT' | 'MISLABELED' | 'DESTROYED';
  detectedFormat: string;
  originalFormat: string;
  fixable: boolean;
  suggestedAction: string;
  entropy?: number;
  repairedFile?: Blob;
  offset?: number;
  isTruncated?: boolean;
  headerHex?: string;
  footerHex?: string;
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

/**
 * Calculates the Shannon Entropy of a byte array.
 * Returns 0-8. 
 * - Close to 0: File is all zeros or repeated text (Unrecoverable).
 * - Close to 8: File is encrypted or compressed data (Recoverable).
 */
function calculateEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }
  
  return frequencies.reduce((sum, freq) => {
    if (freq === 0) return sum;
    const p = freq / bytes.length;
    return sum - (p * Math.log2(p));
  }, 0);
}


const findSignatureOffset = (bytes: Uint8Array): { signature: string, offset: number } | null => {
    const hexString = Array.from(bytes.slice(0, Math.min(bytes.length, 4096)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    for (const [signature, _] of Object.entries(MAGIC_BYTES)) {
        const index = hexString.indexOf(signature);
        if (index !== -1 && index % 2 === 0) {
            return { signature, offset: index / 2 };
        }
    }
    return null;
};

export async function diagnoseAndRepairImage(file: File): Promise<ImageHealthReport> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Calculate entropy on the first 16KB for performance.
  const entropy = calculateEntropy(bytes.slice(0, 16384));
  const entropyValue = Number(entropy.toFixed(2));
  const originalFormat = file.name.split('.').pop()?.toLowerCase() || '';
  const headerHex = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
  const footerHex = bytes.length > 2 ? Array.from(bytes.slice(-2)).map(b => b.toString(16).padStart(2, '0')).join(' ') : '';


  // THE DEATH CERTIFICATE: Entropy < 1.0 means no meaningful data.
  if (entropy < 1.0) {
    return {
      status: 'DESTROYED',
      detectedFormat: 'NULL_DATA',
      originalFormat: originalFormat,
      entropy: entropyValue,
      fixable: false,
      suggestedAction: `File is ${Math.round(file.size / 1024)}KB of empty space (Entropy: ${entropyValue}). The data was never written. RE-SCAN OR RE-UPLOAD IS REQUIRED.`,
      headerHex,
      footerHex
    };
  }

  const signatureInfo = findSignatureOffset(bytes);

  if (!signatureInfo) {
    const suggestedAction = entropy > 7.0 
      ? `File contains dense data (Entropy: ${entropyValue}) but has no known header. It might be a raw camera stream or encrypted file.`
      : `File header is destroyed and no known signature was found. Recovery is not possible with this tool.`;
    return {
      status: 'CORRUPT',
      detectedFormat: entropy > 7.0 ? 'RAW_DATA' : 'Unknown/Garbage',
      originalFormat,
      fixable: false,
      entropy: entropyValue,
      suggestedAction,
      headerHex,
      footerHex
    };
  }

  const { signature, offset } = signatureInfo;
  const detectedInfo = MAGIC_BYTES[signature];
  
  let dataToProcess = bytes.slice(offset);
  let isTruncated = false;

  if (detectedInfo.ext === 'jpg') {
    let eoiFound = false;
    // Search for EOI in the last few KB for performance
    for (let i = dataToProcess.length - 2; i >= 0 && i > dataToProcess.length - 4096; i--) {
        if (dataToProcess[i] === 0xFF && dataToProcess[i+1] === 0xD9) {
            eoiFound = true;
            break;
        }
    }
    if (!eoiFound) isTruncated = true;
  }
  
  let repairedBuffer = dataToProcess;
  let action = "";
  let isFixable = false;

  if (offset > 0) { // Garbage header
      isFixable = true;
      action = `Found a valid ${detectedInfo.ext.toUpperCase()} signature after ${offset} bytes of garbage data. Carving out the valid data.`;
  }
  if (isTruncated) {
      isFixable = true;
      const tempBuffer = new Uint8Array(repairedBuffer.length + 2);
      tempBuffer.set(repairedBuffer);
      tempBuffer.set([0xFF, 0xD9], repairedBuffer.length);
      repairedBuffer = tempBuffer;
      action = action 
          ? action + ' Additionally, the carved JPEG data was truncated; a footer has been appended.'
          : 'JPEG is truncated (missing end-of-file marker). Appending a valid footer.';
  }

  if (isFixable) {
      return {
          status: 'CORRUPT',
          detectedFormat: detectedInfo.ext,
          originalFormat,
          fixable: true,
          suggestedAction: action,
          entropy: entropyValue,
          repairedFile: new Blob([repairedBuffer], { type: detectedInfo.mime }),
          offset,
          isTruncated,
          headerHex,
          footerHex
      };
  }
  
  if (detectedInfo.ext !== originalFormat) {
    return {
        status: 'MISLABELED',
        detectedFormat: detectedInfo.ext,
        originalFormat,
        fixable: true,
        suggestedAction: `File has a .${originalFormat.toUpperCase()} extension but is actually a ${detectedInfo.ext.toUpperCase()}. Repairing the file type.`,
        entropy: entropyValue,
        repairedFile: new Blob([bytes], { type: detectedInfo.mime }),
        offset,
        isTruncated,
        headerHex,
        footerHex
    };
  }

  return {
    status: 'HEALTHY',
    detectedFormat: detectedInfo.ext,
    originalFormat,
    fixable: false,
    suggestedAction: 'No issues found. File appears to be healthy.',
    entropy: entropyValue,
    offset,
    isTruncated,
    headerHex,
    footerHex
  };
}

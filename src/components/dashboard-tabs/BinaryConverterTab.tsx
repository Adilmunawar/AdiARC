
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Image as ImageIcon, Trash2, Download, Eye } from 'lucide-react';
import Image from 'next/image';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ImageData = {
  id: number;
  src: string;
  label: string;
};

// Helper to convert a hex string to a Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
    const cleanedHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanedHex.length / 2);
    for (let i = 0; i < cleanedHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanedHex.substr(i, 2), 16);
    }
    return bytes;
};

export function BinaryConverterTab() {
  const { toast } = useToast();
  const [binaryData, setBinaryData] = useState('');
  const [images, setImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);

  const handleDownloadImage = (imageSrc: string, label: string) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `${label.replace(/\s+/g, '_')}.jpg`; // e.g., "Image_1.jpg"
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Download Started',
      description: `Downloading ${link.download}.`,
    });
  };

  const handleConvert = () => {
    if (!binaryData.trim()) {
      toast({
        title: 'No Data Provided',
        description: 'Please paste the binary data into the text area first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setImages([]);

    // Use a timeout to allow the UI to update to the loading state
    setTimeout(() => {
      try {
        let binaryStrings: string[] = [];
        const trimmedData = binaryData.trim();

        // 1. Detect input format (JSON array or line-separated)
        if (trimmedData.startsWith('[') && trimmedData.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmedData);
            if (Array.isArray(parsed)) {
              binaryStrings = parsed.map(String);
            } else {
              throw new Error('JSON is not an array.');
            }
          } catch (e) {
            toast({
              title: 'Invalid JSON Format',
              description: 'The data looks like JSON but could not be parsed. Falling back to line-separated format.',
              variant: 'destructive',
            });
            // Fallback for malformed JSON
            binaryStrings = trimmedData.split(/[\r\n]+/).filter(Boolean);
          }
        } else {
          // Line-separated format
          binaryStrings = trimmedData.split(/[\r\n]+/).filter(Boolean);
        }

        const generatedImages: ImageData[] = [];
        let errorCount = 0;

        binaryStrings.forEach((str, index) => {
          const cleanStr = str.trim();
          if (!cleanStr) return;

          try {
            let src = '';
            // 2. Determine if it's hex or base64 or a full data URI
            if (cleanStr.startsWith('data:')) {
                // It's already a full data URI
                src = cleanStr;
            } else if (/^(0x)?[0-9a-fA-F]+$/.test(cleanStr)) {
              // It's a hex string
              const bytes = hexToBytes(cleanStr);
              const blob = new Blob([bytes], { type: 'image/jpeg' }); // Assume jpeg
              src = URL.createObjectURL(blob);
            } else {
              // Assume it's a raw base64 string
              if (/^[A-Za-z0-9+/=]+$/.test(cleanStr.replace(/\s/g, ''))) {
                 src = `data:image/jpeg;base64,${cleanStr}`;
              } else {
                  throw new Error("String is not valid Hex or Base64.");
              }
            }
            
            generatedImages.push({
              id: index,
              src: src,
              label: `Image ${index + 1}`,
            });

          } catch (e: any) {
            errorCount++;
            console.error(`Failed to process string at index ${index}:`, e.message);
          }
        });
        
        if(errorCount > 0) {
            toast({
                title: 'Processing Finished with Errors',
                description: `Successfully generated ${generatedImages.length} images. Failed to process ${errorCount} data strings.`,
                variant: 'destructive',
            });
        } else {
             toast({
                title: 'Conversion Complete',
                description: `Successfully generated ${generatedImages.length} images.`,
            });
        }
       
        setImages(generatedImages);

      } catch (e: any) {
        toast({
          title: 'Conversion Failed',
          description: e.message || 'An unexpected error occurred during processing.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }, 50);
  };
  
  const handleClear = () => {
    setBinaryData('');
    setImages([]);
    toast({ title: 'Cleared', description: 'Input and results have been cleared.' });
  };

  return (
    <>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Image Preview: {previewImage?.label}</DialogTitle>
          </DialogHeader>
          <div className="relative h-full w-full">
            {previewImage && (
              <Image
                src={previewImage.src}
                alt={`Preview of ${previewImage.label}`}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ImageIcon className="h-5 w-5 text-primary" />
            Binary Data to Image Converter
          </CardTitle>
          <CardDescription>
            Paste raw binary data (as hex or base64 strings) to visualize the corresponding images. Supports JSON arrays or line-separated text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
              <Label htmlFor="binary-data-input">Binary Data Input</Label>
              <Textarea
                  id="binary-data-input"
                  value={binaryData}
                  onChange={(e) => setBinaryData(e.target.value)}
                  placeholder="Paste binary data here (JSON array or line-separated hex/base64 string)..."
                  className="h-64 font-mono text-xs"
                  disabled={isLoading}
              />
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
               <Button variant="outline" onClick={handleClear} disabled={isLoading || (!binaryData && images.length === 0)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
              </Button>
              <Button onClick={handleConvert} disabled={isLoading}>
                  {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Convert to Images
              </Button>
          </div>
          
          {images.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-dashed">
                  <h3 className="text-sm font-semibold">Generated Images ({images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map(image => (
                          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border">
                              <Image
                                  src={image.src}
                                  alt={image.label}
                                  fill
                                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                                  unoptimized // Important for blob URLs and base64
                              />
                               <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-7 w-7 rounded-full"
                                      onClick={() => setPreviewImage(image)}
                                      title="Preview"
                                  >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Preview image</span>
                                  </Button>
                                  <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-7 w-7 rounded-full"
                                      onClick={() => handleDownloadImage(image.src, image.label)}
                                      title="Download"
                                  >
                                      <Download className="h-4 w-4" />
                                      <span className="sr-only">Download image</span>
                                  </Button>
                              </div>
                              <div className="absolute bottom-0 w-full bg-black/50 p-1 text-center">
                                  <p className="text-xs font-medium text-white">{image.label}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </section>
          )}
        </CardContent>
      </Card>
    </>
  );
}

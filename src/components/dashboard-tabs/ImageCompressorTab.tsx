"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FolderUp, Loader2, Download, Minimize2, Trash2, FileImage, Settings2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '../ui/table';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import JSZip from 'jszip';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CompressedImage = {
  name: string;
  originalSize: number;
  compressedSize: number;
  dataUrl: string;
  format: string;
};

export function ImageCompressorTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Settings
  const [quality, setQuality] = useState([0.75]);
  const [maxWidth, setMaxWidth] = useState("2500");
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: "" });
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZippingProgress] = useState(0);

  const handleSelectFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const compressFile = (file: File): Promise<CompressedImage | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Optional: Downscale if image is massive to hit the 1MB target more reliably
          const maxDim = parseInt(maxWidth) || 2500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          // Use high-quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG (usually best for large photos)
          const dataUrl = canvas.toDataURL('image/jpeg', quality[0]);
          const compressedSize = Math.round((dataUrl.length * 3) / 4); // Approx base64 to byte size

          resolve({
            name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            originalSize: file.size,
            compressedSize: compressedSize,
            dataUrl: dataUrl,
            format: 'image/jpeg'
          });
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleStartProcessing = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setCompressedImages([]);
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
        toast({
            title: "No Images Found",
            description: "Please select valid image files.",
            variant: "destructive"
        });
        setIsProcessing(false);
        return;
    }

    setProgress({ current: 0, total: imageFiles.length, fileName: "Starting..." });

    const results: CompressedImage[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setProgress({ current: i + 1, total: imageFiles.length, fileName: file.name });
      const result = await compressFile(file);
      if (result) {
        results.push(result);
      }
      // Yield to UI thread every few images
      if (i % 5 === 0) await new Promise(res => setTimeout(res, 0));
    }

    setCompressedImages(results);
    setIsProcessing(false);
    toast({
      title: 'Compression Complete',
      description: `Successfully optimized ${results.length} images.`,
    });
  };

  const handleDownloadAll = async () => {
    if (compressedImages.length === 0) return;

    setIsZipping(true);
    setZippingProgress(0);

    try {
      const zip = new JSZip();
      compressedImages.forEach((img) => {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(img.name, base64Data, { base64: true });
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZippingProgress(metadata.percent);
      });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    } finally {
      setIsZipping(false);
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
  };

  return (
    <>
      <Dialog open={isZipping}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Creating ZIP Archive</DialogTitle>
            <DialogDescription>Packaging your optimized images...</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Progress value={zipProgress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">{Math.round(zipProgress)}%</p>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Minimize2 className="h-5 w-5 text-primary" />
            Image Compressor
          </CardTitle>
          <CardDescription>
            High-efficiency image optimization. Shrink massive 8MB photos down to ~1MB while preserving visual quality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Settings */}
            <div className="space-y-4 p-4 rounded-lg border border-dashed bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Compression Settings</h3>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <Label className="text-xs">Quality ({Math.round(quality[0] * 100)}%)</Label>
                        <span className="text-[10px] text-muted-foreground">Lower = Smaller size</span>
                    </div>
                    <Slider 
                        value={quality} 
                        onValueChange={setQuality} 
                        max={1} 
                        min={0.1} 
                        step={0.05} 
                    />
                </div>

                <div className="space-y-2 pt-2">
                    <Label className="text-xs">Max Dimension (Width/Height)</Label>
                    <Input 
                        type="number" 
                        value={maxWidth} 
                        onChange={(e) => setMaxWidth(e.target.value)}
                        placeholder="2500"
                        className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Larger images will be resized to this limit to ensure small file size.</p>
                </div>
            </div>

            {/* Upload */}
            <div className="flex flex-col justify-center items-center space-y-4 p-6 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5">
                <FolderUp className="h-10 w-10 text-primary/40" />
                <div className="text-center">
                    <p className="text-sm font-medium">Ready to optimize</p>
                    <p className="text-xs text-muted-foreground">Select photos to compress them in real-time.</p>
                </div>
                <Button
                    onClick={handleSelectFiles}
                    disabled={isProcessing || isZipping}
                    size="sm"
                    className="shadow-lg"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Minimize2 className="mr-2 h-4 w-4" />}
                    {isProcessing ? 'Compressing...' : 'Select Files'}
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleStartProcessing}
                    accept="image/jpeg,image/png,image/webp"
                />
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                  <p>Processing {progress.current} of {progress.total} files</p>
                  <p className="truncate max-w-[200px]">{progress.fileName}</p>
              </div>
            </div>
          )}
          
          {compressedImages.length > 0 && !isProcessing && (
            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Results ({compressedImages.length})</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCompressedImages([])}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                    </Button>
                    <Button onClick={handleDownloadAll} size="sm">
                        <Download className="mr-2 h-4 w-4" /> Download ZIP
                    </Button>
                </div>
              </div>

              <ScrollArea className="h-80 w-full rounded-md border bg-card/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Preview</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="text-right">Original</TableHead>
                      <TableHead className="text-right">Optimized</TableHead>
                      <TableHead className="text-right">Saved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compressedImages.map((image, index) => {
                      const reduction = image.originalSize - image.compressedSize;
                      const reductionPercent = (reduction / image.originalSize) * 100;
                      return (
                          <TableRow key={index} className="group">
                              <TableCell>
                                  <div className="relative h-10 w-10 rounded-md overflow-hidden border bg-muted">
                                      <Image src={image.dataUrl} alt={image.name} layout="fill" objectFit="cover" unoptimized />
                                  </div>
                              </TableCell>
                              <TableCell className="font-medium text-[11px] truncate max-w-[150px]">{image.name}</TableCell>
                              <TableCell className="text-right text-[11px] text-muted-foreground">{formatBytes(image.originalSize)}</TableCell>
                              <TableCell className="text-right text-[11px] font-bold text-primary">{formatBytes(image.compressedSize)}</TableCell>
                              <TableCell className="text-right text-[11px] text-green-600 font-medium">
                                  -{reductionPercent.toFixed(0)}%
                              </TableCell>
                          </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

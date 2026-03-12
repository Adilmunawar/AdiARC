
"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FolderUp, Loader2, Download, Minimize2, Trash2, FileImage, Settings2, CheckCircle, Zap, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JSZip from 'jszip';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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
  const [maxWidth, setMaxWidth] = useState("2000");
  const [outputFormat, setOutputFormat] = useState<"image/jpeg" | "image/webp" | "image/png">("image/jpeg");
  
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

          // Downscale to hit target size if dimensions are huge
          const maxDim = parseInt(maxWidth) || 2000;
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
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Quality only applies to JPEG and WebP
          const finalFormat = outputFormat;
          const dataUrl = canvas.toDataURL(finalFormat, finalFormat === 'image/png' ? undefined : quality[0]);
          
          // Calculate byte size from base64
          const base64Str = dataUrl.split(',')[1];
          const compressedSize = Math.floor(base64Str.length * 0.75);

          const ext = finalFormat.split('/')[1];
          resolve({
            name: file.name.replace(/\.[^/.]+$/, "") + `_optimized.${ext}`,
            originalSize: file.size,
            compressedSize: compressedSize,
            dataUrl: dataUrl,
            format: finalFormat
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
      // UI Yield
      if (i % 3 === 0) await new Promise(res => setTimeout(res, 0));
    }

    setCompressedImages(results);
    setIsProcessing(false);
    toast({
      title: 'Optimization Complete',
      description: `Successfully compressed ${results.length} images.`,
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
      a.download = `optimized_batch_${Date.now()}.zip`;
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

  const totalSaved = compressedImages.reduce((acc, curr) => acc + (curr.originalSize - curr.compressedSize), 0);
  const avgReduction = compressedImages.length > 0 
    ? (compressedImages.reduce((acc, curr) => acc + (1 - curr.compressedSize/curr.originalSize), 0) / compressedImages.length) * 100 
    : 0;

  return (
    <>
      <Dialog open={isZipping}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Creating ZIP Archive</DialogTitle>
            <DialogDescription>Packaging your optimized images for download...</DialogDescription>
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
            Advanced Image Compressor
          </CardTitle>
          <CardDescription>
            Optimized for large 8MB+ photos. Shrink files to ~1MB targets while maintaining professional visual fidelity. All processing is 100% local.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Settings */}
            <div className="lg:col-span-2 space-y-4 p-4 rounded-lg border border-dashed bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Optimization Settings</h3>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label className="text-xs">Quality ({Math.round(quality[0] * 100)}%)</Label>
                                <span className="text-[10px] text-muted-foreground">High quality = Larger file</span>
                            </div>
                            <Slider 
                                value={quality} 
                                onValueChange={setQuality} 
                                max={1} 
                                min={0.1} 
                                step={0.05} 
                                disabled={outputFormat === 'image/png'}
                            />
                            {outputFormat === 'image/png' && <p className="text-[9px] text-amber-600">Note: PNG is lossless; quality slider ignored.</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Max Resolution (px)</Label>
                            <Input 
                                type="number" 
                                value={maxWidth} 
                                onChange={(e) => setMaxWidth(e.target.value)}
                                placeholder="2000"
                                className="h-8 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">Images will be resized to fit this dimension if larger.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Output Format</Label>
                            <Select value={outputFormat} onValueChange={(v: any) => setOutputFormat(v)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="image/jpeg">JPEG (Recommended)</SelectItem>
                                    <SelectItem value="image/webp">WebP (Best Compression)</SelectItem>
                                    <SelectItem value="image/png">PNG (Lossless)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {compressedImages.length > 0 && (
                            <div className="p-3 rounded-md bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 text-primary mb-1">
                                    <Zap className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Batch Savings</span>
                                </div>
                                <p className="text-xl font-bold">{formatBytes(totalSaved)}</p>
                                <p className="text-[10px] text-muted-foreground">Average reduction: {avgReduction.toFixed(1)}%</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Area */}
            <div className="flex flex-col justify-center items-center space-y-4 p-6 rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group cursor-pointer" onClick={handleSelectFiles}>
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FolderUp className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold">Drop images or click</p>
                    <p className="text-[10px] text-muted-foreground">Supports JPEG, PNG, WebP</p>
                </div>
                <Button
                    variant="secondary"
                    disabled={isProcessing || isZipping}
                    size="sm"
                    className="h-8 text-xs pointer-events-none"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Minimize2 className="mr-2 h-3 w-3" />}
                    {isProcessing ? 'Optimizing...' : 'Start Selection'}
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
            <div className="space-y-2 animate-pulse">
              <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                  <p>Processing {progress.current} of {progress.total} files</p>
                  <p className="truncate max-w-[200px] italic">Current: {progress.fileName}</p>
              </div>
            </div>
          )}
          
          {compressedImages.length > 0 && !isProcessing && (
            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Processed Batch ({compressedImages.length})
                </h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setCompressedImages([])}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear Results
                    </Button>
                    <Button onClick={handleDownloadAll} size="sm" className="h-8 text-xs shadow-md">
                        <Download className="mr-2 h-3.5 w-3.5" /> Download ZIP
                    </Button>
                </div>
              </div>

              <ScrollArea className="h-80 w-full rounded-md border bg-card/50">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-[60px]">Preview</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="text-right">Original</TableHead>
                      <TableHead className="text-right font-bold text-primary">Optimized</TableHead>
                      <TableHead className="text-right">Saved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compressedImages.map((image, index) => {
                      const reduction = image.originalSize - image.compressedSize;
                      const reductionPercent = (reduction / image.originalSize) * 100;
                      return (
                          <TableRow key={index} className="group hover:bg-muted/30 transition-colors">
                              <TableCell>
                                  <div className="relative h-10 w-10 rounded-md overflow-hidden border bg-black/5">
                                      <Image src={image.dataUrl} alt={image.name} layout="fill" objectFit="cover" unoptimized />
                                  </div>
                              </TableCell>
                              <TableCell className="font-medium text-[11px] truncate max-w-[180px]" title={image.name}>
                                {image.name}
                              </TableCell>
                              <TableCell className="text-right text-[11px] text-muted-foreground tabular-nums">{formatBytes(image.originalSize)}</TableCell>
                              <TableCell className="text-right text-[11px] font-bold text-primary tabular-nums">{formatBytes(image.compressedSize)}</TableCell>
                              <TableCell className="text-right text-[11px] text-green-600 font-medium tabular-nums">
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

          {!isProcessing && compressedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40 space-y-2">
                  <ImageIcon className="h-12 w-12 stroke-[1px]" />
                  <p className="text-xs">No images processed in this session.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

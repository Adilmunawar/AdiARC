
"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FolderUp, Loader2, Download, FileMinus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '../ui/table';
import JSZip from 'jszip';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StrippedImage = {
  name: string;
  originalSize: number;
  strippedSize: number;
  dataUrl: string;
};

export function MetaRemoverTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [strippingProgress, setStrippingProgress] = useState({ current: 0, total: 0, currentFileName: "" });
  const [isZipping, setIsZipping] = useState(false);
  const [zippingProgress, setZippingProgress] = useState(0);
  const [strippedImages, setStrippedImages] = useState<StrippedImage[]>([]);
  const [filterQaOnly, setFilterQaOnly] = useState(false);

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFile = (file: File): Promise<StrippedImage | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const strippedSize = atob(dataUrl.split(',')[1]).length;

          resolve({
            name: file.name.replace(/\.QA/gi, ''),
            originalSize: file.size,
            strippedSize: strippedSize,
            dataUrl: dataUrl,
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

    setIsStripping(true);
    setStrippedImages([]);
    
    let imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (filterQaOnly) {
      const originalCount = imageFiles.length;
      imageFiles = imageFiles.filter(f => f.name.toUpperCase().includes('.QA'));
      toast({
        title: "Filter Applied",
        description: `Selected ${imageFiles.length} files containing ".QA" out of ${originalCount} total images.`
      })
    }

    if (imageFiles.length === 0) {
        toast({
            title: "No Matching Files",
            description: "No images found that match your filter criteria.",
            variant: "destructive"
        });
        setIsStripping(false);
        return;
    }

    setStrippingProgress({ current: 0, total: imageFiles.length, currentFileName: "Initializing..." });

    const newStrippedImages: StrippedImage[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setStrippingProgress({ current: i + 1, total: imageFiles.length, currentFileName: `Stripping: ${file.name}` });
      const result = await processFile(file);
      if (result) {
        newStrippedImages.push(result);
      }
       if (i % 20 === 0) {
          await new Promise(res => setTimeout(res, 0));
       }
    }

    setStrippedImages(newStrippedImages);
    setIsStripping(false);
    toast({
      title: 'Processing Complete',
      description: `Stripped metadata from ${newStrippedImages.length} of ${imageFiles.length} images.`,
    });
  };

  const handleDownloadAll = async () => {
    if (strippedImages.length === 0) {
      toast({ title: "No images to download.", variant: "destructive" });
      return;
    }

    setIsZipping(true);
    setZippingProgress(0);
    toast({ title: "Preparing ZIP file...", description: "This may take a moment for many images." });

    try {
      const zip = new JSZip();
      for (let i = 0; i < strippedImages.length; i++) {
        const image = strippedImages[i];
        const base64Data = image.dataUrl.split(',')[1];
        zip.file(image.name, base64Data, { base64: true });
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZippingProgress(metadata.percent);
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'stripped-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("ZIP creation failed:", error);
      toast({ title: "Failed to create ZIP file.", variant: "destructive" });
    } finally {
      setIsZipping(false);
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <>
      <Dialog open={isZipping}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Preparing Your ZIP File</DialogTitle>
            <DialogDescription>
                Please wait while we package the stripped images. This may take a moment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Progress value={zippingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                    Archiving... {Math.round(zippingProgress)}%
                </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileMinus className="h-5 w-5 text-primary" />
            Image Metadata Remover
          </CardTitle>
          <CardDescription>
            Select a folder to strip all EXIF and metadata tags from your images. The processed images will be available for download. This process happens entirely in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <Button
              onClick={handleFolderSelect}
              disabled={isStripping || isZipping}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <FolderUp className="mr-2 h-5 w-5" />
              {isStripping ? 'Processing...' : 'Select Folder and Start Removing Tags'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              className="hidden"
              onChange={handleStartProcessing}
            />
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                  id="qa-filter-toggle"
                  checked={filterQaOnly}
                  onCheckedChange={setFilterQaOnly}
                  disabled={isStripping || isZipping}
              />
              <Label htmlFor="qa-filter-toggle" className="cursor-pointer">
                  Only process images with ".QA" in their filename
              </Label>
            </div>
          </section>

          {isStripping && (
            <section className="space-y-2">
              <Progress value={strippingProgress.total > 0 ? (strippingProgress.current / strippingProgress.total) * 100 : 0} className="h-2" />
              <div className="text-center text-xs text-muted-foreground pt-1">
                  <p>
                      Processing {strippingProgress.current} of {strippingProgress.total} files...
                  </p>
                  {strippingProgress.currentFileName && (
                      <p className="truncate text-muted-foreground/80">
                          {strippingProgress.currentFileName}
                      </p>
                  )}
              </div>
            </section>
          )}
          
          {strippedImages.length > 0 && !isStripping && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Processed Images ({strippedImages.length})</h3>
                <Button onClick={handleDownloadAll} disabled={isStripping || isZipping} size="sm">
                  {isZipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download All as ZIP
                </Button>
              </div>

              <ScrollArea className="h-96 w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Preview</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="text-right">Original Size</TableHead>
                      <TableHead className="text-right">New Size</TableHead>
                      <TableHead className="text-right">Reduction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strippedImages.map((image, index) => {
                      const reduction = image.originalSize - image.strippedSize;
                      const reductionPercent = image.originalSize > 0 ? (reduction / image.originalSize) * 100 : 0;
                      return (
                          <TableRow key={index}>
                              <TableCell>
                                  <div className="relative h-10 w-10 rounded-md overflow-hidden border">
                                      <Image src={image.dataUrl} alt={image.name} layout="fill" objectFit="cover" />
                                  </div>
                              </TableCell>
                              <TableCell className="font-medium text-xs">{image.name}</TableCell>
                              <TableCell className="text-right text-xs">{formatBytes(image.originalSize)}</TableCell>
                              <TableCell className="text-right text-xs">{formatBytes(image.strippedSize)}</TableCell>
                              <TableCell className="text-right text-xs text-green-600">
                                  {formatBytes(reduction)} ({reductionPercent.toFixed(1)}%)
                              </TableCell>
                          </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </section>
          )}
        </CardContent>
      </Card>
    </>
  );
}

    
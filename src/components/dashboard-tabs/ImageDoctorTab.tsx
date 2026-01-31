"use client";

import { useState, useRef } from 'react';
import { diagnoseAndRepairImage, ImageHealthReport } from '@/lib/image-forensics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Download, UploadCloud, HeartPulse, FileQuestion, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';

export function ImageDoctorTab() {
  const [report, setReport] = useState<ImageHealthReport | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setOriginalImagePreview(URL.createObjectURL(file));
      const result = await diagnoseAndRepairImage(file);
      setReport(result);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const downloadRepaired = () => {
    if (report?.repairedFile) {
      const url = URL.createObjectURL(report.repairedFile);
      const a = document.createElement('a');
      const originalName = fileName?.split('.').slice(0, -1).join('.') || 'repaired_image';
      a.href = url;
      a.download = `${originalName}.${report.detectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  const getStatusInfo = () => {
    switch (report?.status) {
        case 'HEALTHY':
            return { icon: CheckCircle, color: 'text-green-600', title: 'Healthy' };
        case 'MISLABELED':
            return { icon: AlertTriangle, color: 'text-amber-500', title: 'Mislabeled' };
        case 'CORRUPT':
            return { icon: XCircle, color: 'text-red-600', title: 'Corrupt' };
        default:
            return { icon: FileQuestion, color: 'text-muted-foreground', title: 'Awaiting File' };
    }
  }
  
  const StatusIcon = getStatusInfo().icon;


  return (
    <Card className="max-w-4xl mx-auto border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <HeartPulse className="h-5 w-5 text-primary"/>
                Forensic Image Doctor
            </CardTitle>
            <CardDescription>
                Diagnose and repair corrupt images by analyzing their binary signature (magic bytes). Ideal for fixing mislabeled files from scanners (e.g., a TIFF saved as a JPG).
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.tiff"/>
            <Button onClick={handleButtonClick} variant="outline" size="lg" className="w-full">
                <UploadCloud className="mr-2 h-5 w-5" />
                Select an Image or Document to Diagnose
            </Button>
            
            {report && originalImagePreview && (
                <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-dashed animate-fade-in-up">
                    {/* Left: Preview */}
                    <div className="space-y-3">
                        <Label>Original File Preview</Label>
                        <div className="relative w-full aspect-video rounded-lg border bg-muted/30 flex items-center justify-center">
                             <Image src={originalImagePreview} alt="Original Upload" layout="fill" objectFit="contain" className="rounded-lg"/>
                        </div>
                    </div>
                    {/* Right: Report */}
                    <div className="space-y-4">
                        <Label>Diagnosis Report</Label>
                         <Card className="p-4">
                            <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-2">
                                  <StatusIcon className={cn("h-6 w-6", getStatusInfo().color)} />
                                  <span className={cn("font-bold text-lg", getStatusInfo().color)}>
                                    {getStatusInfo().title}
                                  </span>
                               </div>
                               {fileName && <Badge variant="secondary">{fileName}</Badge>}
                            </div>
                            
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p><strong>Detected Format (DNA):</strong> <span className="font-semibold text-foreground">{report.detectedFormat.toUpperCase()}</span></p>
                                <p><strong>Original Extension:</strong> <span className="font-semibold text-foreground">{report.originalFormat.toUpperCase()}</span></p>
                            </div>
                            
                            <Alert className="mt-4">
                                <AlertTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4"/>Suggested Action</AlertTitle>
                                <AlertDescription>{report.suggestedAction}</AlertDescription>
                            </Alert>

                            {report.fixable && (
                                <Button onClick={downloadRepaired} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                                <Download className="mr-2 h-4 w-4"/>
                                Download Repaired File
                                </Button>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}

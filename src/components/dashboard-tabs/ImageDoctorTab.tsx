"use client";

import { useState, useRef } from 'react';
import { diagnoseAndRepairImage, ImageHealthReport } from '@/lib/image-forensics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Download, UploadCloud, HeartPulse, FileQuestion, Sparkles, Wand2, Skull } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export function ImageDoctorTab() {
  const [report, setReport] = useState<ImageHealthReport | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      try {
        const objectUrl = URL.createObjectURL(file);
        setOriginalImagePreview(objectUrl);
      } catch (error) {
        setOriginalImagePreview(null);
      }
      
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
      a.download = `${originalName}_repaired.${report.detectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  const getStatusInfo = () => {
    if (!report) {
       return { icon: FileQuestion, color: 'text-muted-foreground', title: 'Awaiting File' };
    }
    switch (report.status) {
        case 'HEALTHY':
            return { icon: CheckCircle, color: 'text-green-600', title: 'Healthy' };
        case 'MISLABELED':
            return { icon: AlertTriangle, color: 'text-amber-500', title: 'Mislabeled' };
        case 'CORRUPT':
            return { icon: report.fixable ? Wand2 : XCircle, color: report.fixable ? 'text-blue-500' : 'text-red-600', title: report.fixable ? 'Recoverable' : 'Corrupt' };
        case 'DESTROYED':
            return { icon: Skull, color: 'text-gray-500', title: 'Destroyed' };
        default:
            return { icon: FileQuestion, color: 'text-muted-foreground', title: 'Unknown' };
    }
  }
  
  const StatusIcon = getStatusInfo().icon;

  const getStatusBadgeVariant = (status: ImageHealthReport['status']) => {
    switch (status) {
      case 'HEALTHY': return 'default';
      case 'MISLABELED': return 'secondary';
      case 'CORRUPT': return report?.fixable ? 'default' : 'destructive';
      case 'DESTROYED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-border/70 bg-card/80 shadow-md animate-enter">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <HeartPulse className="h-5 w-5 text-primary"/>
                Forensic Image Doctor
            </CardTitle>
            <CardDescription>
                Diagnose and repair corrupt images by analyzing their binary signature (magic bytes) and information density (entropy).
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.tiff,.jpg,.jpeg,.png,.gif,.bmp,.webp"/>
            <Button onClick={handleButtonClick} variant="outline" size="lg" className="w-full">
                <UploadCloud className="mr-2 h-5 w-5" />
                Select an Image or Document to Diagnose
            </Button>
            
            {report && (
                <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-dashed animate-fade-in-up">
                    {/* Left: Preview */}
                    <div className="space-y-3">
                        <Label>Original File Preview</Label>
                        <div className="relative w-full aspect-video rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm p-2">
                             {originalImagePreview && report.status !== 'DESTROYED' ? 
                                <Image src={originalImagePreview} alt="Original Upload" fill objectFit="contain" className="rounded-lg" onError={() => setOriginalImagePreview(null)} unoptimized />
                                :
                                <span className="text-center">Preview not available (corrupt header or empty file)</span>
                            }
                        </div>
                    </div>
                    {/* Right: Report */}
                    <div className="space-y-4">
                        <Label>Forensic Analysis Report</Label>
                         <Card>
                            <CardHeader className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <StatusIcon className={cn("h-6 w-6", getStatusInfo().color)} />
                                    <span className={cn("font-bold text-lg", getStatusInfo().color)}>
                                        {getStatusInfo().title}
                                    </span>
                                </div>
                                {fileName && <Badge variant="secondary">{fileName}</Badge>}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground w-1/3">Status</TableCell>
                                            <TableCell><Badge variant={getStatusBadgeVariant(report.status)}>{report.status}</Badge></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">Detected Format</TableCell>
                                            <TableCell className="font-mono text-xs">{report.detectedFormat.toUpperCase()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">Original Extension</TableCell>
                                            <TableCell className="font-mono text-xs">{report.originalFormat.toUpperCase()}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">Information Density</TableCell>
                                            <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Progress value={report.entropy ? (report.entropy / 8) * 100 : 0} className="h-2 w-24" />
                                                <span className="font-mono text-xs text-muted-foreground">{report.entropy?.toFixed(2) ?? 'N/A'} / 8.00</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">Shannon entropy. Low values suggest empty or unrecoverable data.</p>
                                            </TableCell>
                                        </TableRow>
                                        {report.offset && report.offset > 0 ? (
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">Header Garbage</TableCell>
                                            <TableCell className="font-mono text-xs">{report.offset} bytes</TableCell>
                                        </TableRow>
                                        ) : null}
                                        {report.isTruncated ? (
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">File Truncated</TableCell>
                                            <TableCell className="font-mono text-xs text-amber-600">Yes (Missing EOI marker)</TableCell>
                                        </TableRow>
                                        ): null}
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">Magic Bytes (Header)</TableCell>
                                            <TableCell className="font-mono text-xs">{report.headerHex}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-xs text-muted-foreground">End of File Bytes</TableCell>
                                            <TableCell className="font-mono text-xs">{report.footerHex}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                         </Card>
                         <Alert className="mt-4">
                            <AlertTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4"/>Suggested Action</AlertTitle>
                            <AlertDescription>{report.suggestedAction}</AlertDescription>
                        </Alert>
                        {report.fixable && (
                            <Button onClick={downloadRepaired} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                            <Download className="mr-2 h-4 w-4"/>
                            {report.status === 'MISLABELED' ? 'Download Corrected File' : 'Attempt Full Recovery'}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}

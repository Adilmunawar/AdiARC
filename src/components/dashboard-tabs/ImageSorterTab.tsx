
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
    FolderOpen, 
    ChevronLeft, 
    ChevronRight, 
    ArrowRight, 
    Loader2, 
    Image as ImageIcon, 
    Hash, 
    CheckCircle2, 
    AlertCircle, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw,
    Move
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type FileEntry = {
    handle: FileSystemFileHandle;
    name: string;
};

export function ImageSorterTab() {
    const { toast } = useToast();
    
    // File State
    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    
    // UI State
    const [folderInput, setFolderInput] = useState("");
    const [zoom, setZoom] = useState(1);
    const [jumpValue, setJumpValue] = useState("");
    const [recentFolders, setRecentFolders] = useState<string[]>([]);
    
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter for images
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp', '.webp'];

    // --- REFINED: Dynamic Image Loading to prevent Memory Leaks ---
    const loadCurrentImage = useCallback(async () => {
        if (files.length === 0 || currentIndex < 0 || currentIndex >= files.length) {
            setCurrentImageUrl(null);
            return;
        }

        setIsImageLoading(true);
        try {
            const file = await files[currentIndex].handle.getFile();
            const url = URL.createObjectURL(file);
            
            // Clean up old URL
            setCurrentImageUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } catch (err) {
            console.error("Failed to load image:", err);
            toast({ variant: "destructive", title: "Read Error", description: "Could not load this specific file handle." });
        } finally {
            setIsImageLoading(false);
        }
    }, [files, currentIndex, toast]);

    useEffect(() => {
        loadCurrentImage();
    }, [loadCurrentImage]);

    const connectFolder = async () => {
        try {
            setIsConnecting(true);
            const handle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            setDirectoryHandle(handle);
            const entries: FileEntry[] = [];
            
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const ext = entry.name.split('.').pop()?.toLowerCase();
                    if (ext && IMAGE_EXTENSIONS.includes(`.${ext}`)) {
                        entries.push({
                            handle: entry,
                            name: entry.name
                        });
                    }
                }
            }

            if (entries.length === 0) {
                toast({ variant: "destructive", title: "No Images Found", description: "No valid image files were found in the selected folder." });
                setIsConnecting(false);
                return;
            }

            setFiles(entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
            setCurrentIndex(0);
            setIsConnecting(false);
            toast({ title: "Folder Connected", description: `Found ${entries.length} images ready for sorting.` });
            
            setTimeout(() => inputRef.current?.focus(), 100);
            
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast({ variant: "destructive", title: "Connection Failed", description: err.message });
            }
            setIsConnecting(false);
        }
    };

    const moveCurrentFile = async (targetFolderName: string) => {
        if (!directoryHandle || files.length === 0 || !targetFolderName.trim() || isMoving) return;

        setIsMoving(true);
        const currentFile = files[currentIndex];
        const folderName = targetFolderName.trim();

        try {
            const subDirHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });
            
            const extension = currentFile.name.split('.').pop() || 'jpg';
            let newFileName = `${folderName}.${extension}`;
            let counter = 2;

            while (true) {
                try {
                    await subDirHandle.getFileHandle(newFileName);
                    newFileName = `${folderName}(${counter}).${extension}`;
                    counter++;
                } catch {
                    break;
                }
            }

            const file = await currentFile.handle.getFile();
            const newFileHandle = await subDirHandle.getFileHandle(newFileName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            await directoryHandle.removeEntry(currentFile.name);

            toast({ 
                title: `Sorted to Folder ${folderName}`, 
                description: `Moved as: ${newFileName}`,
                duration: 2000 
            });

            setRecentFolders(prev => {
                const updated = [folderName, ...prev.filter(f => f !== folderName)].slice(0, 5);
                return updated;
            });

            const newFiles = [...files];
            newFiles.splice(currentIndex, 1);
            setFiles(newFiles);
            setFolderInput("");
            
            if (currentIndex >= newFiles.length && newFiles.length > 0) {
                setCurrentIndex(newFiles.length - 1);
            }

        } catch (err: any) {
            toast({ variant: "destructive", title: "Move Failed", description: err.message });
        } finally {
            setIsMoving(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            moveCurrentFile(folderInput);
        } else if (e.key === 'ArrowRight' && e.ctrlKey) {
            goToNext();
        } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
            goToPrev();
        }
    };

    const goToNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setZoom(1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setZoom(1);
        }
    };

    const handleJump = () => {
        const val = parseInt(jumpValue);
        if (!isNaN(val) && val >= 1 && val <= files.length) {
            setCurrentIndex(val - 1);
            setJumpValue("");
            setZoom(1);
        }
    };

    // Final cleanup
    useEffect(() => {
        return () => {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        };
    }, [currentImageUrl]);

    const currentFile = files[currentIndex];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Move className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Smart Image Sorter</h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-11">
                        Index land records with high-speed keyboard shortcuts. Files are renamed and moved locally.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={connectFolder} 
                        variant={directoryHandle ? "outline" : "default"} 
                        disabled={isConnecting}
                        className="rounded-xl shadow-lg shadow-primary/10"
                    >
                        {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                        {directoryHandle ? "Change Folder" : "Connect Source Folder"}
                    </Button>
                    {directoryHandle && (
                        <Badge variant="outline" className="h-10 px-4 rounded-xl border-dashed bg-background/50">
                            <ImageIcon className="h-3.5 w-3.5 mr-2 text-primary" />
                            {files.length} Remaining
                        </Badge>
                    )}
                </div>
            </div>

            {!directoryHandle ? (
                <Card className="border-dashed border-2 bg-muted/20 py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="p-6 bg-background rounded-full shadow-xl">
                            <FolderOpen className="h-12 w-12 text-primary/40" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-bold">Awaiting Connection</h3>
                            <p className="text-sm text-muted-foreground">
                                Select the local folder containing your images. AdiARC requires "Edit" permissions to move files into subfolders.
                            </p>
                        </div>
                        <Button onClick={connectFolder} size="lg" className="rounded-xl h-12 px-8">
                            Browse Files
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-12 h-[calc(100vh-250px)]">
                    {/* Main Preview Column */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <Card className="flex-1 bg-black/95 rounded-2xl overflow-hidden shadow-2xl relative group border-0">
                            {currentFile && currentImageUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-zoom-in">
                                    <div 
                                        className="transition-transform duration-200 ease-out h-full w-full relative"
                                        style={{ transform: `scale(${zoom})` }}
                                    >
                                        <Image 
                                            src={currentImageUrl} 
                                            alt={currentFile.name}
                                            fill
                                            className={cn("object-contain transition-opacity duration-300", isImageLoading ? "opacity-40" : "opacity-100")}
                                            unoptimized
                                        />
                                    </div>
                                    
                                    {isImageLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                                        </div>
                                    )}
                                    
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/20 backdrop-blur-xl border border-white/10 p-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(1, z - 0.5))}>
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <div className="w-12 text-center text-[10px] font-bold text-white uppercase tracking-tighter">
                                            {Math.round(zoom * 100)}%
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(5, z + 0.5))}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-4 bg-white/20 mx-1" />
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(1)}>
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4">
                                    {files.length === 0 ? (
                                        <>
                                            <CheckCircle2 className="h-16 w-16" />
                                            <p className="text-xl font-bold">All Sorted!</p>
                                        </>
                                    ) : (
                                        <Loader2 className="h-10 w-10 animate-spin" />
                                    )}
                                </div>
                            )}

                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={goToPrev}
                                disabled={currentIndex === 0 || files.length === 0}
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={goToNext}
                                disabled={currentIndex === files.length - 1 || files.length === 0}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </Card>
                        
                        <div className="flex items-center justify-between px-2 text-[11px] text-muted-foreground font-mono">
                            <span className="truncate max-w-[300px]">{currentFile?.name || "Ready"}</span>
                            <span>{files.length > 0 ? `${currentIndex + 1} / ${files.length}` : "0 / 0"}</span>
                        </div>
                    </div>

                    {/* Sorting Control Column */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Hash className="h-4 w-4" /> Classification
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Type folder name and press <strong>Enter</strong> to move current image.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input 
                                            ref={inputRef}
                                            value={folderInput}
                                            onChange={(e) => setFolderInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Enter Folder Name..."
                                            className="h-14 text-xl font-bold pl-4 pr-12 rounded-xl bg-background/50 border-2 border-primary/20 focus-visible:border-primary shadow-inner"
                                            autoComplete="off"
                                            disabled={files.length === 0 || isMoving}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <div className="p-1.5 bg-muted rounded-md border text-[10px] font-bold text-muted-foreground">⏎</div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20" 
                                        disabled={!folderInput || isMoving || !currentFile}
                                        onClick={() => moveCurrentFile(folderInput)}
                                    >
                                        {isMoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                        Move to {folderInput || "Folder"}
                                    </Button>
                                </div>

                                {recentFolders.length > 0 && (
                                    <div className="pt-4 border-t border-dashed space-y-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recently Used</p>
                                        <div className="flex flex-wrap gap-2">
                                            {recentFolders.map(folder => (
                                                <Button 
                                                    key={folder} 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-8 rounded-lg text-xs font-semibold px-3"
                                                    onClick={() => {
                                                        setFolderInput(folder);
                                                        setTimeout(() => inputRef.current?.focus(), 50);
                                                    }}
                                                >
                                                    {folder}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-md rounded-2xl">
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="rounded-lg h-10" onClick={goToPrev} disabled={currentIndex === 0 || files.length === 0}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                    </Button>
                                    <Button variant="outline" className="rounded-lg h-10" onClick={goToNext} disabled={currentIndex === files.length - 1 || files.length === 0}>
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="relative flex-1">
                                        <Input 
                                            placeholder="Jump to #" 
                                            value={jumpValue}
                                            onChange={(e) => setJumpValue(e.target.value)}
                                            className="h-10 rounded-lg text-center font-bold"
                                            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                                            disabled={files.length === 0}
                                        />
                                    </div>
                                    <Button variant="ghost" onClick={handleJump} size="sm" className="h-10 font-bold" disabled={files.length === 0}>GOTO</Button>
                                </div>

                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{files.length > 0 ? Math.round(((currentIndex + 1) / files.length) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={files.length > 0 ? ((currentIndex + 1) / files.length) * 100 : 0} className="h-1" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-[11px] font-bold uppercase">Pro Tip</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Use <strong>Ctrl + Arrows</strong> to skip images without moving them. The input field stays focused for continuous data entry.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

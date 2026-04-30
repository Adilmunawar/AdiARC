
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
    Move,
    Keyboard,
    History
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
    const [sessionStats, setSessionStats] = useState({ moved: 0, skipped: 0 });
    
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter for common image extensions
    const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp', '.webp'];

    // --- Dynamic Image Loading ---
    const loadCurrentImage = useCallback(async () => {
        if (files.length === 0 || currentIndex < 0 || currentIndex >= files.length) {
            setCurrentImageUrl(null);
            return;
        }

        setIsImageLoading(true);
        try {
            const file = await files[currentIndex].handle.getFile();
            const url = URL.createObjectURL(file);
            
            // Cleanup previous URL to prevent memory leaks
            setCurrentImageUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } catch (err) {
            console.error("Failed to load image:", err);
            toast({ 
                variant: "destructive", 
                title: "Read Error", 
                description: "Could not load the selected image file." 
            });
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
            // Request readwrite access to move files
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
                toast({ 
                    variant: "destructive", 
                    title: "No Images Found", 
                    description: "The selected folder doesn't contain any valid image files." 
                });
                setIsConnecting(false);
                return;
            }

            // Natural sort for filenames (1, 2, 10 instead of 1, 10, 2)
            setFiles(entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
            setCurrentIndex(0);
            setIsConnecting(false);
            setSessionStats({ moved: 0, skipped: 0 });
            
            toast({ 
                title: "Folder Connected", 
                description: `Found ${entries.length} images. Ready for sorting.` 
            });
            
            // Auto-focus input for immediate work
            setTimeout(() => inputRef.current?.focus(), 100);
            
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                toast({ 
                    variant: "destructive", 
                    title: "Connection Failed", 
                    description: err.message || "Permissions were denied." 
                });
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
            // 1. Get or create target subfolder
            const subDirHandle = await directoryHandle.getDirectoryHandle(folderName, { create: true });
            
            // 2. Determine target filename with sequential collision handling
            const extension = currentFile.name.split('.').pop() || 'jpg';
            let newFileName = `${folderName}.${extension}`;
            let counter = 2;

            // Check if file exists in subfolder, if so, find next available (N)
            while (true) {
                try {
                    await subDirHandle.getFileHandle(newFileName);
                    newFileName = `${folderName}(${counter}).${extension}`;
                    counter++;
                } catch {
                    break; // File doesn't exist, we can use this name
                }
            }

            // 3. Move the file (Write new, then delete old)
            const fileData = await currentFile.handle.getFile();
            const newFileHandle = await subDirHandle.getFileHandle(newFileName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(fileData);
            await writable.close();

            // 4. Remove from source
            await directoryHandle.removeEntry(currentFile.name);

            // 5. Update UI state
            setSessionStats(s => ({ ...s, moved: s.moved + 1 }));
            setRecentFolders(prev => {
                const updated = [folderName, ...prev.filter(f => f !== folderName)].slice(0, 8);
                return updated;
            });

            const newFiles = [...files];
            newFiles.splice(currentIndex, 1);
            setFiles(newFiles);
            setFolderInput("");
            setZoom(1);
            
            // If we were at the end, stay at the new end
            if (currentIndex >= newFiles.length && newFiles.length > 0) {
                setCurrentIndex(newFiles.length - 1);
            }

            toast({ 
                title: `Success`, 
                description: `Moved ${currentFile.name} to /${folderName}/${newFileName}`,
                duration: 2000 
            });

        } catch (err: any) {
            console.error("Move operation failed:", err);
            toast({ 
                variant: "destructive", 
                title: "Operation Failed", 
                description: "Ensure no other program is using the file and check permissions." 
            });
        } finally {
            setIsMoving(false);
            // Maintain focus on the input field
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
            toast({ title: `Jumped to #${val}` });
        } else {
            toast({ variant: "destructive", title: "Invalid Index", description: "Number out of range." });
        }
    };

    // Global cleanup on unmount
    useEffect(() => {
        return () => {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        };
    }, [currentImageUrl]);

    const currentFile = files[currentIndex];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-enter pb-10 h-full flex flex-col">
            {/* Top Stats & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/40 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner">
                        <Move className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Smart Image Sorter</h1>
                        <p className="text-muted-foreground text-xs">Organize local images into subfolders with keyboard precision.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-4 mr-4 px-4 py-1.5 bg-background/50 rounded-lg border border-dashed">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Moved</p>
                            <p className="text-sm font-bold text-primary">{sessionStats.moved}</p>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
                            <p className="text-sm font-bold">{files.length}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={connectFolder} 
                        variant={directoryHandle ? "outline" : "default"} 
                        disabled={isConnecting}
                        className="rounded-xl shadow-lg shadow-primary/10"
                    >
                        {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                        {directoryHandle ? "Change Folder" : "Connect Source Folder"}
                    </Button>
                </div>
            </div>

            {!directoryHandle ? (
                <Card className="flex-1 border-dashed border-2 bg-muted/10 flex items-center justify-center min-h-[400px]">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm">
                        <div className="p-8 bg-background rounded-full shadow-2xl border-4 border-muted/20">
                            <FolderOpen className="h-16 w-16 text-primary/30" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold">Ready to Sort?</h3>
                            <p className="text-sm text-muted-foreground">
                                Select a local folder or network share. This tool moves files <strong>locally</strong> for privacy and speed.
                            </p>
                        </div>
                        <Button onClick={connectFolder} size="lg" className="rounded-xl h-12 px-10 text-base font-bold">
                            Select Source Directory
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 lg:grid-cols-12 flex-1">
                    {/* Main Preview Column */}
                    <div className="lg:col-span-8 flex flex-col gap-3">
                        <Card className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl relative group border-0 min-h-[450px]">
                            {currentFile && currentImageUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                    <div 
                                        className="transition-transform duration-200 ease-out h-full w-full relative select-none"
                                        style={{ 
                                            transform: `scale(${zoom})`,
                                            cursor: zoom > 1 ? 'grab' : 'default' 
                                        }}
                                    >
                                        <Image 
                                            src={currentImageUrl} 
                                            alt={currentFile.name}
                                            fill
                                            className={cn(
                                                "object-contain transition-opacity duration-300 pointer-events-none", 
                                                isImageLoading ? "opacity-30" : "opacity-100"
                                            )}
                                            unoptimized
                                        />
                                    </div>
                                    
                                    {isImageLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                                            <Loader2 className="h-10 w-10 text-white animate-spin mb-2" />
                                            <span className="text-xs text-white/60 font-mono tracking-widest">LOADING</span>
                                        </div>
                                    )}
                                    
                                    {/* Overlay Controls */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/20 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(1, z - 0.5))}>
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <div className="w-14 text-center text-[11px] font-black text-white uppercase tracking-tighter tabular-nums">
                                            {Math.round(zoom * 100)}%
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(5, z + 0.5))}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-5 bg-white/20 mx-1" />
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(1)}>
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/40 space-y-4">
                                    {files.length === 0 ? (
                                        <>
                                            <div className="p-6 bg-green-500/10 rounded-full">
                                                <CheckCircle2 className="h-16 w-16 text-green-500/50" />
                                            </div>
                                            <p className="text-xl font-bold">Queue Completed!</p>
                                            <p className="text-sm">All images in this directory have been sorted.</p>
                                        </>
                                    ) : (
                                        <Loader2 className="h-10 w-10 animate-spin" />
                                    )}
                                </div>
                            )}

                            {/* Nav Buttons */}
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={goToPrev}
                                disabled={currentIndex === 0 || files.length === 0}
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/20 hover:bg-black/40 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={goToNext}
                                disabled={currentIndex === files.length - 1 || files.length === 0}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-black/20 hover:bg-black/40 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </Card>
                        
                        <div className="flex items-center justify-between px-3 text-[11px] text-muted-foreground font-mono bg-muted/30 py-2 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-3 w-3" />
                                <span className="truncate max-w-[400px]">{currentFile?.name || "No file selected"}</span>
                            </div>
                            <div className="font-bold text-primary">
                                IMAGE {files.length > 0 ? currentIndex + 1 : 0} OF {files.length}
                            </div>
                        </div>
                    </div>

                    {/* Sorting Sidebar */}
                    <div className="lg:col-span-4 space-y-4 flex flex-col">
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                    <Hash className="h-4 w-4" /> Move Image
                                </CardTitle>
                                <CardDescription className="text-[10px] font-medium leading-relaxed">
                                    Type folder name and press <strong>ENTER</strong>. Sequential naming is handled automatically.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                                        <Input 
                                            ref={inputRef}
                                            value={folderInput}
                                            onChange={(e) => setFolderInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Folder Name (e.g. 1097)"
                                            className="h-16 text-2xl font-black pl-5 pr-14 rounded-xl bg-background border-2 border-primary/20 focus-visible:border-primary relative shadow-2xl placeholder:text-muted-foreground/30"
                                            autoComplete="off"
                                            disabled={files.length === 0 || isMoving}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <div className="flex flex-col items-center gap-0.5 text-[9px] font-bold text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-muted px-1.5 py-0.5 rounded border">ENTER</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="w-full h-14 font-black rounded-xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0" 
                                        disabled={!folderInput || isMoving || !currentFile}
                                        onClick={() => moveCurrentFile(folderInput)}
                                    >
                                        {isMoving ? (
                                            <>
                                                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                                MOVING FILE...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight className="mr-3 h-5 w-5" />
                                                MOVE TO {folderInput.toUpperCase() || "FOLDER"}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {recentFolders.length > 0 && (
                                    <div className="pt-4 border-t border-dashed space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                                <History className="h-3 w-3" /> Recent Folders
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentFolders.map(folder => (
                                                <Button 
                                                    key={folder} 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-8 rounded-lg text-xs font-bold px-3 bg-background hover:bg-primary/10 hover:text-primary transition-colors border"
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
                                    <Button variant="outline" className="rounded-xl h-11 font-bold text-xs" onClick={goToPrev} disabled={currentIndex === 0 || files.length === 0}>
                                        <ChevronLeft className="mr-2 h-4 w-4" /> PREVIOUS
                                    </Button>
                                    <Button variant="outline" className="rounded-xl h-11 font-bold text-xs" onClick={goToNext} disabled={currentIndex === files.length - 1 || files.length === 0}>
                                        NEXT <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2 border-t border-dashed mt-2">
                                    <Input 
                                        placeholder="Jump to #" 
                                        value={jumpValue}
                                        onChange={(e) => setJumpValue(e.target.value)}
                                        className="h-10 rounded-xl text-center font-black tabular-nums border-dashed"
                                        onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                                        disabled={files.length === 0}
                                    />
                                    <Button variant="ghost" onClick={handleJump} size="sm" className="h-10 font-black text-xs hover:bg-primary/5" disabled={files.length === 0}>GOTO</Button>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                        <span>QUEUE PROGRESS</span>
                                        <span>{files.length > 0 ? Math.round(((currentIndex + 1) / files.length) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={files.length > 0 ? ((currentIndex + 1) / (files.length + sessionStats.moved)) * 100 : 0} className="h-1.5" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-muted/40 border rounded-2xl space-y-3 mt-auto shadow-inner">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Keyboard className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase">Shortcuts</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground font-medium">Next / Prev</span>
                                    <span className="font-mono bg-background px-1.5 py-0.5 rounded border">CTRL + ←/→</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground font-medium">Quick Move</span>
                                    <span className="font-mono bg-background px-1.5 py-0.5 rounded border">ENTER</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


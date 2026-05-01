
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
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [currentIndex]);

    const connectFolder = async () => {
        try {
            setIsConnecting(true);
            
            if (!(window as any).showDirectoryPicker) {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.0.107:3000';
                toast({
                    variant: "destructive",
                    title: "Security Context Required",
                    description: `The browser blocks experimental File System APIs over network HTTP. To enable, go to chrome://flags/#unsafely-treat-insecure-origin-as-secure in your browser, add '${origin}' to the text box, select 'Enabled' from the dropdown, and click relaunch.`,
                    duration: 15000
                });
                setIsConnecting(false);
                return;
            }

            const handle = await (window as any).showDirectoryPicker({
                mode: 'readwrite'
            });
            
            setDirectoryHandle(handle);
            const entries: FileEntry[] = [];
            
            for await (const entry of (handle as any).values()) {
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
        
        const folderNames = targetFolderName.split(',').map(f => f.trim()).filter(Boolean);
        if (folderNames.length === 0) {
            setIsMoving(false);
            return;
        }

        try {
            const fileData = await currentFile.handle.getFile();
            const extension = currentFile.name.split('.').pop() || 'jpg';
            const moveReport: string[] = [];

            for (const folderName of folderNames) {
                // 1. Get or create target subfolder
                const subDirHandle = await (directoryHandle as any).getDirectoryHandle(folderName, { create: true });
                
                // 2. Determine target filename with sequential collision handling
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
                const newFileHandle = await subDirHandle.getFileHandle(newFileName, { create: true });
                const writable = await newFileHandle.createWritable();
                await writable.write(fileData);
                await writable.close();

                moveReport.push(`/${folderName}/${newFileName}`);
            }

            // 4. Remove from source
            await (directoryHandle as any).removeEntry(currentFile.name);

            // 5. Update UI state
            setSessionStats(s => ({ ...s, moved: s.moved + 1 }));
            setRecentFolders(prev => {
                const updated = [...folderNames, ...prev.filter(f => !folderNames.includes(f))].slice(0, 8);
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
                description: `Moved ${currentFile.name} to: ${moveReport.join(', ')}`,
                duration: 3000 
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

    const goToNext = useCallback(() => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setZoom(1);
        }
    }, [currentIndex, files.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setZoom(1);
        }
    }, [currentIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            moveCurrentFile(folderInput);
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
            if (isInput) return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNext();
                return;
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrev();
                return;
            }

            // Capture alphanumeric typing globally if not using modifier keys (Ctrl, Alt, Meta)
            if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) {
                // Ignore space to prevent unintended scrolling, or allow it if it's for filenames
                if (e.key === ' ') return;
                
                e.preventDefault();
                setFolderInput(prev => prev + e.key);
                setTimeout(() => inputRef.current?.focus(), 10);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [goToNext, goToPrev]);

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
        <div className="max-w-7xl mx-auto space-y-3 animate-enter pb-4 h-full flex flex-col">
            {/* Top Stats & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/60 backdrop-blur-md p-3 md:p-4 rounded-xl border border-border/40 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl shadow-inner">
                        <Move className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight leading-none">Smart Image Sorter</h1>
                        <p className="text-muted-foreground text-[10px] md:text-xs">Organize local images into subfolders with keyboard precision.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-3 mr-2 px-3 py-1 bg-background/50 rounded-lg border border-dashed">
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Moved</p>
                            <p className="text-xs font-bold text-primary leading-none mt-0.5">{sessionStats.moved}</p>
                        </div>
                        <div className="w-px h-5 bg-border" />
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Total</p>
                            <p className="text-xs font-bold leading-none mt-0.5">{files.length}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={connectFolder} 
                        variant={directoryHandle ? "outline" : "default"} 
                        disabled={isConnecting}
                        size="sm"
                        className="rounded-lg shadow-sm text-xs h-9 px-3"
                    >
                        {isConnecting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="mr-2 h-3.5 w-3.5" />}
                        {directoryHandle ? "Change" : "Connect"}
                    </Button>
                </div>
            </div>

            {!directoryHandle ? (
                <div className="flex-1 grid gap-4 lg:grid-cols-12 min-h-[400px]">
                    <Card className="lg:col-span-5 border bg-card/40 backdrop-blur-md shadow-xl flex items-center justify-center border-border/40 p-5 rounded-2xl">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-0 max-w-sm">
                            <div className="p-5 bg-primary/10 rounded-full shadow-2xl border-4 border-primary/20 relative group animate-pulse duration-[3000ms]">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                                <FolderOpen className="h-10 w-10 text-primary relative" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold tracking-tight">Ready to Sort?</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Connect a local directory or network share. Images are processed locally for top-tier speed and total data security.
                                </p>
                            </div>
                            <Button 
                                onClick={connectFolder} 
                                size="lg" 
                                className="rounded-xl h-12 w-full max-w-[280px] font-black text-sm shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2"
                            >
                                <FolderOpen className="mr-2.5 h-4 w-4" /> Connect Source Directory
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-7 grid grid-cols-2 gap-3.5 flex-1 content-center">
                        <Card className="border bg-card/30 backdrop-blur-md border-border/40 p-4 rounded-xl shadow-sm group hover:border-primary/30 transition-all duration-300">
                            <CardContent className="p-0 space-y-2 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                        <Hash className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Multi-Folder Sorting</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                                    Move or copy images sequentially to multiple folders. Type comma-separated folder names (e.g. `101,102`).
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border bg-card/30 backdrop-blur-md border-border/40 p-4 rounded-xl shadow-sm group hover:border-primary/30 transition-all duration-300">
                            <CardContent className="p-0 space-y-2 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                        <Move className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Drag & Pan Zoom</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                                    Zoom into files with exact scaling. Click and drag or pan the image directly to inspect every precise detail.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border bg-card/30 backdrop-blur-md border-border/40 p-4 rounded-xl shadow-sm group hover:border-primary/30 transition-all duration-300">
                            <CardContent className="p-0 space-y-2 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                        <Keyboard className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">High-Speed Shortcuts</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                                    Blazing fast shortcuts using single <span className="font-mono bg-background px-1 py-0.5 rounded border">←/→</span> keys to navigate files anywhere in the tab.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border bg-card/30 backdrop-blur-md border-border/40 p-4 rounded-xl shadow-sm group hover:border-primary/30 transition-all duration-300">
                            <CardContent className="p-0 space-y-2 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Queue Progress</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                                    Track progress at any time. Features real-time indicators, dynamic percentage tracking, and session stats.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid gap-3 lg:grid-cols-12 flex-1">
                    {/* Main Preview Column */}
                    <div className="lg:col-span-8 flex flex-col gap-2">
                        <Card className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl relative group border-0 min-h-[280px] lg:min-h-[400px]">
                            {currentFile && currentImageUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                    <div 
                                        className={cn(
                                            "h-full w-full relative select-none flex items-center justify-center",
                                            isDragging ? "cursor-grabbing duration-0" : (zoom > 1 ? "cursor-grab" : "cursor-default")
                                        )}
                                        style={{ 
                                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                                            transition: isDragging ? 'none' : 'transform 150ms ease-out'
                                        }}
                                        onMouseDown={(e) => {
                                            if (zoom > 1) {
                                                setIsDragging(true);
                                                setDragStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            if (isDragging && zoom > 1) {
                                                const dx = (e.clientX - dragStart.x) / zoom;
                                                const dy = (e.clientY - dragStart.y) / zoom;
                                                setPan({ x: dx, y: dy });
                                            }
                                        }}
                                        onMouseUp={() => setIsDragging(false)}
                                        onMouseLeave={() => setIsDragging(false)}
                                        onTouchStart={(e) => {
                                            if (zoom > 1 && e.touches.length === 1) {
                                                setIsDragging(true);
                                                setDragStart({ 
                                                    x: e.touches[0].clientX - pan.x * zoom, 
                                                    y: e.touches[0].clientY - pan.y * zoom 
                                                });
                                            }
                                        }}
                                        onTouchMove={(e) => {
                                            if (isDragging && zoom > 1 && e.touches.length === 1) {
                                                const dx = (e.touches[0].clientX - dragStart.x) / zoom;
                                                const dy = (e.touches[0].clientY - dragStart.y) / zoom;
                                                setPan({ x: dx, y: dy });
                                            }
                                        }}
                                        onTouchEnd={() => setIsDragging(false)}
                                    >
                                        <Image 
                                            src={currentImageUrl} 
                                            alt={currentFile.name}
                                            fill
                                            className={cn(
                                                "object-contain transition-opacity duration-300 pointer-events-none select-none", 
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
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => {
                                            setZoom(z => {
                                                const newZoom = Math.max(1, z - 0.5);
                                                if (newZoom === 1) setPan({ x: 0, y: 0 });
                                                return newZoom;
                                            });
                                        }}>
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <div className="w-14 text-center text-[11px] font-black text-white uppercase tracking-tighter tabular-nums select-none">
                                            {Math.round(zoom * 100)}%
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(5, z + 0.5))}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-5 bg-white/20 mx-1" />
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => {
                                            setZoom(1);
                                            setPan({ x: 0, y: 0 });
                                        }}>
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
                    <div className="lg:col-span-4 space-y-2.5 flex flex-col h-full animate-fade-in select-none">
                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-lg rounded-xl overflow-hidden border-t-2 border-t-primary/30 flex flex-col">
                            <CardHeader className="bg-primary/5 border-b border-primary/10 p-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-primary flex items-center gap-2">
                                        <Hash className="h-3.5 w-3.5" /> Move Image
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[8px] bg-background/50 border-primary/20 px-1.5 py-0">Active</Badge>
                                </div>
                                <CardDescription className="text-[9px] font-medium leading-tight pt-0.5">
                                    Type single or comma-separated folder names and press <strong>ENTER</strong>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3.5 space-y-3.5 flex-1 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
                                        <Input 
                                            ref={inputRef}
                                            value={folderInput}
                                            onChange={(e) => setFolderInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ex: 101 or 101,102"
                                            className="h-11 md:h-12 text-lg font-black pl-3 pr-10 rounded-lg bg-background border-2 border-primary/20 focus-visible:border-primary relative shadow-md placeholder:text-muted-foreground/20 transition-all duration-300 tracking-wide"
                                            autoComplete="off"
                                            disabled={files.length === 0 || isMoving}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <span className="bg-muted px-1 py-0 rounded border text-[8px] font-bold text-muted-foreground shadow-sm">⏎</span>
                                        </div>
                                    </div>

                                    {/* Visual preview for comma-separated targets */}
                                    {folderInput.trim() && (
                                        <div className="flex flex-wrap gap-1 bg-muted/40 p-2 rounded-xl border border-dashed border-border/60 animate-enter">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase block w-full mb-0.5 tracking-wider">Targets:</span>
                                            {folderInput.split(',').map(f => f.trim()).filter(Boolean).map((folder, i) => (
                                                <Badge key={i} className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 text-[10px] font-black px-2 py-0.5 rounded-md leading-none">
                                                    /{folder}/
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <Button 
                                        className="w-full h-11 font-black rounded-lg shadow-md shadow-primary/15 transition-all hover:-translate-y-0.5 active:translate-y-0 bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 text-xs" 
                                        disabled={!folderInput || isMoving || !currentFile}
                                        onClick={() => moveCurrentFile(folderInput)}
                                    >
                                        {isMoving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                MOVING...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight className="mr-2 h-4 w-4" />
                                                MOVE TO {folderInput.split(',').map(f => f.trim()).filter(Boolean).join(' + ') || "FOLDER"}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {recentFolders.length > 0 && (
                                    <div className="pt-2.5 border-t border-dashed space-y-2 mt-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                <History className="h-3 w-3" /> Recent Folders
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {recentFolders.map(folder => (
                                                <Button 
                                                    key={folder} 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="h-6 rounded-md text-[10px] font-bold px-2 bg-background hover:bg-primary/10 hover:text-primary transition-colors border shadow-sm"
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

                        <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-md rounded-xl">
                            <CardContent className="p-3 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="rounded-lg h-9 font-bold text-[10px] bg-background/50 hover:bg-muted" onClick={goToPrev} disabled={currentIndex === 0 || files.length === 0}>
                                        <ChevronLeft className="mr-1 h-3.5 w-3.5" /> PREV
                                    </Button>
                                    <Button variant="outline" className="rounded-lg h-9 font-bold text-[10px] bg-background/50 hover:bg-muted" onClick={goToNext} disabled={currentIndex === files.length - 1 || files.length === 0}>
                                        NEXT <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                
                                <div className="flex items-center gap-1.5 pt-1.5 border-t border-dashed mt-1">
                                    <Input 
                                        placeholder="Jump to #" 
                                        value={jumpValue}
                                        onChange={(e) => setJumpValue(e.target.value)}
                                        className="h-8 rounded-lg text-center font-black tabular-nums border-dashed bg-background/50 focus-visible:border-primary/50 text-xs"
                                        onKeyDown={(e) => e.key === 'Enter' && handleJump()}
                                        disabled={files.length === 0}
                                    />
                                    <Button variant="ghost" onClick={handleJump} size="sm" className="h-8 font-black text-[10px] hover:bg-primary/5 px-2.5" disabled={files.length === 0}>GOTO</Button>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground tracking-tighter">
                                        <span>PROGRESS</span>
                                        <span className="text-primary">{files.length > 0 ? Math.round(((currentIndex + 1) / files.length) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={files.length > 0 ? ((currentIndex + 1) / (files.length + sessionStats.moved)) * 100 : 0} className="h-1 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/70" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-3 bg-muted/40 border rounded-xl space-y-2 mt-auto shadow-inner border-border/40 backdrop-blur-md">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Keyboard className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Shortcuts</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-muted-foreground font-medium">Next / Prev</span>
                                    <span className="font-mono bg-background px-1 py-0.5 rounded border border-border/60">←/→</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-muted-foreground font-medium">Quick Move</span>
                                    <span className="font-mono bg-background px-1 py-0.5 rounded border border-border/60">ENTER</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


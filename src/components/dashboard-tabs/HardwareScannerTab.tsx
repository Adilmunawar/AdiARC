"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Folder, Settings, Focus, RefreshCw, Image as ImageIcon, BookOpen, Receipt, FileText, Cpu, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_RESOLUTIONS = [
  { value: "5", label: "5 MP (2560 × 1920)", width: 2560, height: 1920 },
  { value: "10", label: "10 MP (3648 × 2736)", width: 3648, height: 2736 },
  { value: "15", label: "15 MP (4480 × 3360)", width: 4480, height: 3360 },
  { value: "20", label: "20 MP (5120 × 3840)", width: 5120, height: 3840 },
  { value: "50", label: "50 MP (8192 × 6144)", width: 8192, height: 6144 },
  { value: "100", label: "100 MP (11520 × 8640)", width: 11520, height: 8640 },
];

const SCAN_MODES = [
  { id: "document", name: "Document", icon: FileText, desc: "High contrast, B&W or Color" },
  { id: "book", name: "Book", icon: BookOpen, desc: "Curvature correction & split" },
  { id: "receipt", name: "Receipt", icon: Receipt, desc: "Auto-crop & enhance text" },
  { id: "photo", name: "Photo", icon: ImageIcon, desc: "High fidelity color preservation" },
];

export function HardwareScannerTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [resolution, setResolution] = useState("20");
  const [mode, setMode] = useState("document");
  const [saveDir, setSaveDir] = useState("C:\\Scans");
  const [isScanning, setIsScanning] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  
  const [hardwareDetails, setHardwareDetails] = useState<{
    maxMP: number | null;
    maxWidth: number | null;
    maxHeight: number | null;
    label: string | null;
  }>({ maxMP: null, maxWidth: null, maxHeight: null, label: null });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      toast.error("Failed to detect scanner hardware. Please check permissions.");
    }
  };

  useEffect(() => {
    fetchDevices();
    return () => {
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      startStream();
    }
  }, [selectedDevice, resolution]);

  const startStream = async () => {
    stopStream();
    if (!selectedDevice) return;

    try {
      const resObj = DEFAULT_RESOLUTIONS.find(r => r.value === resolution);
      const constraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: resObj?.width || 1920 },
          height: { ideal: resObj?.height || 1080 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Probe hardware capabilities to get true max resolution
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        const maxWidth = caps.width?.max || null;
        const maxHeight = caps.height?.max || null;
        const maxMP = maxWidth && maxHeight ? Math.round((maxWidth * maxHeight) / 1000000) : null;
        
        setHardwareDetails({
            maxMP,
            maxWidth,
            maxHeight,
            label: track.label || "Unknown Hardware"
        });
        
        // Auto-adjust resolution if current selection exceeds hardware max
        if (maxMP && parseInt(resolution) > maxMP + 2) { // +2 tolerance for rounding
            const available = DEFAULT_RESOLUTIONS.filter(r => parseInt(r.value) <= maxMP + 2);
            if (available.length > 0) {
                setResolution(available[available.length - 1].value);
                toast.info(`Adjusted resolution to hardware limits (${maxMP} MP)`);
            }
        }
      } else {
        setHardwareDetails({ maxMP: null, maxWidth: null, maxHeight: null, label: track?.label || "Unknown Hardware" });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (error) {
      toast.error("Hardware doesn't support this configuration, using hardware default.");
      // Fallback without exact resolution
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevice } }
        });
        streamRef.current = fallbackStream;
        
        const track = fallbackStream.getVideoTracks()[0];
        setHardwareDetails({ maxMP: null, maxWidth: null, maxHeight: null, label: track?.label || "Unknown Hardware" });
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setStreamActive(true);
      } catch (fallbackError) {
        setStreamActive(false);
      }
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStreamActive(false);
    }
  };

  const handleScan = async () => {
    if (!streamActive || !videoRef.current) {
      toast.error("Scanner is not ready.");
      return;
    }
    
    setIsScanning(true);
    
    // Flash effect
    if (videoRef.current) {
      videoRef.current.style.opacity = "0.2";
      setTimeout(() => {
          if (videoRef.current) videoRef.current.style.opacity = "1";
      }, 150);
    }
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Failed to initialize canvas");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const imagesToSave = [];
      
      if (mode === "book") {
          // Split into two halves
          const halfWidth = Math.floor(canvas.width / 2);
          
          // Left page
          const leftCanvas = document.createElement("canvas");
          leftCanvas.width = halfWidth;
          leftCanvas.height = canvas.height;
          const leftCtx = leftCanvas.getContext("2d");
          leftCtx?.drawImage(canvas, 0, 0, halfWidth, canvas.height, 0, 0, halfWidth, canvas.height);
          
          // Right page
          const rightCanvas = document.createElement("canvas");
          rightCanvas.width = halfWidth;
          rightCanvas.height = canvas.height;
          const rightCtx = rightCanvas.getContext("2d");
          rightCtx?.drawImage(canvas, halfWidth, 0, halfWidth, canvas.height, 0, 0, halfWidth, canvas.height);

          imagesToSave.push({
              filename: `scan_book_left_${timestamp}.jpg`,
              base64: leftCanvas.toDataURL("image/jpeg", 0.95)
          });
          imagesToSave.push({
              filename: `scan_book_right_${timestamp}.jpg`,
              base64: rightCanvas.toDataURL("image/jpeg", 0.95)
          });
      } else {
          imagesToSave.push({
              filename: `scan_${mode}_${timestamp}.jpg`,
              base64: canvas.toDataURL("image/jpeg", 0.95)
          });
      }

      const res = await fetch("/api/save-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: imagesToSave, saveDir })
      });
      
      const data = await res.json();
      if (data.success) {
          toast.success(`Successfully saved ${imagesToSave.length} image(s) to ${saveDir}`);
      } else {
          toast.error(`Failed to save: ${data.error}`);
      }
    } catch (err) {
      toast.error("An error occurred during capture and save.");
    } finally {
      setIsScanning(false);
    }
  };

  // Generate dynamic resolution list based on hardware capabilities
  const availableResolutions = hardwareDetails.maxMP 
    ? DEFAULT_RESOLUTIONS.filter(r => parseInt(r.value) <= hardwareDetails.maxMP! + 2)
    : DEFAULT_RESOLUTIONS;

  const dynamicResolutions = [...availableResolutions];
  if (hardwareDetails.maxMP && !dynamicResolutions.some(r => parseInt(r.value) === hardwareDetails.maxMP)) {
    // Add the exact hardware max if it isn't in our default list
    dynamicResolutions.push({
        value: hardwareDetails.maxMP.toString(),
        label: `Native Max (${hardwareDetails.maxMP} MP - ${hardwareDetails.maxWidth} × ${hardwareDetails.maxHeight})`,
        width: hardwareDetails.maxWidth!,
        height: hardwareDetails.maxHeight!
    });
  }

  // Sort them so they appear in correct MP order
  dynamicResolutions.sort((a, b) => parseInt(a.value) - parseInt(b.value));

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Hardware Scanner Studio</h2>
          <p className="text-muted-foreground font-medium">High-resolution document and book capture system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Preview & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden flex flex-col bg-card/40 backdrop-blur-xl border-primary/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="bg-muted/30 p-3 border-b flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Focus className="w-4 h-4" /> Live Scanner Preview
                </div>
                <div className="flex items-center gap-3">
                  {hardwareDetails.label && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {hardwareDetails.label}
                    </span>
                  )}
                  {streamActive && (
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
            </div>
            <div className="flex-1 relative bg-black/90 flex items-center justify-center p-4">
              {/* Camera Preview */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="max-h-full max-w-full object-contain rounded-md shadow-2xl transition-opacity duration-150"
              />
              
              {!streamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Camera className="w-12 h-12 opacity-20" />
                  <p>Scanner hardware not connected</p>
                </div>
              )}

              {/* Scanning Overlay Grid */}
              {streamActive && mode !== "book" && (
                <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-10">
                    <div className="flex justify-between w-full border-t-2 border-primary h-8" />
                    <div className="flex justify-between w-full border-b-2 border-primary h-8" />
                </div>
              )}

              {/* Book Mode Split Line Overlay */}
              {streamActive && mode === "book" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="h-full w-[2px] bg-red-500/80 border-x border-red-900/50 shadow-[0_0_15px_rgba(255,0,0,1)]" />
                    <div className="absolute top-4 left-6 text-red-500/90 font-bold bg-black/60 px-3 py-1.5 rounded text-sm tracking-widest backdrop-blur-sm shadow-lg">LEFT PAGE</div>
                    <div className="absolute top-4 right-6 text-red-500/90 font-bold bg-black/60 px-3 py-1.5 rounded text-sm tracking-widest backdrop-blur-sm shadow-lg">RIGHT PAGE</div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Action Bar */}
          <Card className="p-4 bg-card/40 backdrop-blur-xl border-primary/20">
             <div className="flex items-center gap-4">
                <Button 
                    onClick={handleScan} 
                    disabled={!streamActive || isScanning}
                    className="flex-1 h-14 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all"
                >
                    {isScanning ? (
                        <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                    ) : (
                        <Camera className="w-6 h-6 mr-2" />
                    )}
                    {isScanning ? "Processing Capture..." : "CAPTURE SCAN"}
                </Button>
             </div>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1 pb-4">
            
          {/* Scanner Hardware */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Hardware Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Detected Scanner</Label>
                <div className="flex gap-2">
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select scanner hardware" />
                        </SelectTrigger>
                        <SelectContent>
                            {devices.length === 0 ? (
                                <SelectItem value="none" disabled>No hardware found</SelectItem>
                            ) : (
                                devices.map(d => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>
                                        {d.label || `Scanner ${d.deviceId.slice(0,5)}`}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchDevices} title="Rescan Hardware">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
              </div>
              
              {hardwareDetails.maxMP && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    Hardware detected with a maximum native resolution of <strong className="text-foreground">{hardwareDetails.maxMP} Megapixels</strong> ({hardwareDetails.maxWidth} × {hardwareDetails.maxHeight}).
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Capture Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                        {dynamicResolutions.map(res => (
                            <SelectItem key={res.value} value={res.value}>
                                {res.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Options are intelligently filtered based on your hardware's maximum capabilities.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scan Modes */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/50 flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Focus className="w-5 h-5 text-primary" /> Scan Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {SCAN_MODES.map(m => {
                        const Icon = m.icon;
                        const isSelected = mode === m.id;
                        return (
                            <div 
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={cn(
                                    "cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-all duration-300",
                                    isSelected 
                                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                                        : "border-border/50 bg-background/50 hover:border-primary/50"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                                <div className="space-y-0.5">
                                    <p className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>{m.name}</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">{m.desc}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
          </Card>

          {/* Output Settings */}
          <Card className="bg-card/40 backdrop-blur-xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="w-5 h-5 text-primary" /> Output Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Save Path</Label>
                    <div className="flex gap-2">
                        <Input 
                            value={saveDir} 
                            onChange={(e) => setSaveDir(e.target.value)}
                            placeholder="C:\Scans..." 
                            className="font-mono text-sm"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Scans will be auto-named with timestamps.</p>
                </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

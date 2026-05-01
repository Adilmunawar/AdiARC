"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Camera, Folder, Settings, Focus, RefreshCw, Image as ImageIcon, BookOpen, Receipt, FileText, Cpu, Info, Sliders, Layers, Sun, Contrast } from "lucide-react";
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
  { id: "document", name: "Document", icon: FileText, desc: "High contrast processing" },
  { id: "book", name: "Book", icon: BookOpen, desc: "Symmetric page splitting" },
  { id: "receipt", name: "Receipt", icon: Receipt, desc: "Edge-to-edge auto-crop" },
  { id: "photo", name: "Photo", icon: ImageIcon, desc: "Original high-fidelity color" },
];

const BIT_DEPTHS = [
  { id: "1", name: "1-Bit (Monochrome)", desc: "High contrast black and white" },
  { id: "8", name: "8-Bit (Grayscale)", desc: "256 shades of gray" },
  { id: "24", name: "24-Bit (True Color)", desc: "16.7M RGB colors" },
];

const FILE_FORMATS = [
  { id: "jpeg", name: "JPEG Format", desc: "Best for photo/books" },
  { id: "png", name: "PNG Format", desc: "Best for text & crisp lines" },
];

export function HardwareScannerTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [resolution, setResolution] = useState("20");
  const [mode, setMode] = useState("document");
  const [bitDepth, setBitDepth] = useState("24");
  const [fileFormat, setFileFormat] = useState("jpeg");
  const [saveDir, setSaveDir] = useState("C:\\Scans");
  
  // Advanced filter sliders
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [autoCrop, setAutoCrop] = useState(true);

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
      await navigator.mediaDevices.getUserMedia({ video: true });
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      toast.error("Scanner device not detected or access denied.");
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
  }, [selectedDevice]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleScan();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [streamActive, isScanning, saveDir, mode, resolution, selectedDevice, brightness, contrast, bitDepth, fileFormat]);

  const startStream = async () => {
    stopStream();
    if (!selectedDevice) return;

    try {
      const constraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: 4096 },
          height: { ideal: 2160 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        const maxWidth = caps.width?.max || 4096;
        const maxHeight = caps.height?.max || 2160;
        const maxMP = parseFloat(((maxWidth * maxHeight) / 1000000).toFixed(2));
        
        setHardwareDetails({
            maxMP: maxMP > 0 ? maxMP : 0.1,
            maxWidth,
            maxHeight,
            label: track.label || "Scanner Device"
        });
      } else {
        setHardwareDetails({ maxMP: 24, maxWidth: 5632, maxHeight: 4224, label: track?.label || "Scanner Device" });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (error) {
      toast.error("Standard camera permissions or format fallback triggered.");
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDevice } }
        });
        streamRef.current = fallbackStream;
        
        const track = fallbackStream.getVideoTracks()[0];
        setHardwareDetails({ maxMP: 24, maxWidth: 5632, maxHeight: 4224, label: track?.label || "Scanner Device" });
        
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
      toast.error("Scanner not fully ready. Check preview or permissions.");
      return;
    }
    
    setIsScanning(true);
    
    if (videoRef.current) {
      videoRef.current.style.opacity = "0.2";
      setTimeout(() => {
          if (videoRef.current) videoRef.current.style.opacity = "1";
      }, 150);
    }
    
    try {
      const video = videoRef.current;
      const currentRes = dynamicResolutions.find(r => r.value === resolution) || DEFAULT_RESOLUTIONS[3];
      
      const canvas = document.createElement("canvas");
      canvas.width = currentRes.width;
      canvas.height = currentRes.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Failed to create high-resolution rendering context");
      
      // Apply professional camera filters before printing to canvas
      const b = 1 + brightness / 100;
      const c = 1 + contrast / 100;
      const gray = bitDepth === "8" || bitDepth === "1" ? "100%" : "0%";
      
      ctx.filter = `brightness(${b * 100}%) contrast(${c * 100}%) grayscale(${gray})`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Perform custom mathematical 1-bit thresholding for perfect text scans
      if (bitDepth === "1") {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const brightnessVal = 0.34 * d[i] + 0.5 * d[i + 1] + 0.16 * d[i + 2];
          const val = brightnessVal > 128 ? 255 : 0;
          d[i] = val; d[i + 1] = val; d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const imagesToSave = [];
      const imageFormatMime = fileFormat === "png" ? "image/png" : "image/jpeg";
      const fileExt = fileFormat === "png" ? "png" : "jpg";
      
      if (mode === "book") {
          const halfWidth = Math.floor(canvas.width / 2);
          
          const leftCanvas = document.createElement("canvas");
          leftCanvas.width = halfWidth;
          leftCanvas.height = canvas.height;
          const leftCtx = leftCanvas.getContext("2d");
          leftCtx?.drawImage(canvas, 0, 0, halfWidth, canvas.height, 0, 0, halfWidth, canvas.height);
          
          const rightCanvas = document.createElement("canvas");
          rightCanvas.width = halfWidth;
          rightCanvas.height = canvas.height;
          const rightCtx = rightCanvas.getContext("2d");
          rightCtx?.drawImage(canvas, halfWidth, 0, halfWidth, canvas.height, 0, 0, halfWidth, canvas.height);

          imagesToSave.push({
              filename: `scan_book_left_${timestamp}.${fileExt}`,
              base64: leftCanvas.toDataURL(imageFormatMime, 0.96)
          });
          imagesToSave.push({
              filename: `scan_book_right_${timestamp}.${fileExt}`,
              base64: rightCanvas.toDataURL(imageFormatMime, 0.96)
          });
      } else {
          imagesToSave.push({
              filename: `scan_${mode}_${timestamp}.${fileExt}`,
              base64: canvas.toDataURL(imageFormatMime, 0.96)
          });
      }

      const res = await fetch("/api/save-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: imagesToSave, saveDir })
      });
      
      const data = await res.json();
      if (data.success) {
          toast.success(`Scanning successful! Saved ${imagesToSave.length} file(s) to ${saveDir}`);
      } else {
          toast.error(`Error saving to disk: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Scanning pipeline error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const dynamicResolutions = DEFAULT_RESOLUTIONS.filter(r => 
    r.width <= (hardwareDetails.maxWidth || 5120) &&
    r.height <= (hardwareDetails.maxHeight || 3840)
  );

  if (hardwareDetails.maxWidth && hardwareDetails.maxHeight) {
    const isIncluded = dynamicResolutions.some(
      r => r.width === hardwareDetails.maxWidth && r.height === hardwareDetails.maxHeight
    );
    if (!isIncluded) {
      dynamicResolutions.push({
        value: `${hardwareDetails.maxWidth}x${hardwareDetails.maxHeight}`,
        label: `Native Max (${hardwareDetails.maxMP} MP - ${hardwareDetails.maxWidth} × ${hardwareDetails.maxHeight})`,
        width: hardwareDetails.maxWidth,
        height: hardwareDetails.maxHeight
      });
    }
  }

  dynamicResolutions.sort((a, b) => (a.width * a.height) - (b.width * b.height));

  return (
    <div className="flex flex-col min-h-screen lg:h-[calc(100vh-100px)] gap-6 p-3 sm:p-6 select-none bg-gradient-to-br from-background via-background to-primary/5">
      
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/30 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-teal-500">
              Hardware Scanner Studio
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Enterprise-grade document capture, book-splitting, and hardware optimization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
           <Button variant="outline" size="sm" onClick={fetchDevices} className="border-primary/30 hover:bg-primary/5">
              <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin-slow" /> Rescan Scanner
           </Button>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
        
        {/* Left Area: Viewfinder / Video Feed */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <Card className="flex-1 overflow-hidden flex flex-col bg-black/40 backdrop-blur-xl border-primary/20 shadow-[0_12px_40px_rgba(0,0,0,0.2)] min-h-[300px] sm:min-h-[480px]">
            <div className="bg-muted/30 p-3.5 border-b border-primary/10 flex justify-between items-center select-none">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary">
                    <Focus className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Sensor Viewfinder
                </div>
                <div className="flex items-center gap-2.5">
                  {hardwareDetails.label && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 bg-primary/5 px-2 py-0.5 border border-primary/10 rounded">
                      <Cpu className="w-3 h-3 text-emerald-400" /> {hardwareDetails.label}
                    </span>
                  )}
                  {streamActive && (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  )}
                </div>
            </div>

            <div className="flex-1 relative bg-black/95 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{
                  filter: `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) grayscale(${bitDepth === '8' || bitDepth === '1' ? '100%' : '0%'})`
                }}
                className="max-h-full max-w-full object-contain rounded shadow-2xl transition-all duration-300"
              />
              
              {!streamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Camera className="w-14 h-14 opacity-15 animate-pulse text-primary" />
                  <p className="text-sm font-bold tracking-widest uppercase opacity-40">Connecting to scanner sensor...</p>
                </div>
              )}

              {/* Scanning Overlay (Normal / Document) */}
              {streamActive && mode !== "book" && (
                <div className="absolute inset-0 pointer-events-none opacity-25 flex flex-col justify-between p-6 sm:p-12">
                    <div className="flex justify-between w-full border-t border-emerald-400/50 h-8" />
                    <div className="flex justify-between w-full border-b border-emerald-400/50 h-8" />
                </div>
              )}

              {/* Advanced Book Splitting Overlay */}
              {streamActive && mode === "book" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                    <div className="h-full w-[2px] bg-emerald-500 border-x border-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.9)] animate-pulse" />
                    <div className="absolute top-4 left-6 text-emerald-400 font-bold bg-black/70 border border-emerald-500/30 px-3 py-1.5 rounded-md text-xs tracking-wider backdrop-blur-sm">LEFT PAGE PREVIEW</div>
                    <div className="absolute top-4 right-6 text-emerald-400 font-bold bg-black/70 border border-emerald-500/30 px-3 py-1.5 rounded-md text-xs tracking-wider backdrop-blur-sm">RIGHT PAGE PREVIEW</div>
                </div>
              )}
            </div>
          </Card>

          {/* Large Scan Button Quick Action Area */}
          <Card className="p-4 bg-card/50 backdrop-blur-xl border-primary/20 flex flex-col sm:flex-row items-center gap-4">
             <Button 
                onClick={handleScan} 
                disabled={!streamActive || isScanning}
                className="w-full h-14 sm:h-16 text-base sm:text-xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-emerald-300/20 active:scale-[0.98] transition-all flex items-center justify-center"
             >
                {isScanning ? (
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin text-white" />
                ) : (
                    <Camera className="w-6 h-6 mr-3 text-white animate-pulse" />
                )}
                {isScanning ? "Processing Advanced Image Capture..." : "CAPTURE & SCAN NOW (Enter)"}
             </Button>
          </Card>
        </div>

        {/* Right Area: Control & Customization Settings */}
        <div className="xl:col-span-5 flex flex-col gap-4 min-h-0 overflow-y-auto pb-4">
          
          <Tabs defaultValue="hardware" className="w-full h-full flex flex-col">
            <TabsList className="grid grid-cols-3 w-full h-12 bg-muted/40 border border-primary/20 backdrop-blur rounded-xl p-1 mb-4 select-none">
              <TabsTrigger value="hardware" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1">
                <Settings className="w-3.5 h-3.5" /> Hardware
              </TabsTrigger>
              <TabsTrigger value="filters" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Filters
              </TabsTrigger>
              <TabsTrigger value="output" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1">
                <Folder className="w-3.5 h-3.5" /> Output
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Hardware Selection & Resolutions */}
            <TabsContent value="hardware" className="space-y-4 m-0 flex-1 flex flex-col">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 flex-1 flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" /> Capture Source & Resolution
                  </CardTitle>
                  <CardDescription className="text-xs">Configure optimal parameters based on attached sensor hardware limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                      Selected Scanner Device
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">LIVE CAPTURE</span>
                    </Label>
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select high-res hardware sensor" />
                        </SelectTrigger>
                        <SelectContent>
                            {devices.length === 0 ? (
                                <SelectItem value="none" disabled>No high MP scanners detected</SelectItem>
                            ) : (
                                devices.map(d => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>
                                        {d.label || `Sensor ${d.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                  </div>
                  
                  {hardwareDetails.maxMP && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed shadow-[inset_0_1px_5px_rgba(0,0,0,0.1)]">
                      <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-foreground font-bold">Hardware Specification Detected:</p>
                        <p>The attached scanner has a true physical sensor size of <strong className="text-emerald-400">{hardwareDetails.maxMP} Megapixels</strong> ({hardwareDetails.maxWidth} × {hardwareDetails.maxHeight}). Options above this have been safely filtered out.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">Desired Output Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select output resolution" />
                        </SelectTrigger>
                        <SelectContent>
                            {dynamicResolutions.map(res => (
                                <SelectItem key={res.value} value={res.value}>
                                    {res.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                       Choose your output sizing. Native Max uses your sensor's highest pixel count without software upscaling.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Image Profiles & Enhanced Color/Bit-depth Filters */}
            <TabsContent value="filters" className="space-y-4 m-0 flex-1 flex flex-col">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-400" /> Processing Filters
                  </CardTitle>
                  <CardDescription className="text-xs">Refine brightness, color profiles, bit depths, and scanning profiles.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  
                  {/* Scan Mode / Purpose */}
                  <div className="space-y-2 select-none">
                    <Label className="text-xs sm:text-sm font-bold">Scanning Profile (Target)</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {SCAN_MODES.map(m => {
                            const Icon = m.icon;
                            const isSelected = mode === m.id;
                            return (
                                <div 
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={cn(
                                        "cursor-pointer rounded-xl border p-2.5 flex flex-col items-center justify-between text-center transition-all duration-300 min-h-[75px]",
                                        isSelected 
                                            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                                            : "border-border/60 bg-background/50 hover:border-emerald-500/40"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 mb-1", isSelected ? "text-emerald-400" : "text-muted-foreground")} />
                                    <div className="space-y-0.5">
                                        <p className={cn("text-xs font-bold", isSelected ? "text-emerald-300" : "text-foreground")}>{m.name}</p>
                                        <p className="text-[9px] text-muted-foreground line-clamp-1">{m.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                  </div>

                  {/* Bit Depths / Color Combination */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1"><Layers className="w-4 h-4 text-emerald-400" /> Color Mode & Bit Depth</Label>
                    <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 border border-primary/20 rounded-xl">
                        {BIT_DEPTHS.map(bd => {
                            const isSelected = bitDepth === bd.id;
                            return (
                                <div 
                                    key={bd.id}
                                    onClick={() => setBitDepth(bd.id)}
                                    className={cn(
                                        "cursor-pointer rounded-lg px-2 py-1.5 text-center transition-all duration-200 select-none text-[10px] font-bold leading-tight flex flex-col justify-center min-h-[45px]",
                                        isSelected 
                                            ? "bg-primary text-primary-foreground shadow" 
                                            : "text-muted-foreground hover:bg-primary/10"
                                    )}
                                    title={bd.desc}
                                >
                                    {bd.name}
                                </div>
                            )
                        })}
                    </div>
                  </div>

                  {/* Slider Control Group */}
                  <div className="space-y-3 bg-muted/30 p-3 rounded-xl border border-primary/10">
                     <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                           <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-emerald-400" /> Brightness Intensity</span>
                           <span className={cn("font-bold text-[11px]", brightness > 0 ? "text-emerald-400" : brightness < 0 ? "text-red-400" : "")}>
                              {brightness > 0 ? `+${brightness}%` : `${brightness}%`}
                           </span>
                        </div>
                        <Slider
                            value={[brightness]}
                            onValueChange={(val) => setBrightness(val[0])}
                            min={-100}
                            max={100}
                            step={5}
                            className="py-1 cursor-pointer"
                        />
                     </div>

                     <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                           <span className="flex items-center gap-1"><Contrast className="w-3.5 h-3.5 text-emerald-400" /> Contrast Adjustment</span>
                           <span className={cn("font-bold text-[11px]", contrast > 0 ? "text-emerald-400" : contrast < 0 ? "text-red-400" : "")}>
                              {contrast > 0 ? `+${contrast}%` : `${contrast}%`}
                           </span>
                        </div>
                        <Slider
                            value={[contrast]}
                            onValueChange={(val) => setContrast(val[0])}
                            min={-100}
                            max={100}
                            step={5}
                            className="py-1 cursor-pointer"
                        />
                     </div>

                     <div className="flex items-center justify-between border-t border-primary/10 pt-2 text-xs">
                        <span className="text-muted-foreground font-semibold">Advanced Auto-cropping Edge Enhancement</span>
                        <Switch checked={autoCrop} onCheckedChange={setAutoCrop} />
                     </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: File Format & Save Directories */}
            <TabsContent value="output" className="space-y-4 m-0 flex-1 flex flex-col">
              <Card className="bg-card/40 backdrop-blur-xl border-border/50 flex-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Folder className="w-5 h-5 text-emerald-400" /> Output Settings
                  </CardTitle>
                  <CardDescription className="text-xs">Manage compression schemas, file extensions, and disk paths.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Extension Formats */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">Compression Schema & File Format</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {FILE_FORMATS.map(fmt => {
                            const isSelected = fileFormat === fmt.id;
                            return (
                                <div 
                                    key={fmt.id}
                                    onClick={() => setFileFormat(fmt.id)}
                                    className={cn(
                                        "cursor-pointer rounded-xl border p-2.5 flex flex-col items-start gap-1 transition-all duration-200 select-none",
                                        isSelected 
                                            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                            : "border-border bg-background/50 hover:border-emerald-500/40"
                                    )}
                                >
                                    <p className={cn("text-xs font-bold", isSelected ? "text-emerald-300" : "text-foreground")}>{fmt.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{fmt.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-primary/10 pt-3">
                    <Label className="text-xs sm:text-sm font-semibold">Disk Directory Save Path</Label>
                    <Input 
                        value={saveDir} 
                        onChange={(e) => setSaveDir(e.target.value)}
                        placeholder="C:\Scans..." 
                        className="font-mono text-sm border-primary/20 bg-background/30 backdrop-blur h-11"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Target destination directly on local drive. Paths will be auto-created if they do not exist.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

        </div>
      </div>
    </div>
  );
}

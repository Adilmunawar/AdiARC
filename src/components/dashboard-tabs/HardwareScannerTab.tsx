"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Camera, Folder, Settings, Focus, RefreshCw, Image as ImageIcon, BookOpen, Receipt, FileText, Cpu, Info, Sliders, Layers, Sun, Contrast, RotateCw, Hash } from "lucide-react";
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
  { id: "document", name: "Doc", icon: FileText, desc: "High contrast" },
  { id: "book", name: "Book", icon: BookOpen, desc: "Splits pages" },
  { id: "receipt", name: "Rcpt", icon: Receipt, desc: "Auto crop" },
  { id: "photo", name: "Photo", icon: ImageIcon, desc: "True color" },
];

const BIT_DEPTHS = [
  { id: "1", name: "1-Bit (Mono)" },
  { id: "8", name: "8-Bit (Gray)" },
  { id: "24", name: "24-Bit (Color)" },
];

const ROTATIONS = [
  { id: "0", name: "0°" },
  { id: "90", name: "90°" },
  { id: "180", name: "180°" },
  { id: "270", name: "270°" },
];

const FILE_FORMATS = [
  { id: "jpeg", name: "JPEG" },
  { id: "png", name: "PNG" },
];

export function HardwareScannerTab() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [resolution, setResolution] = useState("20");
  const [mode, setMode] = useState("document");
  const [bitDepth, setBitDepth] = useState("24");
  const [fileFormat, setFileFormat] = useState("jpeg");
  const [saveDir, setSaveDir] = useState("C:\\Scans");
  const [fileSequence, setFileSequence] = useState("0001");
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);

  // Enhancement sliders
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [rotation, setRotation] = useState("0");
  const [quality, setQuality] = useState(100);
  const [warmTint, setWarmTint] = useState(0); // Sepia balance
  const [isMirrored, setIsMirrored] = useState(false);
  const [sharpness, setSharpness] = useState(0);
  const [supportedCapabilities, setSupportedCapabilities] = useState<any>(null);

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
      toast.error("Hardware sensor access denied.");
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
  }, [streamActive, isScanning, saveDir, mode, resolution, selectedDevice, brightness, contrast, bitDepth, fileFormat, rotation, quality, warmTint, fileSequence]);

  const startStream = async () => {
    stopStream();
    if (!selectedDevice) return;

    try {
      const constraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: 8192 },
          height: { ideal: 8192 }
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
        setSupportedCapabilities(caps);
        const anyCaps = caps as any;
        if (anyCaps.sharpness) setSharpness(anyCaps.sharpness.min);
      } else {
        setHardwareDetails({ maxMP: 24, maxWidth: 5632, maxHeight: 4224, label: track?.label || "Scanner Device" });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (error) {
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

  const requestDirectory = async () => {
    try {
      if (!(window as any).showDirectoryPicker) {
        toast.error("Local folder access requires Chrome/Edge or a secure context.");
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setDirectoryHandle(handle);
      toast.success(`Authorized storage: ${handle.name}`);
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error("Folder permission denied.");
    }
  };

  const saveFileLocally = async (handle: any, filename: string, blob: Blob) => {
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  };

  const setDPI = async (blob: Blob, dpi: number = 300): Promise<Blob> => {
    if (blob.type !== 'image/jpeg') return blob;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      const uint8Array = new Uint8Array(arrayBuffer);

      if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) return blob;

      let offset = 2;
      while (offset < uint8Array.length) {
        if (uint8Array[offset] === 0xFF && uint8Array[offset + 1] === 0xE0) {
          const identifier = String.fromCharCode(...uint8Array.slice(offset + 4, offset + 8));
          if (identifier === 'JFIF') {
            uint8Array[offset + 11] = 1; // 1 = dots per inch
            dataView.setUint16(offset + 12, dpi, false); // X density
            dataView.setUint16(offset + 14, dpi, false); // Y density
            return new Blob([arrayBuffer], { type: 'image/jpeg' });
          }
        }
        offset += 2 + dataView.getUint16(offset + 2, false);
      }
    } catch (e) {
      console.warn("Failed to set DPI:", e);
    }
    return blob;
  };

  const incrementSequence = (current: string) => {
    const match = current.match(/(\d+)$/);
    if (!match) return current;
    const numStr = match[1];
    const nextNum = parseInt(numStr, 10) + 1;
    const padded = nextNum.toString().padStart(numStr.length, "0");
    return current.replace(/(\d+)$/, padded);
  };

  const handleScan = async () => {
    if (!streamActive || !videoRef.current) {
      toast.error("Scanner is not ready.");
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
      const track = streamRef.current?.getVideoTracks()[0];
      const currentRes = dynamicResolutions.find(r => r.value === resolution) || DEFAULT_RESOLUTIONS[3];
      const isRotated = rotation === "90" || rotation === "270";
      const imageFormatMime = fileFormat === "png" ? "image/png" : "image/jpeg";
      const fileExt = fileFormat === "png" ? "png" : "jpg";

      let finalBlobs: { blob: Blob, name: string }[] = [];
      let nextBase = fileSequence;
      let rawImage: ImageBitmap | HTMLVideoElement = videoRef.current;
      let photoBlob: Blob | null = null;
      let actualWidth = currentRes.width;
      let actualHeight = currentRes.height;

      // 1. Capture hardware still if possible
      const canCaptureStill = track && 'ImageCapture' in window;
      if (canCaptureStill) {
        try {
          const capturer = new (window as any).ImageCapture(track);
          if (supportedCapabilities?.sharpness) {
            await (track as any).applyConstraints({ advanced: [{ sharpness }] });
          }
          
          let photoSettings: any = {};
          try {
            const photoCaps = await capturer.getPhotoCapabilities();
            if (photoCaps.imageWidth && photoCaps.imageWidth.max) {
              photoSettings.imageWidth = photoCaps.imageWidth.max;
            }
            if (photoCaps.imageHeight && photoCaps.imageHeight.max) {
              photoSettings.imageHeight = photoCaps.imageHeight.max;
            }
          } catch (e) {
            console.warn("Could not get photo capabilities", e);
          }

          const pb = await capturer.takePhoto(photoSettings);
          photoBlob = await setDPI(pb, 300); // Enforce 300 DPI for print
          rawImage = await createImageBitmap(photoBlob);
          
          if (resolution.includes('x') || resolution === "100") {
            actualWidth = rawImage.width;
            actualHeight = rawImage.height;
          }

          // Native Pass-through for max quality
          const needsProcessing = rotation !== "0" || brightness !== 0 || contrast !== 0 || 
                                 bitDepth !== "24" || warmTint !== 0 || isMirrored || mode === "book";
          
          if (!needsProcessing && photoBlob) {
            finalBlobs.push({ blob: photoBlob, name: `${nextBase}.${fileExt}` });
            setFileSequence(incrementSequence(nextBase));
            if (directoryHandle) {
              await saveFileLocally(directoryHandle, finalBlobs[0].name, finalBlobs[0].blob);
              toast.success("Saved 1:1 Raw Hardware Capture");
            } else {
              const formData = new FormData();
              formData.append("saveDir", saveDir);
              formData.append("files", photoBlob, `${nextBase}.${fileExt}`);
              await fetch("/api/save-scan", { method: "POST", body: formData });
              toast.success("Saved 1:1 Raw Hardware Capture via Server");
            }
            setIsScanning(false);
            return;
          }
        } catch (e) {
          console.warn("Hardware capture failed, falling back to video:", e);
        }
      } else {
        actualWidth = (rawImage as HTMLVideoElement).videoWidth || actualWidth;
        actualHeight = (rawImage as HTMLVideoElement).videoHeight || actualHeight;
      }

      const processCanvas = async (source: ImageBitmap | HTMLVideoElement, width: number, height: number) => {
        const canvas = document.createElement("canvas");
        const canvasWidth = isRotated ? height : width;
        const canvasHeight = isRotated ? width : height;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: bitDepth === "1" });
        if (!ctx) throw new Error("Canvas context failed");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const b = 1 + brightness / 100;
        const c = 1 + contrast / 100;
        const gray = (bitDepth === "8" || bitDepth === "1") ? "100%" : "0%";
        const s = warmTint > 0 ? `${warmTint}%` : "0%";

        if (b !== 1 || c !== 1 || gray !== "0%" || s !== "0%") {
          ctx.filter = `brightness(${b * 100}%) contrast(${c * 100}%) grayscale(${gray}) sepia(${s})`;
        }

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        if (rotation !== "0") ctx.rotate((parseInt(rotation) * Math.PI) / 180);
        if (isMirrored) ctx.scale(-1, 1);
        ctx.drawImage(source, -width / 2, -height / 2, width, height);
        ctx.restore();

        if (bitDepth === "1") {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          const threshold = 120 + (contrast * -0.5); 
          for (let i = 0; i < d.length; i += 4) {
            const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const val = avg > threshold ? 255 : 0;
            d[i] = val; d[i + 1] = val; d[i + 2] = val;
          }
          ctx.putImageData(imgData, 0, 0);
        }
        const generatedBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, imageFormatMime, quality / 100));
        return generatedBlob ? await setDPI(generatedBlob, 300) : null;
      };

      if (mode === "book") {
        const canvas = document.createElement("canvas");
        canvas.width = actualWidth; canvas.height = actualHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(rawImage, 0, 0, actualWidth, actualHeight);
        }
        const halfWidth = Math.floor(actualWidth / 2);
        const b1 = await createImageBitmap(canvas, 0, 0, halfWidth, actualHeight);
        const p1Blob = await processCanvas(b1, halfWidth, actualHeight);
        b1.close();
        if (p1Blob) finalBlobs.push({ blob: p1Blob, name: `${nextBase}.${fileExt}` });
        nextBase = incrementSequence(nextBase);
        const b2 = await createImageBitmap(canvas, halfWidth, 0, halfWidth, actualHeight);
        const p2Blob = await processCanvas(b2, halfWidth, actualHeight);
        b2.close();
        if (p2Blob) finalBlobs.push({ blob: p2Blob, name: `${nextBase}.${fileExt}` });
        setFileSequence(incrementSequence(nextBase));
      } else {
        const blob = await processCanvas(rawImage, actualWidth, actualHeight);
        if (blob) finalBlobs.push({ blob: blob, name: `${nextBase}.${fileExt}` });
        setFileSequence(incrementSequence(nextBase));
      }

      if (directoryHandle) {
        for (const f of finalBlobs) await saveFileLocally(directoryHandle, f.name, f.blob);
        toast.success(`Saved ${finalBlobs.length} high-res images directly`);
      } else {
        const formData = new FormData();
        formData.append("saveDir", saveDir);
        finalBlobs.forEach(f => formData.append("files", f.blob, f.name));
        const res = await fetch("/api/save-scan", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) toast.success(`Saved ${finalBlobs.length} images via server`);
        else throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(`Scan failed: ${err.message}`);
      console.error(err);
    } finally {
      setIsScanning(false);
      if (rawImage instanceof ImageBitmap) rawImage.close();
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
        label: `Max Native (${hardwareDetails.maxMP} MP - ${hardwareDetails.maxWidth}×${hardwareDetails.maxHeight})`,
        width: hardwareDetails.maxWidth,
        height: hardwareDetails.maxHeight
      });
    }
  }

  dynamicResolutions.sort((a, b) => (a.width * a.height) - (b.width * b.height));

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6 lg:-my-8 flex flex-col h-[calc(100%+2rem)] sm:h-[calc(100%+3rem)] lg:h-[calc(100%+4rem)] w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] gap-3 p-4 overflow-hidden select-none bg-background dark:bg-background">

      {/* 3-Column Studio Display */}
      <div className="grid grid-cols-1 xl:grid-cols-12 h-full gap-3 max-h-full flex-1 overflow-hidden">

        {/* Left Column: Settings & Direct Access */}
        <div className="xl:col-span-3 flex flex-col justify-start h-full gap-3 min-h-0 overflow-hidden">

          {/* Hardware Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3 shadow-none overflow-hidden select-none hover:border-primary/40 transition-all duration-300">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-primary uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5" /> Hardware Source
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground flex items-center justify-between leading-tight">
                  <span>Attached Sensor</span>
                  {selectedDevice && <span className="text-primary/70 text-[8px] uppercase tracking-wider font-extrabold">Active</span>}
                </Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-full h-9 px-3 text-[11px] bg-white dark:bg-slate-950 border border-primary/20 hover:border-primary/40 rounded-xl transition-all duration-200">
                    <SelectValue placeholder="No source found" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-primary/20 rounded-xl">
                    {devices.length === 0 ? (
                      <SelectItem value="none" disabled>No hardware detected</SelectItem>
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
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-2.5 text-[10px] text-muted-foreground leading-tight flex items-start gap-1 backdrop-blur-sm">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>Detected true maximum: <strong className="text-primary font-bold">{hardwareDetails.maxMP} MP</strong> ({hardwareDetails.maxWidth}×{hardwareDetails.maxHeight})</div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground leading-tight">Output Native Precision</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="w-full h-9 px-3 text-[11px] bg-white dark:bg-slate-950 border border-primary/20 hover:border-primary/40 rounded-xl transition-all duration-200">
                    <SelectValue placeholder="Resolution" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border border-primary/20 rounded-xl">
                    {dynamicResolutions.map(res => (
                      <SelectItem key={res.value} value={res.value}>
                        {res.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Disk Directory Path & Compression Settings */}
          <div className="bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3 shadow-none overflow-hidden select-none hover:border-primary/40 transition-all duration-300">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-primary uppercase tracking-wider">
              <Folder className="w-3.5 h-3.5" /> File Extensions
            </h3>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground leading-tight">Format Selection</Label>
                <div className="grid grid-cols-2 gap-1 bg-primary/10 p-1 border border-primary/20 rounded-xl">
                  {FILE_FORMATS.map(fmt => {
                    const isSelected = fileFormat === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => setFileFormat(fmt.id)}
                        className={cn(
                          "cursor-pointer rounded-lg py-1 text-center transition-all text-[11px] font-bold select-none duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-primary/20"
                        )}
                      >
                        {fmt.name}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground leading-tight flex items-center gap-1">
                  <Hash className="w-3 h-3 text-primary" /> Auto Sequence Index
                </Label>
                <Input
                  value={fileSequence}
                  onChange={(e) => setFileSequence(e.target.value)}
                  placeholder="0001"
                  className="font-mono text-[11px] border-primary/20 bg-white dark:bg-slate-950 h-8.5 px-3 hover:border-primary/40 rounded-xl transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-muted-foreground font-bold">JPEG Output Quality</span>
                  <span className="text-primary font-bold">{quality}%</span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(val) => setQuality(val[0])}
                  min={10}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              {supportedCapabilities?.sharpness && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-muted-foreground font-bold">Hardware Sharpness</span>
                    <span className="text-primary font-bold">{sharpness}</span>
                  </div>
                  <Slider
                    value={[sharpness]}
                    onValueChange={(val) => setSharpness(val[0])}
                    min={supportedCapabilities.sharpness.min}
                    max={supportedCapabilities.sharpness.max}
                    step={supportedCapabilities.sharpness.step || 1}
                    className="cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground leading-tight">Target Directory</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={directoryHandle ? `[LOCAL] ${directoryHandle.name}` : saveDir}
                    onChange={(e) => setSaveDir(e.target.value)}
                    placeholder="C:\Scans..."
                    disabled={!!directoryHandle}
                    className="font-mono text-[11px] border-primary/20 bg-white dark:bg-slate-950 h-8.5 px-3 hover:border-primary/40 rounded-xl transition-all duration-200 flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={requestDirectory}
                    className={cn(
                      "h-8.5 w-8.5 rounded-xl border-primary/20 shrink-0 transition-all",
                      directoryHandle ? "bg-primary/20 border-primary text-primary" : "hover:border-primary/40"
                    )}
                  >
                    <Folder className="w-4 h-4" />
                  </Button>
                </div>
                {directoryHandle && (
                  <p className="text-[9px] text-primary font-bold mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Saving directly to your machine
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Viewfinder Area */}
        <div className="xl:col-span-6 flex flex-col h-full gap-2 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col bg-black border border-primary/20 shadow-none rounded-2xl min-h-0 select-none">
            <div className="bg-primary/10 p-2.5 border-b border-primary/20 backdrop-blur-xl flex justify-between items-center select-none rounded-t-2xl">
              <div className="flex items-center gap-1 text-xs font-bold text-primary">
                <Focus className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Preview
              </div>
              <div className="flex items-center gap-2">
                {hardwareDetails.label && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-primary/5 px-1.5 py-0.5 border border-primary/10 rounded">
                    <Cpu className="w-3 h-3" /> {hardwareDetails.label.slice(0, 15)}
                  </span>
                )}
                {streamActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-sm" />
                )}
              </div>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center p-1 min-h-0 overflow-hidden rounded-b-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) grayscale(${bitDepth === '8' || bitDepth === '1' ? '100%' : '0%'}) sepia(${warmTint}%)`,
                  transform: rotation === "90" || rotation === "270" ? `rotate(${rotation}deg) scale(0.7)` : `rotate(${rotation}deg)`
                }}
                className={cn(
                  "max-h-full max-w-full object-contain transition-all duration-200",
                  isMirrored && "-scale-x-100"
                )}
              />

              {!streamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Camera className="w-8 h-8 opacity-20 text-primary animate-pulse" />
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-40">Sensor Connecting...</p>
                </div>
              )}

              {/* Book Mode Split Line Overlay */}
              {streamActive && mode === "book" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="h-full w-[1px] bg-primary animate-pulse" />
                  <div className="absolute top-2 left-4 text-primary font-bold bg-black/70 border border-primary/30 px-2 py-0.5 rounded text-[9px] backdrop-blur-sm">LEFT</div>
                  <div className="absolute top-2 right-4 text-primary font-bold bg-black/70 border border-primary/30 px-2 py-0.5 rounded text-[9px] backdrop-blur-sm">RIGHT</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Capture Panel */}
          <div>
            <Button
              onClick={handleScan}
              disabled={!streamActive || isScanning}
              className="w-full h-11 text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-none border border-primary/20 active:scale-[0.98] transition-all flex items-center justify-center rounded-2xl"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
              ) : (
                <Camera className="w-4 h-4 mr-2 text-white animate-pulse" />
              )}
              {isScanning ? "Processing..." : "CAPTURE IMAGE (Enter)"}
            </Button>
          </div>
        </div>

        {/* Right Column: Advanced Adjustments */}
        <div className="xl:col-span-3 flex flex-col justify-start h-full gap-3 min-h-0 overflow-hidden">

          {/* Scanning Mode Selection */}
          <div className="bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl p-4 flex flex-col gap-2 justify-between select-none shadow-none overflow-hidden select-none hover:border-primary/40 transition-all duration-300">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-primary uppercase tracking-wider">
              <Focus className="w-3.5 h-3.5" /> Target Profile
            </h3>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {SCAN_MODES.map(m => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all duration-300 select-none",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/60 bg-background/50 hover:border-primary/40"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 mb-0.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <p className={cn("text-[11px] font-bold leading-tight", isSelected ? "text-primary" : "text-foreground")}>{m.name}</p>
                    <p className="text-[9px] text-muted-foreground line-clamp-1">{m.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Filters & Real-time Enhancement */}
          <div className="bg-white dark:bg-slate-900 border border-primary/20 rounded-2xl p-4 flex flex-col gap-2.5 shadow-none overflow-hidden select-none hover:border-primary/40 transition-all duration-300">
            <h3 className="text-xs font-bold flex items-center gap-1.5 text-primary uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" /> Advanced Image Controls
            </h3>
            <div className="space-y-3 bg-primary/5 p-2.5 rounded-xl border border-primary/10">

              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-primary" /> Brightness</span>
                  <span className={cn(brightness > 0 ? "text-primary font-bold" : "")}>{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={(val) => setBrightness(val[0])}
                  min={-100}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><Contrast className="w-3.5 h-3.5 text-primary" /> Contrast</span>
                  <span className={cn(contrast > 0 ? "text-primary font-bold" : "")}>{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={(val) => setContrast(val[0])}
                  min={-100}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              {/* Add warmth / Tint slider */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-primary" /> Warmth / Tint</span>
                  <span className={cn(warmTint > 0 ? "text-primary font-bold" : "")}>{warmTint}%</span>
                </div>
                <Slider
                  value={[warmTint]}
                  onValueChange={(val) => setWarmTint(val[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>

              <div className="pt-1.5 border-t border-primary/10 flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-semibold flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
                    Mirror Preview
                  </span>
                  <Switch
                    checked={isMirrored}
                    onCheckedChange={setIsMirrored}
                    className="scale-75 data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-semibold flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
                    <RotateCw className="w-3.5 h-3.5 text-primary" /> Orientation
                  </span>
                  <div className="grid grid-cols-4 gap-0.5 bg-primary/5 p-1 border border-primary/20 rounded-xl">
                    {ROTATIONS.map(rot => {
                      const isSelected = rotation === rot.id;
                      return (
                        <div
                          key={rot.id}
                          onClick={() => setRotation(rot.id)}
                          className={cn(
                            "cursor-pointer rounded-lg px-1.5 py-1 text-center transition-all text-[11px] font-bold select-none",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-primary/20"
                          )}
                        >
                          {rot.name}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Bit depth picker */}
                <div className="space-y-1">
                  <span className="font-semibold flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Bit Depth
                  </span>
                  <div className="grid grid-cols-3 gap-0.5 bg-primary/5 p-1 border border-primary/20 rounded-xl">
                    {BIT_DEPTHS.map(bd => {
                      const isSelected = bitDepth === bd.id;
                      return (
                        <div
                          key={bd.id}
                          onClick={() => setBitDepth(bd.id)}
                          className={cn(
                            "cursor-pointer rounded-lg px-1 py-1 text-center transition-all text-[11px] font-bold select-none leading-tight",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-primary/20"
                          )}
                        >
                          {bd.name.split(" ")[0]}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

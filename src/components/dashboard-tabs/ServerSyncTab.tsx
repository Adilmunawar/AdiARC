
"use client";
import React, { useRef, useState } from "react";
import ExifReader from "exifreader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Database, FolderUp, Key, Loader2, Server, UploadCloud, Wifi } from "lucide-react";
import { extractMutationNumber } from "@/lib/forensic-utils";
import { Progress } from "@/components/ui/progress";

type ConnectionStatus = "disconnected" | "connecting" | "live";
type DirectUploadItem = {
  id: string;
  filename: string;
};

export function ServerSyncTab() {
  const { toast } = useToast();

  const safeLocalStorageGet = (key: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    try {
      const value = window.localStorage.getItem(key);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [serverIp, setServerIp] = useState<string>(() => safeLocalStorageGet("adiarc_sql_server", "192.125.6.11"));
  const [port, setPort] = useState<string>(() => safeLocalStorageGet("adiarc_sql_port", "1433"));
  const [databaseName, setDatabaseName] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_database", "Judiya_Pur"),
  );
  const [dbUser, setDbUser] = useState<string>(() => safeLocalStorageGet("adiarc_sql_user", "sa"));
  const [dbPassword, setDbPassword] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_password", "justice@123"),
  );
  const [connectionTimeout, setConnectionTimeout] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_timeout", "15000"),
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [lastConnectionMessage, setLastConnectionMessage] = useState<string | null>(null);

  // State for direct upload
  const [directUploadItems, setDirectUploadItems] = useState<DirectUploadItem[]>([]);
  const [isScanningDirectly, setIsScanningDirectly] = useState<boolean>(false);
  const [directScanProgress, setDirectScanProgress] = useState({ current: 0, total: 0 });
  const [isUploadingDirectly, setIsUploadingDirectly] = useState<boolean>(false);
  const directUploadInputRef = useRef<HTMLInputElement>(null);

  const handleSaveServerConfig = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("adiarc_sql_server", serverIp.trim());
        window.localStorage.setItem("adiarc_sql_port", port.trim());
        window.localStorage.setItem("adiarc_sql_database", databaseName.trim());
        window.localStorage.setItem("adiarc_sql_user", dbUser.trim());
        window.localStorage.setItem("adiarc_sql_password", dbPassword.trim());
        window.localStorage.setItem("adiarc_sql_timeout", connectionTimeout.trim());
      }
      toast({
        title: "Configuration saved",
        description: "SQL Server connection details stored in this browser.",
      });
    } catch {
      toast({
        title: "Unable to save configuration",
        description: "Your browser blocked access to local storage.",
        variant: "destructive",
      });
    }
  };

  const handleTestServerConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("connecting");
    setLastConnectionMessage(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "test",
          serverIp,
          port,
          dbName: databaseName,
          dbUser,
          dbPassword,
          connectionTimeout,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConnectionStatus("live");
        setLastConnectionMessage(`✅ ${result.message}`);
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        setConnectionStatus("disconnected");
        const errorMsg = result.error || 'An unknown error occurred.';
        setLastConnectionMessage(`❌ ${errorMsg}`);
        toast({
          title: "Connection Test Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus("disconnected");
      const message = `Network Error: Could not reach the API route. Ensure the application server is running locally.`;
      setLastConnectionMessage(`❌ ${message}`);
      toast({
        title: "API Communication Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDirectScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsScanningDirectly(true);
    setDirectUploadItems([]);
    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/") || /\.(jpg|jpeg|png|tif|tiff)$/i.test(file.name),
    );

    setDirectScanProgress({ current: 0, total: imageFiles.length });

    const newItems: DirectUploadItem[] = [];
    const skippedFiles = [];
    let processed = 0;

    const chunkSize = 50;
    for (let i = 0; i < imageFiles.length; i += chunkSize) {
        const chunk = imageFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (file) => {
            try {
                const tags = await ExifReader.load(file, { expanded: true });
                const findings = extractMutationNumber(tags);
                if (findings.length > 0) {
                    const bestMatch = findings.find((f) => f.source.includes("⭐")) || findings[0];
                    newItems.push({ id: bestMatch.number, filename: file.name });
                } else {
                    skippedFiles.push(file.name);
                }
            } catch (err) {
                console.warn("Could not read EXIF from file:", file.name, err);
                skippedFiles.push(file.name);
            }
        }));
        processed += chunk.length;
        setDirectScanProgress({ current: processed, total: imageFiles.length });
        await new Promise(r => setTimeout(r, 0)); // Yield to main thread
    }

    setDirectUploadItems(newItems);
    setIsScanningDirectly(false);

    if (newItems.length > 0) {
      toast({
        title: "Direct Scan Complete",
        description: `Found ${newItems.length} valid mutation files. ${skippedFiles.length} files were skipped.`,
      });
    } else {
      toast({
        title: "No Valid Files Found",
        description: "No images with readable XMP metadata containing a mutation number were found.",
        variant: "destructive",
      });
    }
  };

  const handleDirectUpload = async () => {
    if (directUploadItems.length === 0) {
      toast({ title: "Nothing to upload", description: "Scan a folder with valid images first." });
      return;
    }
    setIsUploadingDirectly(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upload_direct",
          serverIp,
          port,
          dbName: databaseName,
          dbUser,
          dbPassword,
          connectionTimeout,
          mutations: directUploadItems,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Direct Upload Complete", description: `Uploaded ${result.count} new records successfully.` });
        setDirectUploadItems([]); // Clear list after successful upload
      } else {
        throw new Error(result.error || "An unknown upload error occurred.");
      }
    } catch (error: any) {
      toast({ title: "Direct Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingDirectly(false);
    }
  };
  
  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Database className="h-4 w-4 text-primary" />
            <span>Server Sync (LRMIS Bridge)</span>
          </CardTitle>
          <CardDescription>
            Configure the SQL Server connection and upload mutations directly from the browser.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Wifi
            className={
              connectionStatus === "live"
                ? "h-4 w-4 text-green-500 animate-pulse"
                : connectionStatus === "connecting"
                ? "h-4 w-4 text-muted-foreground animate-pulse"
                : "h-4 w-4 text-destructive"
            }
          />
          <Badge
            variant={connectionStatus === "live" ? "default" : connectionStatus === "connecting" ? "secondary" : "destructive"}
            className="uppercase tracking-wide"
          >
            {connectionStatus === "live" ? "Live" : connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-6 md:grid-cols-2 items-start">
          {/* Left: Connection settings */}
          <div className="space-y-4 rounded-md border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Connection settings</p>
              <span className="text-[11px] text-muted-foreground">Stored in this browser only</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sql-server-ip" className="flex items-center gap-1 text-xs">
                  <Server className="h-3.5 w-3.5" />
                  <span>Server IP</span>
                </Label>
                <Input
                  id="sql-server-ip"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  placeholder="192.125.6.11"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sql-db-name" className="text-xs">
                  Database name
                </Label>
                <Input
                  id="sql-db-name"
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="Judiya_Pur"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sql-user" className="text-xs">
                  Username
                </Label>
                <Input
                  id="sql-user"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="sa"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sql-password" className="flex items-center gap-1 text-xs">
                  <Key className="h-3.5 w-3.5" />
                  <span>Password</span>
                </Label>{" "}
                <Input
                  id="sql-password"
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="justice@123"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="link" className="p-0 h-auto text-xs">
                  Advanced Connection Settings
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sql-port" className="text-xs">
                      Port
                    </Label>
                    <Input
                      id="sql-port"
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="1433"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sql-timeout" className="text-xs">
                      Timeout (ms)
                    </Label>
                    <Input
                      id="sql-timeout"
                      type="number"
                      value={connectionTimeout}
                      onChange={(e) => setConnectionTimeout(e.target.value)}
                      placeholder="15000"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                 <p className="text-xs text-muted-foreground">Encryption is forced to 'false' and Trust Server Certificate to 'true' in the backend for legacy SQL Server compatibility.</p>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveServerConfig}
                className="h-8 px-3 text-[11px]"
                disabled={isTestingConnection || isUploadingDirectly || isScanningDirectly}
              >
                Save configuration
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleTestServerConnection}
                disabled={isTestingConnection || isUploadingDirectly || isScanningDirectly}
                className="h-9 px-4 text-[12px] font-semibold"
              >
                {isTestingConnection ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Test connection"
                )}
              </Button>
            </div>

            {lastConnectionMessage && <p className="pt-1 text-[11px] text-muted-foreground">{lastConnectionMessage}</p>}
          </div>

          {/* Right: Upload area */}
          <div className="space-y-4">
            <div className="space-y-4 rounded-md border border-border bg-card/70 p-4">
              <div>
                <p className="text-sm font-semibold">Direct Upload via XMP Scan</p>
                <p className="text-[11px] text-muted-foreground">Scan a folder and upload mutations based on XMP metadata.</p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => directUploadInputRef.current?.click()}
                  disabled={isUploadingDirectly || isTestingConnection || isScanningDirectly}
                >
                  <FolderUp className="mr-2 h-4 w-4" />
                  {isScanningDirectly ? "Scanning..." : "Select Folder to Scan & Upload"}
                </Button>
                <input
                  ref={directUploadInputRef}
                  type="file"
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  className="hidden"
                  onChange={handleDirectScan}
                />
              </div>

              {isScanningDirectly && directScanProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress
                    value={(directScanProgress.current / directScanProgress.total) * 100}
                    className="h-1.5"
                  />
                  <p className="text-center text-[10px] text-muted-foreground">
                    Scanning {directScanProgress.current} of {directScanProgress.total} files...
                  </p>
                </div>
              )}

              {directUploadItems.length > 0 && !isScanningDirectly && (
                <div className="rounded-md border border-dashed border-primary/50 bg-primary/10 p-3 text-center text-sm font-medium text-primary-foreground">
                  <p className="text-primary">Ready to upload {directUploadItems.length} valid mutations.</p>
                </div>
              )}

              <Button
                type="button"
                onClick={handleDirectUpload}
                disabled={connectionStatus !== "live" || directUploadItems.length === 0 || isUploadingDirectly || isScanningDirectly}
                className="w-full justify-center text-[13px] font-semibold"
              >
                {isUploadingDirectly ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading to server...
                  </span>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Push {directUploadItems.length > 0 ? `${directUploadItems.length} ` : ""}Mutations to Database
                  </>
                )}
              </Button>
            </div>
             <p className="text-xs text-muted-foreground px-1">
                Note: This tool requires the Next.js application to be running on the same local network as the SQL Server to successfully connect and upload data.
              </p>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

    

    
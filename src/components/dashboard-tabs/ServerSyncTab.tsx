
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
import { Database, FolderUp, Key, Loader2, Server, UploadCloud, Wifi, Info, Terminal, Download } from "lucide-react";
import { extractMutationNumber } from "@/lib/forensic-utils";
import { Progress } from "@/components/ui/progress";

type ConnectionStatus = "disconnected" | "connecting" | "live";
type DirectUploadItem = {
  id: string;
  filename: string;
};

const bridgeScriptContent = `
const sql = require('mssql');

// --- CONFIGURATION ---
// 1. IP Address
const SERVER = '192.125.6.11'; 
// 2. Database Name (Use 'master' first to test login, then 'Judiya_Pur')
const DATABASE = 'master'; 
// 3. Auth
const USER = 'sa';
const PASSWORD = 'justice@123';

async function testConnection() {
    console.log(\`\\n--- 🔍 DIAGNOSTIC MODE: Connecting to \${SERVER} ---\`);
    console.log(\`User: \${USER}\`);
    console.log(\`Target DB: \${DATABASE}\`);

    // Configuration 1: The "Modern" Attempt
    const configModern = {
        user: USER,
        password: PASSWORD,
        server: SERVER,
        database: DATABASE,
        options: {
            encrypt: true, // Modern Default
            trustServerCertificate: true,
            connectTimeout: 5000
        }
    };

    // Configuration 2: The "Legacy" Attempt (Most likely to work for you)
    const configLegacy = {
        user: USER,
        password: PASSWORD,
        server: SERVER,
        database: DATABASE,
        options: {
            encrypt: false, // REQUIRED for SQL 2008/2012 local networks
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 5000,
            // Downgrade Security for Old Servers
            cryptoCredentialsDetails: {
                minVersion: 'TLSv1'
            }
        }
    };

    try {
        console.log("\\nAttempt 1: Trying Modern Secure Connection...");
        await sql.connect(configModern);
        console.log("✅ SUCCESS! Connected using Modern Settings.");
        await sql.close();
        return;
    } catch (err) {
        console.log("❌ Failed (Modern):", err.code || err.message);
    }

    try {
        console.log("\\nAttempt 2: Trying LEGACY Connection (No Encryption + TLS 1.0)...");
        await sql.connect(configLegacy);
        console.log("✅ SUCCESS! Connected using Legacy Settings.");
        console.log("👉 ACTION: Update your route.ts to use 'encrypt: false'");
        
        // Test Query
        const result = await sql.query\`SELECT @@VERSION as ver\`;
        console.log("\\nServer Version:", result.recordset[0].ver);
        
        await sql.close();
        return;
    } catch (err) {
        console.log("❌ Failed (Legacy):", err.message);
        console.log("\\n--- 🛑 DIAGNOSIS REPORT ---");
        
        if (err.code === 'ESOCKET') {
            console.log("Reason: The Server is not reachable at this IP/Port.");
            console.log("Fix 1: Is TCP/IP enabled in SQL Configuration Manager?");
            console.log("Fix 2: Is Windows Firewall blocking Port 1433?");
        } else if (err.code === 'ELOGIN') {
            console.log("Reason: The Server was found, but Password/User is wrong.");
        } else if (err.code === 'EPROTOCOL') {
            console.log("Reason: The Server is too old for Node.js default security.");
        }
    }
}

testConnection();
`;

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

  const handleDownloadScript = () => {
    try {
      const blob = new Blob([bridgeScriptContent.trim()], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "debug-connect.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Script Downloaded",
        description: "debug-connect.js has been downloaded successfully.",
      });
    } catch (error) {
       toast({
        title: "Download Failed",
        description: "Could not prepare the script for download.",
        variant: "destructive"
      });
    }
  };

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
      const message = `Network Error: Could not reach the API route. Ensure the application server is running or the local bridge is active.`;
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

    const chunkSize = 20;
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
    <div className="space-y-6">
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
          </div>
        </section>
      </CardContent>
    </Card>
        <Card className="border-destructive/40 bg-destructive/5 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
                    <Info className="h-4 w-4" />
                    <span>Action Required: Run the Local API Bridge</span>
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    Your web application is deployed online (on Vercel), but your SQL database is on a private, local network. The web server cannot directly connect to it. To solve this, you must run a special "bridge" script on a computer inside your local network.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                    <h4 className="font-semibold">Step 1: Download the Bridge Script</h4>
                    <p className="text-muted-foreground">
                        Click the button below to download the <code className="font-mono text-xs">debug-connect.js</code> file. Place this file in a dedicated folder on the computer you will use as the bridge.
                    </p>
                     <Button variant="secondary" size="sm" onClick={handleDownloadScript}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Bridge Script
                    </Button>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">Step 2: Open a Terminal</h4>
                    <p className="text-muted-foreground">
                        On the chosen bridge computer, open a command prompt (CMD, PowerShell) or terminal and navigate into the folder where you saved the script.
                    </p>
                </div>
                <div className="space-y-2">
                    <h4 className="font-semibold">Step 3: Run the Bridge Script</h4>
                    <p className="text-muted-foreground">
                        With Node.js installed on that machine, run the following command in the terminal:
                    </p>
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-semibold">node debug-connect.js</code>
                    </div>
                     <p className="text-xs text-muted-foreground pt-1">
                        If you see a "SUCCESS" message, the script has connected to your database successfully. For now, this script is for diagnostics. In the future, we can expand it to be a long-running server.
                    </p>
                </div>
                 <div className="space-y-2 pt-2 border-t border-dashed border-destructive/20">
                     <h4 className="font-semibold">Important Note</h4>
                    <p className="text-xs text-muted-foreground">
                        The "Test Connection" and "Push Mutations" buttons will NOT work until this local bridge is made into a full server. The current script is for connection testing only. Your browser cannot directly execute the database logic.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    
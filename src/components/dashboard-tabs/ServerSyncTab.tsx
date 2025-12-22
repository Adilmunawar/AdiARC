"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Database, Key, Loader2, Server, Wifi } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "live";
type InventoryItem = {
  id: string | null;
  file: string;
  folder: string;
  source: string;
  status: "valid" | "stripped" | "no-match";
  fileObject?: File;
};

interface ServerSyncTabProps {
  inventoryItems: InventoryItem[];
}

export function ServerSyncTab({ inventoryItems }: ServerSyncTabProps) {
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
  const [encrypt, setEncrypt] = useState<boolean>(() => safeLocalStorageGet("adiarc_sql_encrypt", "false") === "true");
  const [trustServerCertificate, setTrustServerCertificate] = useState<boolean>(() =>
    safeLocalStorageGet("adiarc_sql_trustcert", "true") === "true",
  );
  const [connectionTimeout, setConnectionTimeout] = useState<string>(() =>
    safeLocalStorageGet("adiarc_sql_timeout", "15000"),
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [isSyncingToServer, setIsSyncingToServer] = useState<boolean>(false);
  const [lastConnectionMessage, setLastConnectionMessage] = useState<string | null>(null);

  const handleSaveServerConfig = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("adiarc_sql_server", serverIp.trim());
        window.localStorage.setItem("adiarc_sql_port", port.trim());
        window.localStorage.setItem("adiarc_sql_database", databaseName.trim());
        window.localStorage.setItem("adiarc_sql_user", dbUser.trim());
        window.localStorage.setItem("adiarc_sql_password", dbPassword.trim());
        window.localStorage.setItem("adiarc_sql_encrypt", String(encrypt));
        window.localStorage.setItem("adiarc_sql_trustcert", String(trustServerCertificate));
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
          encrypt,
          trustServerCertificate,
          connectionTimeout,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus("live");
        setLastConnectionMessage(`✅ ${result.message}`);
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        setConnectionStatus("disconnected");
        setLastConnectionMessage(`❌ ${result.error}`);
        toast({
          title: "Connection Test Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus("disconnected");
      const message = "Network Error: Could not reach the API route.";
      setLastConnectionMessage(`❌ ${message}`);
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSyncToServer = async () => {
    const validItems = inventoryItems.filter((i) => i.status === "valid" && i.id && i.file);
    if (validItems.length === 0) {
      toast({ title: "Nothing to sync", description: "No valid mutation items to upload." });
      return;
    }

    setIsSyncingToServer(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upload",
          serverIp,
          port,
          dbName: databaseName,
          dbUser,
          dbPassword,
          encrypt,
          trustServerCertificate,
          connectionTimeout,
          mutations: validItems.map((item) => ({ id: item.id, file: item.file })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Sync Complete", description: `Uploaded ${result.count} new records successfully.` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncingToServer(false);
    }
  };
  const pendingUploadCount = inventoryItems.filter((item) => item.status === "valid").length;

  return (
    <Card className="border-border/70 bg-card/80 shadow-md">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Database className="h-4 w-4 text-primary" />
            <span>Server Sync (LRMIS Bridge)</span>
          </CardTitle>
          <CardDescription>
            Configure the SQL Server connection used by the legacy desktop app and drive uploads from the browser.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Wifi
            className={
              connectionStatus === "live"
                ? "h-4 w-4 text-primary animate-pulse"
                : connectionStatus === "connecting"
                ? "h-4 w-4 text-muted-foreground animate-pulse"
                : "h-4 w-4 text-destructive"
            }
          />
          <Badge
            variant={connectionStatus === "live" ? "default" : connectionStatus === "connecting" ? "secondary" : "destructive"}
            className="uppercase tracking-wide"
          >
            {connectionStatus === "live" ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Disconnected"}
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
                <div className="flex items-center space-x-2">
                  <Switch id="sql-encrypt" checked={encrypt} onCheckedChange={setEncrypt} />
                  <Label htmlFor="sql-encrypt" className="text-xs">
                    Force Encryption
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sql-trust-cert"
                    checked={trustServerCertificate}
                    onCheckedChange={setTrustServerCertificate}
                  />
                  <Label htmlFor="sql-trust-cert" className="text-xs">
                    Trust Self-Signed Cert
                  </Label>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveServerConfig}
                className="h-8 px-3 text-[11px]"
                disabled={isTestingConnection || isSyncingToServer}
              >
                Save configuration
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleTestServerConnection}
                disabled={isTestingConnection}
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

          {/* Right: Sync status */}
          <div className="space-y-4 rounded-md border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Pending uploads</p>
                <p className="text-[11px] text-muted-foreground">
                  Valid mutation IDs discovered in the XMP Mutation Inventory tab.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {pendingUploadCount} pending
              </Badge>
            </div>

            <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px]">
              <p className="font-medium mb-1">Current configuration snapshot</p>
              <p className="text-muted-foreground">
                Server: <span className="font-mono">{serverIp || "—"}:{port || "1433"}</span>
              </p>
              <p className="text-muted-foreground">
                Database: <span className="font-mono">{databaseName || "—"}</span>
              </p>
              <p className="text-muted-foreground">
                User: <span className="font-mono">{dbUser || "—"}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleSyncToServer}
                disabled={connectionStatus !== "live" || pendingUploadCount === 0 || isSyncingToServer || isTestingConnection}
                className="w-full justify-center text-[13px] font-semibold"
              >
                {isSyncingToServer ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing to server...
                  </span>
                ) : (
                  "Sync to server"
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                This web UI only drives the sync workflow. Actual SQL connections are executed by your local server proxy
                listening on <code>/api/sync</code>.
              </p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}


"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Database, Key, Loader2, Server, Wifi } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "live";

export function DbStatusTab() {
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
      const message = `Network Error: Could not reach the API endpoint. This tool requires the local API bridge to be running. Please check the 'Server Sync' tab for instructions.`;
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
  
  return (
    <Card className="max-w-2xl mx-auto border-border/70 bg-card/80 shadow-md">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <DatabaseZap className="h-4 w-4 text-primary" />
            <span>Database Status Checker</span>
          </CardTitle>
          <CardDescription>
            Test the connectivity to a local SQL Server instance.
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
        <section className="space-y-4 rounded-md border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Connection Settings</p>
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
                <Label htmlFor="sql-db-name" className="flex items-center gap-1 text-xs">
                  <Database className="h-3.5 w-3.5" />
                  <span>Database Name</span>
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
            
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-dashed border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveServerConfig}
                className="h-8 px-3 text-[11px]"
                disabled={isTestingConnection}
              >
                Save Configuration
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
                    Pinging Server...
                  </span>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </div>

            {lastConnectionMessage && <p className="pt-1 text-[11px] text-muted-foreground">{lastConnectionMessage}</p>}
        </section>
        <div className="text-center text-xs text-muted-foreground">
            <p className="font-semibold">Note: This tool requires the local API bridge to be active on your network.</p>
            <p>Please see the "Server Sync" tab for instructions on how to download and run the bridge script.</p>
        </div>
      </CardContent>
    </Card>
  );
}

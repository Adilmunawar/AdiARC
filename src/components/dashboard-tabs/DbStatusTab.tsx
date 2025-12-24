
"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { DatabaseZap, Loader2, Server, Wifi } from "lucide-react";

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

  // We only need the IP for the status check, but we get the other details from storage
  // to pre-fill the Server Sync tab.
  const [serverIp, setServerIp] = useState<string>(() => safeLocalStorageGet("adiarc_sql_server", "192.125.6.11"));
  const [port, setPort] = useState<string>(() => safeLocalStorageGet("adiarc_sql_port", "1433"));
  const [dbName, setDbName] = useState<string>(() => safeLocalStorageGet("adiarc_sql_database", "Judiya_Pur"));
  const [dbUser, setDbUser] = useState<string>(() => safeLocalStorageGet("adiarc_sql_user", "sa"));
  const [dbPassword, setDbPassword] = useState<string>(() => safeLocalStorageGet("adiarc_sql_password", "justice@123"));
  const [connectionTimeout, setConnectionTimeout] = useState<string>(() => safeLocalStorageGet("adiarc_sql_timeout", "15000"));

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [lastConnectionMessage, setLastConnectionMessage] = useState<string | null>(null);

  const handleTestServerConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("connecting");
    setLastConnectionMessage(null);

    // Save the IP on test so it can be used by other tabs.
    try {
       if (typeof window !== "undefined") {
         window.localStorage.setItem("adiarc_sql_server", serverIp.trim());
       }
    } catch {
      // Non-critical, ignore if local storage is blocked
    }


    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "test",
          serverIp,
          port,
          dbName,
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
        const errorMsg = result.error || 'An unknown error occurred.';

        // The server is still "active" if it responded with an auth error.
        if (errorMsg.includes("Auth Successful") || errorMsg.includes("Login failed")) {
           setConnectionStatus("live");
           setLastConnectionMessage(`✅ Server is Active. (Authentication failed, but the server is online).`);
           toast({
             title: "Server is Active",
             description: "The server responded, but the credentials stored in your browser are incorrect.",
           });
        } else {
            setConnectionStatus("disconnected");
            setLastConnectionMessage(`❌ ${errorMsg}`);
            toast({
              title: "Connection Test Failed",
              description: errorMsg,
              variant: "destructive",
            });
        }
      }
    } catch (error: any) {
      setConnectionStatus("disconnected");
      const message = `Network Error: Could not reach the API endpoint. The app must be running on the same local network as the database.`;
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
            Ping a local SQL Server to check if it's active and reachable on the network.
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
            {connectionStatus === "live" ? "Active" : connectionStatus === "connecting" ? "Pinging..." : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4 rounded-md border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Server Details</p>
               <span className="text-[11px] text-muted-foreground">Uses stored credentials from Sync tab</span>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="sql-server-ip" className="flex items-center gap-1 text-xs">
                  <Server className="h-3.5 w-3.5" />
                  <span>Server IP Address</span>
                </Label>
                <Input
                  id="sql-server-ip"
                  value={serverIp}
                  onChange={(e) => setServerIp(e.target.value)}
                  placeholder="192.125.6.11"
                  className="h-9 text-sm"
                />
              </div>
            
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-dashed border-border">
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
                  "Ping Server"
                )}
              </Button>
            </div>

            {lastConnectionMessage && <p className="pt-1 text-[11px] text-muted-foreground">{lastConnectionMessage}</p>}
        </section>
        <div className="text-center text-xs text-muted-foreground">
            <p className="font-semibold">Note: This tool requires the Next.js application to be running on the same local network as the SQL Server.</p>
            <p>If the app is deployed to the cloud, it will not be able to reach a private database IP address.</p>
        </div>
      </CardContent>
    </Card>
  );
}

    
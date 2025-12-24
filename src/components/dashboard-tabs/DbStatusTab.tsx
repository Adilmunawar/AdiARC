
"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { DatabaseZap, Loader2, Server, Wifi, AlertTriangle } from "lucide-react";

type ConnectionStatus = "idle" | "connecting" | "live" | "failed";

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

  const [serverIp, setServerIp] = useState<string>(() => safeLocalStorageGet("adiarc_ping_ip", "192.125.6.11"));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const handlePingServer = async () => {
    setConnectionStatus("connecting");
    setLastMessage(null);

    // Hardcoded port for simplicity
    const port = "1433"; 

    // Save the IP on test so it persists.
    try {
       if (typeof window !== "undefined") {
         window.localStorage.setItem("adiarc_ping_ip", serverIp.trim());
       }
    } catch {
      // Non-critical, ignore if local storage is blocked
    }


    try {
      const response = await fetch("/api/db-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverIp, port }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setConnectionStatus("live");
        setLastMessage(result.message);
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        const errorMsg = result.error || 'An unknown error occurred.';
        setConnectionStatus("failed");
        setLastMessage(errorMsg);
        toast({
            title: "Connection Test Failed",
            description: errorMsg,
            variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus("failed");
      const message = `Network Error: The API route is unreachable.`;
      setLastMessage(message);
      toast({
        title: "API Communication Failed",
        description: message,
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadge = () => {
      switch(connectionStatus) {
        case 'live':
            return <Badge variant="default" className="uppercase tracking-wide bg-green-600">Active</Badge>
        case 'connecting':
            return <Badge variant="secondary" className="uppercase tracking-wide">Pinging...</Badge>
        case 'failed':
            return <Badge variant="destructive" className="uppercase tracking-wide">Offline</Badge>
        case 'idle':
        default:
             return <Badge variant="outline" className="uppercase tracking-wide">Idle</Badge>
      }
  }

  const getStatusIcon = () => {
       switch(connectionStatus) {
        case 'live':
            return <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
        case 'connecting':
            return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        case 'failed':
            return <Wifi className="h-4 w-4 text-destructive" />
        case 'idle':
        default:
             return <Wifi className="h-4 w-4 text-muted-foreground" />
      }
  }

  return (
    <Card className="max-w-2xl mx-auto border-border/70 bg-card/80 shadow-md animate-enter">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <DatabaseZap className="h-5 w-5 text-primary" />
            <span>Database Status Checker</span>
          </CardTitle>
          <CardDescription>
            Ping a local SQL Server to check if it's active and reachable on the network.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="sql-server-ip" className="flex items-center gap-1 text-xs">
                <Server className="h-3.5 w-3.5" />
                <span>Server IP Address</span>
                </Label>
                <Input
                id="sql-server-ip"
                value={serverIp}
                onChange={(e) => setServerIp(e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="h-10 text-sm"
                disabled={connectionStatus === 'connecting'}
                />
            </div>
            
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-dashed border-border">
                <p className="text-xs text-muted-foreground">
                    This tool will attempt to connect on the default SQL Server port (1433).
                </p>
                <Button
                    type="button"
                    size="lg"
                    onClick={handlePingServer}
                    disabled={connectionStatus === 'connecting' || !serverIp}
                    className="px-6 text-sm font-semibold shadow-md"
                >
                    {connectionStatus === 'connecting' ? (
                    <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pinging...
                    </span>
                    ) : (
                    "Ping Server"
                    )}
                </Button>
            </div>

            {lastMessage && (
                <div className={`mt-4 p-3 rounded-md text-xs ${connectionStatus === 'live' ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'}`}>
                    <p className="font-medium">{lastMessage}</p>
                </div>
            )}
        </section>

        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800/90 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
                <p className="font-semibold">Local Network Access Required</p>
                <p>This tool requires the Next.js application to be running on the same local network as the SQL Server. If this application is deployed to a cloud service like Vercel, it will not be able to reach a private database IP address.</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/context/InventoryContext';
import { TestTube2, UploadCloud, Loader2 } from 'lucide-react';
import type { SQLConfig } from '@/types';

const formSchema = z.object({
  server: z.string().min(1, 'Server IP is required.'),
  database: z.string().min(1, 'Database name is required.'),
  user: z.string().min(1, 'Username is required.'),
  password: z.string().optional(),
});

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error';

export default function ServerBridgePage() {
  const { toast } = useToast();
  const { validItems, setInventory } = useInventory();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      server: '192.125.6.11',
      database: 'Judiya_Pur',
      user: 'sa',
      password: '',
    },
  });
  
  const handleApiRequest = async (action: 'test' | 'upload', config: SQLConfig, data?: any) => {
    try {
      const response = await fetch('http://localhost:3001/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, config, data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      return result;

    } catch (error) {
      console.error(`API request failed for action: ${action}`, error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      let finalMessage = errorMessage;
      if(errorMessage.includes('Failed to fetch')) {
        finalMessage = 'Connection to proxy server failed. Is it running?';
      }
      
      toast({
        variant: 'destructive',
        title: 'Proxy Error',
        description: finalMessage,
      });
      return { success: false, message: finalMessage };
    }
  };


  const onTestConnection = async (values: z.infer<typeof formSchema>) => {
    setConnectionStatus('connecting');
    const result = await handleApiRequest('test', values);

    if (result.success) {
      setConnectionStatus('connected');
      toast({ title: 'Success', description: result.message });
    } else {
      setConnectionStatus('error');
      toast({ variant: 'destructive', title: 'Connection Failed', description: result.message });
    }
  };
  
  const onSync = async () => {
    if (validItems.length === 0) {
      toast({ title: 'No Data', description: 'There are no valid items to sync.' });
      return;
    }
    
    setSyncStatus('syncing');
    const config = form.getValues();
    const dataToSync = validItems.map(item => ({ id: item.id, fileName: item.fileName }));

    const result = await handleApiRequest('upload', config, dataToSync);

    if (result.success) {
      setSyncStatus('complete');
      toast({ title: 'Sync Successful', description: result.message });
      // Optimistically clear inventory - or re-scan to confirm
      setInventory([]);
    } else {
      setSyncStatus('error');
      toast({ variant: 'destructive', title: 'Sync Failed', description: result.message });
    }
    setTimeout(() => setSyncStatus('idle'), 5000);
  };
  
  const statusIndicatorColor = {
    disconnected: 'bg-gray-400',
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>SQL Server Configuration</CardTitle>
          <CardDescription>Enter the credentials for the legacy SQL server.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onTestConnection)} className="space-y-6">
              <FormField name="server" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Server IP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="database" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Database Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="user" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <TestTube2 className="mr-2 h-4 w-4" />}
                Test Connection
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Connection Status</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusIndicatorColor[connectionStatus]}`} />
                        <span className="text-sm capitalize text-muted-foreground">{connectionStatus}</span>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <Card className="flex flex-col">
            <CardHeader>
            <CardTitle>Sync Action</CardTitle>
            <CardDescription>Upload your validated inventory to the server.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center gap-4">
            <div className="text-6xl font-bold text-primary">{validItems.length}</div>
            <p className="text-muted-foreground">Pending Uploads</p>
            <Button size="lg" className="w-full" onClick={onSync} disabled={syncStatus === 'syncing' || connectionStatus !== 'connected'}>
                {syncStatus === 'syncing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UploadCloud className="mr-2 h-4 w-4" />}
                Sync to Server
            </Button>
            {connectionStatus !== 'connected' && <p className="text-xs text-destructive">A successful connection test is required before syncing.</p>}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

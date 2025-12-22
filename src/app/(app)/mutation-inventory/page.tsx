"use client";

import React, { useState, useTransition } from 'react';
import ExifReader from 'exifreader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Scan, FolderSync } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInventory } from '@/context/InventoryContext';
import { downloadCSV } from '@/lib/csv';
import type { InventoryItem, InventoryStatus } from '@/types';
import { InventoryStats } from './components/InventoryStats';
import { InventoryTable } from './components/InventoryTable';

type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';

// The "Universal Hunter" logic to find the Mutation Number
const findDocumentNo = (obj: any, sourcePath = ''): { id: string, source: string } | null => {
  if (obj === null || typeof obj !== 'object') return null;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = sourcePath ? `${sourcePath}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        // Match against path or specific property
        const pathString = value['hmx:path'] || currentPath;
        if (typeof pathString === 'string' && pathString.toLowerCase().includes('documentno')) {
          if (value.value || value.description) {
            return { id: String(value.value || value.description), source: currentPath };
          }
        }
        
        const result = findDocumentNo(value, currentPath);
        if (result) return result;
      }
    }
  }
  return null;
};


export default function MutationInventoryPage() {
  const { inventory, setInventory, clearInventory } = useInventory();
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const stats = React.useMemo(() => ({
    found: inventory.filter(f => f.status === 'Valid').length,
    noMatch: inventory.filter(f => f.status === 'No Match').length,
    stripped: inventory.filter(f => f.status === 'Stripped').length,
  }), [inventory]);

  const handleFolderSelect = async () => {
    if (typeof window.showDirectoryPicker !== 'function') {
      alert('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      clearInventory();
      setScanStatus('scanning');
      setProgress(0);
      
      startTransition(async () => {
        const fileHandles: FileSystemFileHandle[] = [];
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                fileHandles.push(entry);
            }
        }
        
        const results: InventoryItem[] = [];
        let processedCount = 0;

        for (const fileHandle of fileHandles) {
          const file = await fileHandle.getFile();
          let item: InventoryItem = { id: null, fileName: file.name, fileHandle, status: 'Stripped', sourceTag: null };

          try {
            const tags = await ExifReader.load(file);
            if (Object.keys(tags).length > 0) {
              const docInfo = findDocumentNo(tags);
              if (docInfo && docInfo.id) {
                item = { ...item, id: docInfo.id, status: 'Valid', sourceTag: docInfo.source };
              } else {
                item = { ...item, status: 'No Match' };
              }
            }
          } catch (error) {
            // Remains 'Stripped'
            console.warn(`Could not process ${file.name}:`, error);
          }
          results.push(item);
          processedCount++;
          setProgress((processedCount / fileHandles.length) * 100);
        }
        setInventory(results);
        setScanStatus('complete');
      });

    } catch (error) {
      console.error('Error selecting folder:', error);
      if ((error as Error).name !== 'AbortError') {
        setScanStatus('error');
      } else {
        setScanStatus('idle');
      }
    }
  };
  
  const handleDownload = () => {
    downloadCSV(inventory, `adiarc-inventory-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Local Scanner</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button size="lg" onClick={handleFolderSelect} disabled={scanStatus === 'scanning'}>
            <Scan className="mr-2 h-5 w-5" />
            Select Folder to Scan
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleDownload} disabled={inventory.length === 0 || stats.found === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="ghost" onClick={() => { clearInventory(); setScanStatus('idle')}} disabled={inventory.length === 0}>
                <FolderSync className="mr-2 h-4 w-4" />
                Clear
            </Button>
          </div>
        </CardContent>
        {scanStatus === 'scanning' && (
          <CardContent>
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Scanning... {Math.round(progress)}%</p>
                <Progress value={progress} />
            </div>
          </CardContent>
        )}
      </Card>

      {inventory.length > 0 && <InventoryStats stats={stats} />}

      <Card>
        <CardHeader>
            <CardTitle>Scan Results</CardTitle>
        </CardHeader>
        <CardContent>
            <InventoryTable items={inventory} />
        </CardContent>
      </Card>
    </div>
  );
}

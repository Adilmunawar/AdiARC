import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { InventoryItem, InventoryStatus } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InventoryTableProps {
  items: InventoryItem[];
}

const statusVariant: Record<InventoryStatus, 'default' | 'secondary' | 'destructive'> = {
  'Valid': 'default',
  'No Match': 'secondary',
  'Stripped': 'destructive',
};

const statusColor: Record<InventoryStatus, string> = {
    'Valid': 'bg-green-500/20 text-green-800 border-green-500/30 hover:bg-green-500/30',
    'No Match': 'bg-amber-500/20 text-amber-800 border-amber-500/30 hover:bg-amber-500/30',
    'Stripped': 'bg-red-500/20 text-red-800 border-red-500/30 hover:bg-red-500/30'
}

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <ScrollArea className="h-[400px] rounded-md border">
        <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                <TableRow>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Mutation ID</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Source Tag</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No files scanned yet. Select a folder to begin.
                        </TableCell>
                    </TableRow>
                ) : (
                items.map((item, index) => (
                    <TableRow key={`${item.fileName}-${index}`}>
                    <TableCell>
                        <Badge variant={statusVariant[item.status]} className={statusColor[item.status]}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.id || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{item.fileName}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{item.sourceTag || 'N/A'}</TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
        </Table>
    </ScrollArea>
  );
}

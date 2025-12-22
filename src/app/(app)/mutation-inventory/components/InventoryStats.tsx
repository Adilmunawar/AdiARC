import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface InventoryStatsProps {
  stats: {
    found: number;
    noMatch: number;
    stripped: number;
  };
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-green-500/50 bg-green-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Found IDs</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">{stats.found}</div>
          <p className="text-xs text-green-700">Valid records with Mutation ID.</p>
        </CardContent>
      </Card>
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-800">No Match</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-800">{stats.noMatch}</div>
          <p className="text-xs text-amber-700">Metadata found, but no ID matched.</p>
        </CardContent>
      </Card>
      <Card className="border-red-500/50 bg-red-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Stripped Files</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-800">{stats.stripped}</div>
          <p className="text-xs text-red-700">Files with no readable metadata.</p>
        </CardContent>
      </Card>
    </div>
  );
}

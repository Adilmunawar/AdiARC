import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanSearch, DatabaseZap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to AdiArc</h1>
        <p className="text-muted-foreground">Your forensic land record inventory and upload system.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutation Inventory</CardTitle>
            <ScanSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Scan local image folders to find and validate Mutation Numbers from file metadata.
            </p>
            <Link href="/mutation-inventory" className="text-primary font-semibold text-sm mt-4 block">
              Start Scanning &rarr;
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Bridge</CardTitle>
            <DatabaseZap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configure your SQL Server connection and upload your validated inventory.
            </p>
            <Link href="/server-bridge" className="text-primary font-semibold text-sm mt-4 block">
              Configure & Sync &rarr;
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gap Analysis</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Future module for analyzing missing records and data inconsistencies.
            </p>
             <Link href="/gap-analysis" className="text-primary font-semibold text-sm mt-4 block">
              View Analysis &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

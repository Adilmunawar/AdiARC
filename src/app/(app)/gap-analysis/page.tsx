import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function GapAnalysisPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Gap Analysis</CardTitle>
          <CardDescription>This feature is currently under development.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Gap Analysis module will provide insights into missing records and data inconsistencies. Check back for future updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

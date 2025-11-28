// app/admin/errors/page.tsx
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Clock, FileWarning } from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: string;
  message: string;
  stack: string | null;
  context: any;
  userId: string | null;
}

export default async function ErrorsPage() {
  // Query error logs via a raw SQL query to avoid relying on a missing Prisma model;
  // alternatively add the ErrorLog model to prisma/schema.prisma and run prisma generate/migrate.
  const errors = await db.$queryRaw<ErrorLog[]>`
    SELECT
      id,
      timestamp,
      level,
      message,
      stack,
      context,
      "userId"
    FROM "ErrorLog"
    ORDER BY timestamp DESC
    LIMIT 100
  `;

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Error Logs</h1>
        <p className="text-muted-foreground">System error tracking and monitoring</p>
      </div>

      {errors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No errors logged</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {errors.map((error) => (
            <ErrorCard key={error.id} error={error} />
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorCard({ error }: { error: ErrorLog }) {
  const levelColors = {
    error: 'destructive',
    warning: 'default',
    info: 'secondary'
  } as const;

  return (
    <Card className="border-l-4 border-l-destructive">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-lg">{error.message}</CardTitle>
              <Badge variant={levelColors[error.level as keyof typeof levelColors] || 'default'}>
                {error.level.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(error.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </CardHeader>
      {error.stack && (
        <CardContent>
          <ScrollArea className="h-32 w-full rounded-md border bg-muted p-3">
            <pre className="text-xs font-mono">{error.stack}</pre>
          </ScrollArea>
          {error.context && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium">Additional Context</summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/lib/auditApi';
import { AppPageHeader, AppCard, AppCardContent } from '@/components/ui-system';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LIMIT = 50;

export default function AuditLogsPage() {
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', offset],
    queryFn: () => listAuditLogs({ limit: LIMIT, offset }),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const handleNext = () => {
    if (offset + LIMIT < total) {
      setOffset(offset + LIMIT);
    }
  };

  const handlePrev = () => {
    setOffset(Math.max(0, offset - LIMIT));
  };

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Audit Logs"
        description="Review system activities and compliance events."
      />

      <AppCard>
        <AppCardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.performedBy.name}</div>
                      <div className="text-xs text-muted-foreground">{log.performedBy.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.entityType}</Badge>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">
                        {log.entityId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{log.action}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs max-w-[300px] overflow-hidden text-ellipsis">
                        {log.fieldChanged && (
                          <span className="font-bold mr-1">{log.fieldChanged}:</span>
                        )}
                        {log.newValue ? JSON.stringify(log.newValue) : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + LIMIT, total)} of {total} events
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={offset + LIMIT >= total}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}

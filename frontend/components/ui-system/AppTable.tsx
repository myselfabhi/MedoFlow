'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppEmptyState } from './AppEmptyState';
import { cn } from '@/lib/utils';

export interface AppTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

export interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
}

export function AppTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  className,
}: AppTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-2xl border border-slate-100', className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  'h-12 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground',
                  col.className
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-48 p-0 align-top"
              >
                <AppEmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  actionLabel={emptyActionLabel}
                  onAction={onEmptyAction}
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={keyExtractor(item)}
                className="border-b border-slate-100 text-sm hover:bg-subtle transition-colors"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm text-foreground',
                      col.className
                    )}
                  >
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

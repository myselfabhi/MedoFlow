'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { FormResponseItem } from '@/lib/formsApi';
import type { FormFieldDefinition } from '@/lib/formsApi';
import { format } from 'date-fns';

function renderFieldValue(
  value: unknown,
  fieldDef?: FormFieldDefinition
): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {String(v)}
          </Badge>
        ))}
      </div>
    );
  }
  if (typeof value === 'number') return String(value);
  return <p className="whitespace-pre-wrap text-sm">{String(value)}</p>;
}

interface IntakeFormsSectionProps {
  responses: FormResponseItem[];
  appointmentId: string;
  isLoading?: boolean;
}

export function IntakeFormsSection({
  responses,
  appointmentId,
  isLoading,
}: IntakeFormsSectionProps) {
  const filtered = responses.filter(
    (r) => r.appointmentId === appointmentId || r.appointment?.id === appointmentId
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intake Forms</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intake Forms</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No intake forms submitted for this appointment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fields = (t: { fields?: unknown }) =>
    (Array.isArray(t?.fields) ? t.fields : []) as FormFieldDefinition[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Intake Forms</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {filtered.map((r) => {
            const templateFields = fields(r.template as { fields?: unknown });
            const fieldMap = new Map(templateFields.map((f) => [f.id, f]));
            return (
              <AccordionItem key={r.id} value={r.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {(r.template as { name?: string })?.name ?? 'Form'}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {Object.entries(r.responses ?? {}).map(([fieldId, value]) => {
                      const def = fieldMap.get(fieldId);
                      const label = def?.label ?? fieldId;
                      return (
                        <div key={fieldId}>
                          <p className="font-medium text-sm text-gray-700">{label}</p>
                          <div className="mt-1">
                            {renderFieldValue(value, def)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

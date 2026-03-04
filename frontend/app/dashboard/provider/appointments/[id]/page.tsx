'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import {
  getAppointmentById,
  getVisitByAppointment,
} from '@/lib/patientApi';
import {
  getInvoicesByAppointment,
  createInvoice,
  finalizeInvoice,
  payInvoice,
  updateInvoiceItem,
  deleteInvoiceItem,
  type Invoice,
  type InvoiceItem,
} from '@/lib/invoiceApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddServiceDialog } from '@/components/invoice/AddServiceDialog';
import { IntakeFormsSection } from '@/components/intake/IntakeFormsSection';
import { PatientRecordSheet } from '@/components/patient/PatientRecordSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getPatientForms } from '@/lib/formsApi';
import { useAppToast } from '@/hooks/useAppToast';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function InvoiceItemRow({
  item,
  canEdit,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  item: InvoiceItem;
  canEdit: boolean;
  onUpdate: (unitPrice?: number, quantity?: number) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [unitPrice, setUnitPrice] = useState(item.unitPrice);
  const [quantity, setQuantity] = useState(String(item.quantity));

  const handleUnitPriceBlur = () => {
    const num = parseFloat(unitPrice);
    if (!Number.isNaN(num) && num >= 0 && num !== parseFloat(item.unitPrice)) {
      onUpdate(num, undefined);
    } else {
      setUnitPrice(item.unitPrice);
    }
  };

  const handleQuantityBlur = () => {
    const num = Math.max(1, Math.floor(parseInt(quantity, 10) || 1));
    if (num !== item.quantity) {
      onUpdate(undefined, num);
    } else {
      setQuantity(String(item.quantity));
    }
  };

  React.useEffect(() => {
    setUnitPrice(item.unitPrice);
    setQuantity(String(item.quantity));
  }, [item.unitPrice, item.quantity]);

  return (
    <TableRow>
      <TableCell className="font-medium">{item.service?.name ?? '—'}</TableCell>
      <TableCell>{item.description}</TableCell>
      <TableCell className="text-right">
        {canEdit ? (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            onBlur={handleUnitPriceBlur}
            disabled={isUpdating}
            className="h-8 w-24 text-right"
          />
        ) : (
          item.unitPrice
        )}
      </TableCell>
      <TableCell className="text-right">
        {canEdit ? (
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={handleQuantityBlur}
            disabled={isUpdating}
            className="h-8 w-16 text-right"
          />
        ) : (
          item.quantity
        )}
      </TableCell>
      <TableCell className="text-right">{item.totalPrice}</TableCell>
      {canEdit && (
        <TableCell>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete()}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function ProviderAppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [recordSheetOpen, setRecordSheetOpen] = useState(false);

  const { data: appointment, isLoading: appointmentLoading, error: appointmentError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentById(id),
    enabled: !!id,
  });

  const { data: visitRecord } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => (appointment ? getVisitByAppointment(id, appointment.clinicId) : null),
    enabled: !!appointment?.id,
  });

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', 'appointment', id],
    queryFn: () => getInvoicesByAppointment(id, appointment?.clinicId),
    enabled: !!appointment?.id,
  });

  const { data: formResponses = [], isLoading: formsLoading } = useQuery({
    queryKey: ['forms', 'patient', appointment?.patientId, appointment?.clinicId],
    queryFn: () => getPatientForms(appointment!.patientId, appointment?.clinicId),
    enabled: !!appointment?.patientId && !!appointment?.clinicId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createInvoice({
        appointmentId: id,
        providerId: appointment!.providerId,
        clinicId: appointment?.clinicId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Invoice created');
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (invoiceId: string) => finalizeInvoice(invoiceId, appointment?.clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Invoice finalized');
    },
    onError: () => toast.error('Failed to finalize invoice'),
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: string) => payInvoice(invoiceId, appointment?.clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Invoice marked as paid');
    },
    onError: () => toast.error('Failed to mark invoice as paid'),
  });

  const invoice = invoices[0] ?? null;
  const isDraft = invoice?.status === 'DRAFT';
  const isFinalized = invoice?.status === 'FINALIZED';
  const isPaid = invoice?.status === 'PAID';
  const canEdit = isDraft;

  const handleAddItemSuccess = () => {
    refetchInvoices();
  };

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      unitPrice,
      quantity,
    }: {
      itemId: string;
      unitPrice?: number;
      quantity?: number;
    }) =>
      updateInvoiceItem(invoice!.id, itemId, { unitPrice, quantity }, appointment?.clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Item updated');
    },
    onError: () => toast.error('Failed to update item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      deleteInvoiceItem(invoice!.id, itemId, appointment?.clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Item removed');
    },
    onError: () => toast.error('Failed to remove item'),
  });

  if (appointmentLoading || !appointment) {
    if (appointmentError) {
      return (
        <div className="space-y-6">
          <Link href="/dashboard/appointments" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to appointments
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Appointment not found or access denied.
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/appointments"
        className="inline-block text-sm text-primary-600 hover:text-primary-700"
      >
        ← Back to appointments
      </Link>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{appointment.service.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {appointment.provider.firstName} {appointment.provider.lastName}
                </dd>
                </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(appointment.startTime)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={appointment.status} variant="appointment" />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {visitRecord && (
          <Card>
            <CardHeader>
              <CardTitle>Visit Record</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StatusBadge status={visitRecord.status} variant="visitRecord" />
              <div className="mt-4 space-y-4">
                {visitRecord.subjective && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Subjective</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.subjective}
                    </p>
                  </div>
                )}
                {visitRecord.objective && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Objective</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.objective}
                    </p>
                  </div>
                )}
                {visitRecord.assessment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Assessment</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.assessment}
                    </p>
                  </div>
                )}
                {visitRecord.plan && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Plan</h3>
                    <p className="mt-1 whitespace-pre-wrap rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900">
                      {visitRecord.plan}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!invoice ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm text-gray-500">No invoice for this appointment yet.</p>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <StatusBadge status={invoice.status} variant="invoice" />
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddServiceOpen(true)}
                    >
                      Add Service
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        {canEdit && <TableHead className="w-[80px]" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items?.length ? (
                        invoice.items.map((item: InvoiceItem) => (
                          <InvoiceItemRow
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            onUpdate={(unitPrice, quantity) =>
                              updateItemMutation.mutate({
                                itemId: item.id,
                                unitPrice,
                                quantity,
                              })
                            }
                            onDelete={() => deleteItemMutation.mutate(item.id)}
                            isUpdating={updateItemMutation.isPending}
                            isDeleting={deleteItemMutation.isPending}
                          />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-gray-500 py-8">
                            No items yet. Add a service to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col items-end gap-2 border-t pt-4">
                  <div className="flex w-full max-w-[240px] justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{invoice.subtotal ?? '0.00'}</span>
                  </div>
                  <div className="flex w-full max-w-[240px] justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>{invoice.taxAmount ?? '0.00'}</span>
                  </div>
                  <div className="flex w-full max-w-[240px] justify-between font-semibold">
                    <span>Total</span>
                    <span>{invoice.totalAmount ?? '0.00'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {isDraft && (
                    <Button
                      variant="outline"
                      onClick={() => finalizeMutation.mutate(invoice.id)}
                      disabled={finalizeMutation.isPending}
                    >
                      Finalize
                    </Button>
                  )}
                  {isFinalized && (
                    <Button
                      onClick={() => payMutation.mutate(invoice.id)}
                      disabled={payMutation.isPending}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <IntakeFormsSection
          responses={formResponses}
          appointmentId={id}
          isLoading={formsLoading}
        />

        {appointment?.patientId && (
          <>
            <Button variant="outline" onClick={() => setRecordSheetOpen(true)}>
              View Full Record
            </Button>
            <PatientRecordSheet
              patientId={appointment.patientId}
              clinicId={appointment.clinicId}
              open={recordSheetOpen}
              onOpenChange={setRecordSheetOpen}
            />
          </>
        )}
      </div>

      {invoice && (
        <AddServiceDialog
          open={addServiceOpen}
          onOpenChange={setAddServiceOpen}
          invoiceId={invoice.id}
          clinicId={appointment.clinicId}
          onSuccess={handleAddItemSuccess}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trash2, 
  ArrowLeft, 
  Calendar, 
  User as UserIcon, 
  FileText, 
  Video, 
  Receipt, 
  ShieldCheck, 
  Clock, 
  Plus,
  Stethoscope,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import {
  getAppointmentById,
  getPatientEntitlements,
  getVisitByAppointment,
  createVisitRecord,
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
import { 
  AppCard, 
  AppCardContent, 
  AppCardHeader, 
  AppCardTitle, 
  AppButton, 
  AppPageHeader,
  StickySummaryPanel
} from '@/components/ui-system';
import { PageContainer } from '@/components/layout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AppInput } from '@/components/ui-system';
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
import { createPrescription, getPrescriptionsByPatient, type Prescription } from '@/lib/prescriptionApi';
import { useAppToast } from '@/hooks/useAppToast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function ProviderAppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isProvider = user?.role === 'PROVIDER';
  
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [recordSheetOpen, setRecordSheetOpen] = useState(false);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);

  const { data: appointment, isLoading: appointmentLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentById(id),
    enabled: !!id,
  });

  const { data: visitData } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => (appointment ? getVisitByAppointment(id) : null),
    enabled: !!appointment?.id,
  });
  const visitRecord = visitData?.visitRecord ?? null;

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices', 'appointment', id],
    queryFn: () => getInvoicesByAppointment(id),
    enabled: !!appointment?.id,
  });

  const { data: formResponses = [], isLoading: formsLoading } = useQuery({
    queryKey: ['forms', 'patient', appointment?.patientId, appointment?.clinicId],
    queryFn: () => getPatientForms(appointment!.patientId, appointment?.clinicId),
    enabled: !!appointment?.patientId,
  });

  const { data: prescriptions = [], refetch: refetchPrescriptions } = useQuery({
    queryKey: ['prescriptions', 'patient', appointment?.patientId],
    queryFn: () => getPrescriptionsByPatient(appointment!.patientId),
    enabled: !!appointment?.patientId && appointment?.status === 'COMPLETED',
  });

  const { data: entitlements } = useQuery({
    queryKey: ['patient-entitlements', appointment?.patientId],
    queryFn: () => getPatientEntitlements(appointment!.patientId),
    enabled: !!appointment?.patientId && isProvider,
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (notes: string) =>
      createPrescription({ appointmentId: id, patientId: appointment!.patientId, notes }),
    onSuccess: () => {
      setPrescriptionNotes('');
      setPrescriptionOpen(false);
      refetchPrescriptions();
      toast.success('Prescription added');
    },
    onError: () => toast.error('Failed to create prescription'),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: () => createInvoice({ appointmentId: id, providerId: appointment!.providerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', 'appointment', id] });
      toast.success('Invoice created');
    },
  });

  const invoice = invoices[0] ?? null;

  if (appointmentLoading || !appointment) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="px-8 py-6 bg-white border-b sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppButton variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </AppButton>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">{appointment.patientId ? (appointment as any).patient?.name : 'Patient'}</h1>
                <StatusBadge status={appointment.status} variant="appointment" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {appointment.service.name} · {formatDateTime(appointment.startTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AppButton variant="outline" className="rounded-full bg-white shadow-sm border-slate-200" asChild>
              <Link href={`/dashboard/provider/appointments/${id}/consultation`}>
                <Video className="mr-2 h-4 w-4 text-blue-600" /> Join Virtual Room
              </Link>
            </AppButton>
            <AppButton onClick={() => setRecordSheetOpen(true)} className="rounded-full shadow-lg">
              <UserIcon className="mr-2 h-4 w-4" /> Full Clinical Record
            </AppButton>
          </div>
        </div>
      </div>

      <PageContainer className="py-8">
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Consultation Section */}
            <AppCard className="border-none shadow-sm overflow-hidden">
              <AppCardHeader className="bg-slate-50/50 border-b-0 py-6">
                <AppCardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary-600" />
                  Active Consultation
                </AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="p-8">
                {!visitRecord ? (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Activity className="h-10 w-10 text-slate-200" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-slate-900">Start documenting this visit</h3>
                      <p className="text-slate-500 text-sm mt-2">
                        Use Medoflow AI Scribe to automatically document this session or create a manual visit record.
                      </p>
                    </div>
                    <AppButton size="lg" className="rounded-full px-10" asChild>
                      <Link href={`/dashboard/provider/appointments/${id}/consultation`}>
                        Enter Consultation Room
                      </Link>
                    </AppButton>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={visitRecord.status} variant="visitRecord" />
                      {!visitRecord.isFinalized && (
                        <AppButton variant="outline" size="sm" className="rounded-full" asChild>
                          <Link href={`/dashboard/provider/appointments/${id}/consultation`}>
                            Resume Scribe
                          </Link>
                        </AppButton>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {['subjective', 'objective', 'assessment', 'plan'].map((field) => (
                        visitRecord[field as keyof typeof visitRecord] && (
                          <div key={field} className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{field}</label>
                            <p className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                              {visitRecord[field as keyof typeof visitRecord] as string}
                            </p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </AppCardContent>
            </AppCard>

            {/* Prescriptions */}
            {appointment.status === 'COMPLETED' && (
              <AppCard className="border-none shadow-sm overflow-hidden">
                <AppCardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b-0 py-6">
                  <AppCardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" /> Prescriptions
                  </AppCardTitle>
                  {!prescriptionOpen && (
                    <AppButton variant="ghost" size="sm" className="rounded-full text-primary-600" onClick={() => setPrescriptionOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add New
                    </AppButton>
                  )}
                </AppCardHeader>
                <AppCardContent className="p-8 space-y-4">
                  {prescriptionOpen && (
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-primary-100 animate-in zoom-in-95 space-y-4">
                      <textarea 
                        className="w-full bg-white rounded-2xl p-4 text-sm border-slate-200 outline-none focus:border-primary-600"
                        rows={4}
                        placeholder="Enter medication, dosage, and instructions..."
                        value={prescriptionNotes}
                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <AppButton variant="ghost" size="sm" onClick={() => setPrescriptionOpen(false)}>Cancel</AppButton>
                        <AppButton size="sm" className="rounded-full px-6" onClick={() => createPrescriptionMutation.mutate(prescriptionNotes)}>Save Prescription</AppButton>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {prescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">{rx.notes}</p>
                        <p className="text-[10px] text-slate-400 mt-3 uppercase font-bold tracking-tighter">Issued on {new Date(rx.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {prescriptions.length === 0 && !prescriptionOpen && (
                      <p className="text-center py-6 text-slate-400 text-sm">No prescriptions issued for this visit.</p>
                    )}
                  </div>
                </AppCardContent>
              </AppCard>
            )}

            {/* Forms Section */}
            <IntakeFormsSection responses={formResponses} appointmentId={id} isLoading={formsLoading} />
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Billing Rail */}
            <div className="sticky top-32 space-y-6">
              {!invoice ? (
                <AppCard className="border-2 border-dashed border-slate-200 bg-transparent text-center p-8">
                  <Receipt className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900">No active invoice</h3>
                  <p className="text-xs text-slate-500 mt-2 mb-6">Invoices are usually generated automatically upon booking.</p>
                  <AppButton className="w-full rounded-full" onClick={() => createInvoiceMutation.mutate()}>
                    Create Manual Invoice
                  </AppButton>
                </AppCard>
              ) : (
                <StickySummaryPanel 
                  title="Billing Details"
                  items={[
                    { label: 'Status', value: <StatusBadge status={invoice.status} variant="invoice" /> },
                    { label: 'Subtotal', value: `$${invoice.subtotal}` },
                    { label: 'Tax', value: `$${invoice.taxAmount}` },
                    { label: 'Total', value: `$${invoice.totalAmount}`, isTotal: true },
                  ]}
                  actions={
                    <div className="space-y-3">
                      {invoice.status === 'DRAFT' && (
                        <AppButton className="w-full rounded-full h-12" onClick={() => setAddServiceOpen(true)}>Add Billable Item</AppButton>
                      )}
                      <AppButton variant="outline" className="w-full rounded-full h-12 bg-white" asChild>
                        <Link href={`/dashboard/front-desk/invoices/${invoice.id}`}>View Full Invoice</Link>
                      </AppButton>
                    </div>
                  }
                />
              )}

              {/* Entitlements Rail */}
              {entitlements && (
                <AppCard className="border-primary-100 bg-primary-50/20">
                  <AppCardHeader className="border-none pb-0">
                    <AppCardTitle className="text-sm font-black uppercase tracking-widest text-primary-700 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Patient Entitlements
                    </AppCardTitle>
                  </AppCardHeader>
                  <AppCardContent className="p-6 pt-4 space-y-4">
                    {entitlements.activeMembershipBenefit ? (
                      <div className="p-3 bg-white rounded-xl border border-primary-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-900">{entitlements.activeMembershipBenefit.membershipName}</p>
                        <p className="text-[10px] text-emerald-600 font-black uppercase mt-1">
                          {Number(entitlements.activeMembershipBenefit.serviceDiscountPercent)}% Service Discount
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No active membership.</p>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Wellness Packages</p>
                      {entitlements.packages.map((pkg: any) => (
                        <div key={pkg.id} className="flex justify-between items-center text-xs font-medium text-slate-700">
                          <span>{pkg.package.name}</span>
                          <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                            {pkg.remainingSessions ?? Math.max(pkg.totalSessions - pkg.usedSessions, 0)} LEFT
                          </span>
                        </div>
                      ))}
                      {entitlements.packages.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No pre-paid packages.</p>
                      )}
                    </div>
                  </AppCardContent>
                </AppCard>
              )}

              {/* Compliance Note */}
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <History className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-sm">Clinical Integrity</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  All clinical documentation is immutable once finalized. Medoflow tracks every edit made to the SOAP record for clinical audit purposes.
                </p>
              </div>
            </div>
          </div>

        </div>
      </PageContainer>

      <PatientRecordSheet
        patientId={appointment.patientId}
        clinicId={appointment.clinicId}
        open={recordSheetOpen}
        onOpenChange={setRecordSheetOpen}
      />

      {invoice && (
        <AddServiceDialog
          open={addServiceOpen}
          onOpenChange={setAddServiceOpen}
          invoiceId={invoice.id}
          onSuccess={() => refetchInvoices()}
        />
      )}
    </div>
  );
}

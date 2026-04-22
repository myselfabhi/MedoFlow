'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppButton, AppInput, AppEmptyState, AppCalendar } from '@/components/ui-system';
import { useAuth } from '@/contexts/AuthContext';
import { getClinics } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders, getAvailability } from '@/lib/providerApi';
import {
  createSlotHold,
  releaseSlotHold,
  createAppointment,
  type CreatedSlotHold,
} from '@/lib/appointmentApi';
import { getMyEntitlements, type PatientPackage } from '@/lib/patientApi';
import type { Service, Provider, TimeSlot } from '@/lib/types/booking';
import {
  Sparkles,
  Search,
  Stethoscope,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  Users,
  CalendarClock,
  CheckCircle2,
  Video,
  MapPin,
  PartyPopper,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'tutorial' | 'service' | 'provider' | 'time' | 'review' | 'success';

const TUTORIAL_KEY = 'medoflow_booking_tutorial_seen';

const STEP_TITLES: Record<Exclude<Step, 'tutorial' | 'success'>, string> = {
  service: 'Pick a service',
  provider: 'Choose your provider',
  time: 'Find a time',
  review: 'Review & confirm',
};

const STEP_ORDER: Exclude<Step, 'tutorial' | 'success'>[] = ['service', 'provider', 'time', 'review'];

function formatPrice(value: string | number) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `$${n.toFixed(2)}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BookingModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('tutorial');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null); // null = any
  const [serviceSearch, setServiceSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);
  const [slotHold, setSlotHold] = useState<CreatedSlotHold | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        const seen = typeof window !== 'undefined' && localStorage.getItem(TUTORIAL_KEY) === '1';
        setStep(seen ? 'service' : 'tutorial');
        setServiceId(null);
        setProviderId(null);
        setServiceSearch('');
        setProviderSearch('');
        setSelectedDate(new Date());
        setSelectedSlot(null);
        setPendingSlot(null);
        setSlotHold(null);
        setSelectedPackageId(null);
        setCreatedAppointmentId(null);
      }, 300);
      return () => clearTimeout(t);
    } else {
      const seen = typeof window !== 'undefined' && localStorage.getItem(TUTORIAL_KEY) === '1';
      if (seen && step === 'tutorial') setStep('service');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Release slot hold on unmount or change
  useEffect(() => {
    return () => {
      if (slotHold) {
        releaseSlotHold(slotHold.id, slotHold.clinicId).catch(() => {});
      }
    };
  }, [slotHold]);

  const { data: clinics } = useQuery({
    queryKey: ['public-clinics'],
    queryFn: getClinics,
    enabled: open,
  });
  const clinicId = clinics?.[0]?.id ?? '';

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['public-services', clinicId],
    queryFn: () => getClinicServices(clinicId),
    enabled: open && !!clinicId,
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['public-providers', clinicId],
    queryFn: () => getClinicProviders(clinicId),
    enabled: open && !!clinicId,
  });

  const selectedDateStr = useMemo(() => dateKey(selectedDate), [selectedDate]);

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['public-availability', clinicId, serviceId, selectedDateStr, providerId ?? 'any'],
    queryFn: () => getAvailability(clinicId, serviceId!, selectedDateStr, providerId ?? undefined),
    enabled: open && step === 'time' && !!clinicId && !!serviceId,
  });

  const { data: entitlements } = useQuery({
    queryKey: ['my-entitlements'],
    queryFn: getMyEntitlements,
    enabled: open && step === 'review' && !!user,
  });

  const filteredServices = useMemo(() => {
    const term = serviceSearch.toLowerCase().trim();
    if (!term) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(term) || s.discipline?.name?.toLowerCase().includes(term)
    );
  }, [services, serviceSearch]);

  const providersForService = useMemo(() => {
    if (!serviceId) return [];
    return providers.filter((p) => p.providerServices.some((ps) => ps.serviceId === serviceId));
  }, [providers, serviceId]);

  const filteredProviders = useMemo(() => {
    const term = providerSearch.toLowerCase().trim();
    if (!term) return providersForService;
    return providersForService.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(term)
    );
  }, [providersForService, providerSearch]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );
  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === providerId) ?? null,
    [providers, providerId]
  );

  const finishTutorial = () => {
    if (typeof window !== 'undefined') localStorage.setItem(TUTORIAL_KEY, '1');
    setStep('service');
  };

  const handleSelectService = (id: string) => {
    setServiceId(id);
    setProviderId(null);
    setStep('provider');
  };

  const handleSelectProvider = (id: string | null) => {
    setProviderId(id);
    setStep('time');
  };

  const handlePickSlot = async (slot: TimeSlot) => {
    if (pendingSlot && pendingSlot.start === slot.start && pendingSlot.providerId === slot.providerId) {
      // Confirm
      try {
        setHoldingSlot(true);
        if (slotHold) {
          await releaseSlotHold(slotHold.id, slotHold.clinicId).catch(() => {});
          setSlotHold(null);
        }
        const hold = await createSlotHold({
          clinicId,
          providerId: slot.providerId,
          serviceId: serviceId!,
          locationId: slot.locationId ?? undefined,
          timezone: slot.timezone,
          startTime: slot.start,
          endTime: slot.end,
        });
        setSlotHold(hold);
        setSelectedSlot(slot);
        setPendingSlot(null);
        setStep('review');
      } catch {
        toast.error('That slot was just taken. Please pick another.');
        setPendingSlot(null);
      } finally {
        setHoldingSlot(false);
      }
    } else {
      setPendingSlot(slot);
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedSlot || !serviceId) return;
    setIsConfirming(true);
    try {
      const result = await createAppointment({
        clinicId,
        locationId: selectedSlot.locationId ?? undefined,
        providerId: selectedSlot.providerId,
        serviceId,
        patientId: user.id,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        slotHoldId: slotHold?.id,
        patientPackageId: selectedPackageId ?? undefined,
      });
      setCreatedAppointmentId(result.appointment.id);
      setSlotHold(null); // converted by backend

      if (result.clientSecret) {
        toast.success('Appointment held — finishing payment...');
        onOpenChange(false);
        router.push(`/payment/${result.appointment.id}?clientSecret=${result.clientSecret}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
        setStep('success');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const goBack = () => {
    if (step === 'service') return;
    if (step === 'provider') setStep('service');
    else if (step === 'time') setStep('provider');
    else if (step === 'review') setStep('time');
  };

  const stepIndex = step === 'tutorial' || step === 'success' ? -1 : STEP_ORDER.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col gap-0">
        {step === 'tutorial' && (
          <TutorialView onContinue={finishTutorial} onSkip={finishTutorial} />
        )}

        {step === 'success' && (
          <SuccessView
            onClose={() => onOpenChange(false)}
            appointmentId={createdAppointmentId}
            startTime={selectedSlot?.start ?? null}
            providerName={selectedProvider ? `${selectedProvider.firstName} ${selectedProvider.lastName}` : 'your provider'}
            serviceName={selectedService?.name ?? 'your visit'}
          />
        )}

        {step !== 'tutorial' && step !== 'success' && (
          <>
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-accent-700 px-5 py-4 text-white">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
              <DialogHeader className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-xl font-bold text-white">Book an appointment</DialogTitle>
                    <DialogDescription className="text-sm text-white/75">
                      {STEP_TITLES[step as Exclude<Step, 'tutorial' | 'success'>]}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {/* Stepper */}
              <div className="relative mt-5 flex items-center gap-2 text-xs font-semibold">
                {STEP_ORDER.map((s, i) => {
                  const isActive = i === stepIndex;
                  const isDone = i < stepIndex;
                  return (
                    <React.Fragment key={s}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] transition-all',
                            isDone
                              ? 'bg-white text-primary'
                              : isActive
                              ? 'bg-white text-primary ring-2 ring-white/40'
                              : 'bg-white/20 text-white/70'
                          )}
                        >
                          {isDone ? <Check className="h-3 w-3" /> : i + 1}
                        </span>
                        <span className={cn('hidden sm:inline', isActive ? 'text-white' : 'text-white/60')}>
                          {STEP_TITLES[s]}
                        </span>
                      </div>
                      {i < STEP_ORDER.length - 1 && (
                        <span
                          className={cn(
                            'h-px flex-1 transition-colors',
                            isDone ? 'bg-white' : 'bg-white/20'
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              {step === 'service' && (
                <ServiceStep
                  loading={servicesLoading}
                  services={filteredServices}
                  search={serviceSearch}
                  onSearch={setServiceSearch}
                  onPick={handleSelectService}
                />
              )}
              {step === 'provider' && selectedService && (
                <ProviderStep
                  loading={providersLoading}
                  service={selectedService}
                  providers={filteredProviders}
                  totalForService={providersForService.length}
                  search={providerSearch}
                  onSearch={setProviderSearch}
                  onPick={handleSelectProvider}
                />
              )}
              {step === 'time' && (
                <TimeStep
                  loading={slotsLoading}
                  slots={slots}
                  selectedDate={selectedDate}
                  onSelectDate={(d) => {
                    setSelectedDate(d);
                    setPendingSlot(null);
                  }}
                  pendingSlot={pendingSlot}
                  onPickSlot={handlePickSlot}
                  holdingSlot={holdingSlot}
                />
              )}
              {step === 'review' && selectedSlot && selectedService && (
                <ReviewStep
                  service={selectedService}
                  provider={selectedProvider}
                  slot={selectedSlot}
                  packages={entitlements?.packages ?? []}
                  selectedPackageId={selectedPackageId}
                  onSelectPackage={setSelectedPackageId}
                  slotHold={slotHold}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <AppButton
                variant="outline"
                size="sm"
                onClick={goBack}
                disabled={step === 'service'}
                className="rounded-full"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </AppButton>

              {step === 'review' ? (
                <AppButton
                  size="sm"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="rounded-full"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      Confirm booking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </AppButton>
              ) : (
                <p className="text-xs text-slate-500">
                  {step === 'service' && 'Tap a service to continue'}
                  {step === 'provider' && 'Pick a provider or any availability'}
                  {step === 'time' && 'Tap a slot, then tap again to confirm'}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ============================ Tutorial ============================ */

function TutorialView({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const items = [
    { icon: Stethoscope, title: 'Pick a service', desc: 'Choose what brings you in.' },
    { icon: Users, title: 'Select a provider', desc: 'Anyone available, or someone you know.' },
    { icon: CalendarDays, title: 'Find a time', desc: 'See live availability across the calendar.' },
    { icon: CheckCircle2, title: 'Confirm', desc: "We'll secure your slot — pay only if needed." },
  ];
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-700 to-accent-700 px-5 py-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
        <DialogHeader className="relative">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Booking a visit takes about a minute
          </DialogTitle>
          <DialogDescription className="text-sm text-white/80 mt-1">
            Here's what's coming up — you can step back any time.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
        <ol className="grid gap-3 sm:grid-cols-2">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <li
                key={it.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-card"
              >
                <span className="absolute right-3 top-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Step {i + 1}
                </span>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-900">{it.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{it.desc}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/40 to-accent-50/30 p-3">
          <p className="text-xs text-slate-700">
            <span className="font-bold">Heads up:</span> we hold your slot for a few minutes while you confirm,
            so it's safe to take your time. If payment is required, you'll be sent to a secure checkout.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
        <button
          onClick={onSkip}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Skip tour
        </button>
        <AppButton size="sm" onClick={onContinue} className="rounded-full">
          Let's start
          <ArrowRight className="ml-2 h-4 w-4" />
        </AppButton>
      </div>
    </div>
  );
}

/* ============================ Service Step ============================ */

function ServiceStep({
  loading,
  services,
  search,
  onSearch,
  onPick,
}: {
  loading: boolean;
  services: Service[];
  search: string;
  onSearch: (s: string) => void;
  onPick: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <AppInput
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search services or specialties"
          className="pl-11 rounded-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <AppEmptyState
          title="No services found"
          description="Try a different search term."
          icon={<Stethoscope className="h-6 w-6" />}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onPick(s.id)}
                className="group relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">{s.name}</p>
                      <span className="shrink-0 text-sm font-black text-primary">
                        {formatPrice(s.defaultPrice)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.duration} min
                      </span>
                      {s.discipline?.name && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                          {s.discipline.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="absolute bottom-3 right-3 inline-flex items-center text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Select <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================ Provider Step ============================ */

function ProviderStep({
  loading,
  service,
  providers,
  totalForService,
  search,
  onSearch,
  onPick,
}: {
  loading: boolean;
  service: Service;
  providers: Provider[];
  totalForService: number;
  search: string;
  onSearch: (s: string) => void;
  onPick: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary-100 bg-primary-50/30 p-3 text-xs text-slate-700">
        <span className="font-bold">{service.name}</span> · {service.duration} min ·{' '}
        {formatPrice(service.defaultPrice)}
      </div>

      <button
        onClick={() => onPick(null)}
        className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-4 text-left transition-all hover:border-accent hover:bg-accent/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Any available provider</p>
            <p className="text-xs text-slate-500">Get the soonest possible time</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-accent" />
      </button>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <AppInput
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`Search ${totalForService} provider${totalForService === 1 ? '' : 's'}`}
          className="pl-11 rounded-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : providers.length === 0 ? (
        <AppEmptyState
          title="No providers available"
          description="Try the 'Any available provider' option above."
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <ul className="space-y-2">
          {providers.map((p) => {
            const discipline =
              p.discipline?.name || p.disciplines?.[0]?.discipline?.name || '';
            const initials = `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
            return (
              <li key={p.id}>
                <button
                  onClick={() => onPick(p.id)}
                  className="group flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-primary/40 hover:shadow-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        Dr. {p.firstName} {p.lastName}
                      </p>
                      {discipline && <p className="text-xs text-slate-500">{discipline}</p>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================ Time Step ============================ */

function TimeStep({
  loading,
  slots,
  selectedDate,
  onSelectDate,
  pendingSlot,
  onPickSlot,
  holdingSlot,
}: {
  loading: boolean;
  slots: TimeSlot[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  pendingSlot: TimeSlot | null;
  onPickSlot: (s: TimeSlot) => void;
  holdingSlot: boolean;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="space-y-4">
      <div className="mx-auto w-fit rounded-2xl border border-slate-100 bg-white p-2">
        <AppCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && onSelectDate(d)}
          disabled={(d) => d < today}
          className="w-[20rem] p-2"
        />
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{formatLongDate(selectedDate.toISOString())}</p>
          <p className="text-xs text-slate-500">{slots.length} slot{slots.length === 1 ? '' : 's'}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : slots.length === 0 ? (
          <AppEmptyState
            title="No slots on this day"
            description="Try a different date from the calendar."
            icon={<CalendarDays className="h-6 w-6" />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => {
              const isPending =
                pendingSlot &&
                pendingSlot.start === slot.start &&
                pendingSlot.providerId === slot.providerId;
              return (
                <button
                  key={`${slot.providerId}-${slot.start}`}
                  onClick={() => onPickSlot(slot)}
                  disabled={holdingSlot}
                  className={cn(
                    'group flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-all',
                    isPending
                      ? 'border-primary bg-primary text-white shadow-card'
                      : 'border-slate-100 bg-white text-slate-700 hover:border-primary/40 hover:bg-primary-50/30'
                  )}
                >
                  <span className="text-sm font-bold">{formatTime(slot.start)}</span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      isPending ? 'text-white/80' : 'text-slate-400'
                    )}
                  >
                    {isPending ? (holdingSlot ? 'Holding...' : 'Tap to confirm') : 'Available'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <p className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
          Tap a slot, then tap it again to hold it for review.
        </p>
      </div>
    </div>
  );
}

/* ============================ Review Step ============================ */

function ReviewStep({
  service,
  provider,
  slot,
  packages,
  selectedPackageId,
  onSelectPackage,
  slotHold,
}: {
  service: Service;
  provider: Provider | null;
  slot: TimeSlot;
  packages: PatientPackage[];
  selectedPackageId: string | null;
  onSelectPackage: (id: string | null) => void;
  slotHold: CreatedSlotHold | null;
}) {
  const usablePackages = useMemo(
    () => packages.filter((p) => p.usedSessions < p.totalSessions),
    [packages]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Your booking</h3>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="bg-gradient-to-br from-primary-50/50 to-accent-50/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary/80">{service.discipline?.name}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{service.name}</p>
            <p className="text-xs text-slate-500">
              {service.duration} minutes · {formatPrice(service.defaultPrice)}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            <Row icon={Users} label="Provider">
              {provider ? `Dr. ${provider.firstName} ${provider.lastName}` : 'Any available provider'}
            </Row>
            <Row icon={CalendarDays} label="Date">
              {formatLongDate(slot.start)}
            </Row>
            <Row icon={Clock} label="Time">
              {formatTime(slot.start)} – {formatTime(slot.end)}
            </Row>
            <Row icon={slot.locationId ? MapPin : Video} label={slot.locationId ? 'Location' : 'Format'}>
              {slot.locationId ? 'In-clinic' : 'Virtual visit'}
            </Row>
          </div>
        </div>

        {usablePackages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Use a package
            </h3>
            <button
              onClick={() => onSelectPackage(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition-all',
                selectedPackageId === null
                  ? 'border-primary bg-primary-50/40'
                  : 'border-slate-100 bg-white hover:border-primary/30'
              )}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Pay as you go</p>
                <p className="text-xs text-slate-500">Standard checkout</p>
              </div>
              {selectedPackageId === null && <Check className="h-4 w-4 text-primary" />}
            </button>
            {usablePackages.map((pkg) => {
              const remaining = pkg.totalSessions - pkg.usedSessions;
              const isActive = selectedPackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => onSelectPackage(pkg.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition-all',
                    isActive
                      ? 'border-accent bg-accent/10'
                      : 'border-slate-100 bg-white hover:border-accent/40'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pkg.package.name}</p>
                    <p className="text-xs text-slate-500">
                      {remaining} of {pkg.totalSessions} sessions left
                    </p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <aside className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Total</h3>
        <div className="rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-accent-700 p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {selectedPackageId ? 'Covered by package' : 'You pay'}
          </p>
          <p className="mt-1 text-3xl font-black">
            {selectedPackageId ? '$0.00' : formatPrice(service.defaultPrice)}
          </p>
          {!selectedPackageId && (
            <p className="mt-2 text-xs text-white/70">Secure checkout via Stripe.</p>
          )}
        </div>

        {slotHold && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 text-xs text-slate-700">
            <p className="font-bold text-accent-700">Slot held</p>
            <p className="mt-0.5">
              We've reserved this time until{' '}
              <span className="font-semibold">{formatTime(slotHold.expiresAt)}</span>.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{children}</p>
      </div>
    </div>
  );
}

/* ============================ Success ============================ */

function SuccessView({
  onClose,
  appointmentId,
  startTime,
  providerName,
  serviceName,
}: {
  onClose: () => void;
  appointmentId: string | null;
  startTime: string | null;
  providerName: string;
  serviceName: string;
}) {
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="relative overflow-hidden bg-gradient-to-br from-accent via-accent-700 to-primary px-5 py-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <DialogHeader className="relative">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <PartyPopper className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">You're booked!</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/85">
            We've sent a confirmation to your email.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-sm text-slate-500">{serviceName} with {providerName}</p>
          {startTime && (
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatLongDate(startTime)} · {formatTime(startTime)}
            </p>
          )}
          {appointmentId && (
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Booking #{appointmentId.slice(-6).toUpperCase()}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 text-xs text-slate-700">
          <p className="font-bold text-slate-900">What's next</p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-start gap-2">
              <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 -rotate-90 text-primary" />
              You'll get a reminder 24 hours before.
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 -rotate-90 text-primary" />
              Visible anytime in your <span className="font-semibold">My Appointments</span> menu.
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="mt-0.5 h-3 w-3 shrink-0 -rotate-90 text-primary" />
              Need to change it? Cancel up to 24h before, no fees.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3">
        <AppButton variant="outline" size="sm" onClick={onClose} className="rounded-full">
          Close
        </AppButton>
      </div>
    </div>
  );
}

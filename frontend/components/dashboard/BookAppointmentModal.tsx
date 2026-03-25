'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppButton, AppCalendar, AppInput } from '@/components/ui-system';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders, getAvailability } from '@/lib/providerApi';
import {
  getClinicLocations,
  createAppointment,
  createSlotHold,
  releaseSlotHold,
  checkPatientExists,
} from '@/lib/appointmentApi';
import { getMyEntitlements } from '@/lib/patientApi';
import { useAuth } from '@/contexts/AuthContext';
import { useAppToast } from '@/hooks/useAppToast';
import { cn } from '@/lib/utils';
import api, { setAccessToken } from '@/lib/api';
import type { Service, Provider, TimeSlot } from '@/lib/types/booking';
import type { User } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  User as UserIcon,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Package as PackageIcon,
  Stethoscope,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Service', 'Provider', 'Date & Time', 'Confirm'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                i < current ? 'bg-emerald-500 text-white'
                  : i === current ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              {i < current ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:inline',
              i === current ? 'text-slate-900' : 'text-slate-400'
            )}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Inline auth gate shown at the confirm step when not logged in ─────────────

interface AuthGateProps {
  clinicId: string;
  onAuthenticated: (user: User) => void;
}

function AuthGate({ clinicId, onAuthenticated }: AuthGateProps) {
  const toast = useAppToast();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [mode, setMode] = useState<'email' | 'login' | 'register'>('email');
  const [loading, setLoading] = useState(false);

  const handleEmailNext = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email.');
      return;
    }
    setChecking(true);
    try {
      const exists = await checkPatientExists(email.trim().toLowerCase());
      setMode(exists ? 'login' : 'register');
    } catch {
      toast.error('Could not check your email. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim().toLowerCase(), password);
        const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
        onAuthenticated(data.data.user);
      } else {
        // Register new patient
        const { data } = await api.post<{
          success: boolean;
          data: { accessToken: string; user: User };
        }>('/auth/register', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          clinicId,
        });
        setAccessToken(data.data.accessToken);
        onAuthenticated(data.data.user);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? err?.message ?? 'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-xl shrink-0 mt-0.5">
          <LogIn className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Almost there!</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Sign in or create a free account to confirm your booking. Your selected slot is held.
          </p>
        </div>
      </div>

      {/* Step: email input */}
      {mode === 'email' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email address</label>
            <AppInput
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
              autoFocus
            />
          </div>
          <AppButton
            className="w-full"
            onClick={handleEmailNext}
            disabled={checking || !email.trim()}
          >
            {checking ? 'Checking…' : 'Continue'}
          </AppButton>
        </div>
      )}

      {/* Step: login */}
      {mode === 'login' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setMode('email')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-sm text-slate-600">
              Welcome back! Sign in as <span className="font-semibold text-slate-900">{email}</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <AppInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <AppButton className="w-full" onClick={handleSubmit} disabled={loading || !password}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </span>
            ) : (
              <><LogIn className="h-4 w-4 mr-2" /> Sign In & Confirm</>
            )}
          </AppButton>
          <p className="text-center text-xs text-slate-400">
            Not you?{' '}
            <button
              onClick={() => { setMode('email'); setEmail(''); setPassword(''); }}
              className="text-primary underline"
            >
              Use a different email
            </button>
          </p>
        </div>
      )}

      {/* Step: register */}
      {mode === 'register' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setMode('email')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-sm text-slate-600">
              Create your account for <span className="font-semibold text-slate-900">{email}</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <AppInput
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Create Password</label>
            <div className="relative">
              <AppInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <AppButton
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || password.length < 6}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account…
              </span>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" /> Create Account & Confirm</>
            )}
          </AppButton>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ────────────────────────────────────────────────────────────────

interface BookAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a clinicId when using outside authenticated context (public pages) */
  clinicId?: string;
}

export function BookAppointmentModal({ open, onOpenChange, clinicId: propClinicId }: BookAppointmentModalProps) {
  const { user: authUser } = useAuth();
  const toast = useAppToast();
  const queryClient = useQueryClient();

  // Allow overriding clinicId from prop (for public pages) or fall back to logged-in user's clinic
  const clinicId = propClinicId ?? authUser?.clinicId ?? '';

  // After the auth gate completes we store the freshly-authenticated user here
  // so the confirm step can proceed even before AuthContext refreshes
  const [resolvedUser, setResolvedUser] = useState<User | null>(authUser ?? null);

  // Keep resolvedUser in sync if authUser changes (e.g. already logged in)
  useEffect(() => {
    if (authUser) setResolvedUser(authUser);
  }, [authUser]);

  // ── booking state ──
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [slotHoldId, setSlotHoldId] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedService(null);
      setSelectedProviderId(null);
      setSelectedDate(new Date());
      setSelectedSlot(null);
      setPendingSlot(null);
      setSlotHoldId(null);
      setSelectedPackageId(null);
      setResolvedUser(authUser ?? null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── queries ──
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['clinic-services-booking', clinicId],
    queryFn: () => getClinicServices(clinicId),
    enabled: !!clinicId && open,
  });

  const { data: allProviders = [] } = useQuery({
    queryKey: ['clinic-providers-booking', clinicId],
    queryFn: () => getClinicProviders(clinicId),
    enabled: !!clinicId && open,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['clinic-locations-booking', clinicId],
    queryFn: () => getClinicLocations(clinicId),
    enabled: !!clinicId && open,
  });

  const { data: entitlements } = useQuery({
    queryKey: ['patient-entitlements-self'],
    queryFn: () => getMyEntitlements(),
    enabled: !!resolvedUser && open,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['availability-booking', clinicId, selectedService?.id, selectedDateStr, selectedProviderId ?? 'any'],
    queryFn: () =>
      getAvailability(clinicId, selectedService!.id, selectedDateStr, selectedProviderId ?? undefined),
    enabled: !!clinicId && !!selectedService && !!selectedDateStr && step === 2,
  });

  // ── derived ──
  const providersForService = selectedService
    ? allProviders.filter((p: Provider) =>
        p.providerServices.some((ps) => ps.serviceId === selectedService.id)
      )
    : [];

  const selectedProvider = allProviders.find(
    (p: Provider) => p.id === (selectedSlot?.providerId ?? selectedProviderId ?? '')
  );

  const patientPackages = (entitlements?.packages ?? []).filter(
    (pkg: any) => (pkg.remainingSessions ?? 0) > 0
  );

  // Group slots by hour
  const slotsByHour = slots.reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    const hour = format(new Date(slot.start), 'ha');
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(slot);
    return acc;
  }, {});

  // ── slot hold ──
  const releaseCurrentHold = async () => {
    if (slotHoldId) {
      try { await releaseSlotHold(slotHoldId, clinicId); } catch {}
      setSlotHoldId(null);
    }
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (pendingSlot?.start !== slot.start) { setPendingSlot(slot); return; }
    if (holdingSlot) return;
    setHoldingSlot(true);
    try {
      await releaseCurrentHold();
      const hold = await createSlotHold({
        clinicId,
        providerId: slot.providerId,
        serviceId: selectedService!.id,
        locationId: slot.locationId || locations[0]?.id || '',
        timezone: slot.timezone,
        startTime: slot.start,
        endTime: slot.end,
      });
      setSlotHoldId(hold.id);
      setSelectedSlot(slot);
      setStep(3);
    } catch {
      toast.error('Failed to hold this slot — it may have just been taken. Try another.');
    } finally {
      setHoldingSlot(false);
    }
  };

  // ── booking ──
  const bookMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        clinicId,
        locationId: selectedSlot!.locationId || locations[0]?.id || '',
        providerId: selectedSlot!.providerId,
        serviceId: selectedService!.id,
        patientId: resolvedUser!.id,
        startTime: selectedSlot!.start,
        endTime: selectedSlot!.end,
        slotHoldId: slotHoldId ?? undefined,
        patientPackageId: selectedPackageId ?? undefined,
      }),
    onSuccess: ({ clientSecret, appointment }) => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      toast.success('Appointment booked!');
      onOpenChange(false);
      if (clientSecret) {
        window.location.href = `/payment/${appointment.id}?clientSecret=${clientSecret}`;
      }
    },
    onError: () => toast.error('Booking failed. Please try again.'),
  });

  const handleClose = async () => {
    await releaseCurrentHold();
    onOpenChange(false);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const fmtDateLong = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-bold">Book an Appointment</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-5 pb-6">
          <StepIndicator current={step} />

          {/* ── Step 0: Service ── */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                What would you like to book?
              </h3>
              {servicesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">No services available right now.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((svc: Service) => (
                    <button
                      key={svc.id}
                      onClick={() => { setSelectedService(svc); setStep(1); }}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 text-left hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-primary/10 transition-colors shrink-0">
                        <Stethoscope className="h-5 w-5 text-slate-500 group-hover:text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{svc.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {svc.duration} min
                          </span>
                          <span className="font-medium text-slate-700">
                            ${parseFloat(svc.defaultPrice).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary ml-auto shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Provider ── */}
          {step === 1 && selectedService && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(0)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Choose a provider</h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { setSelectedProviderId(null); setStep(2); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Any Available</p>
                      <p className="text-xs text-slate-400">Show all open slots</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>

                {providersForService.map((p: Provider) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProviderId(p.id); setStep(2); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                        {p.discipline && <p className="text-xs text-slate-400">{p.discipline.name}</p>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))}

                {providersForService.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-6">No providers found for this service.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Date & Time ── */}
          {step === 2 && selectedService && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Pick a date & time</h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <AppCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) { setSelectedDate(d); setSelectedSlot(null); setPendingSlot(null); }
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-2xl border shadow-none p-3 w-full"
                />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {format(selectedDate, 'EEE, MMM d')}
                  </p>
                  {slotsLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No slots on this day.</p>
                      <p className="text-xs mt-1">Try a different date.</p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
                      {Object.entries(slotsByHour).map(([hour, hourSlots]) => (
                        <div key={hour}>
                          <p className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">{hour}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {hourSlots.map((slot) => {
                              const isPending = pendingSlot?.start === slot.start;
                              const isSelected = selectedSlot?.start === slot.start;
                              return (
                                <button
                                  key={slot.start}
                                  onClick={() => handleSlotSelect(slot)}
                                  disabled={holdingSlot}
                                  className={cn(
                                    'px-2 py-2 rounded-xl text-xs font-semibold transition-all border',
                                    isSelected ? 'bg-emerald-500 text-white border-emerald-500'
                                      : isPending ? 'bg-primary text-white border-primary'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary hover:text-primary'
                                  )}
                                >
                                  {holdingSlot && isPending
                                    ? <span className="animate-pulse">Holding…</span>
                                    : fmt(slot.start)
                                  }
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingSlot && !selectedSlot && (
                    <p className="text-xs text-primary font-medium text-center pt-1 animate-pulse">
                      Tap again to confirm {fmt(pendingSlot.start)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm (or Auth gate if not logged in) ── */}
          {step === 3 && selectedService && selectedSlot && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Back button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedSlot(null); setPendingSlot(null); setStep(2); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                  {resolvedUser ? 'Confirm your booking' : 'Sign in to confirm'}
                </h3>
              </div>

              {/* Always show the summary card at the top */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 divide-y divide-slate-100 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Service</p>
                    <p className="font-bold text-slate-900">{selectedService.name}</p>
                    <p className="text-xs text-slate-500">{selectedService.duration} min · ${parseFloat(selectedService.defaultPrice).toFixed(0)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="p-2.5 bg-slate-200 rounded-xl shrink-0">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Provider</p>
                    <p className="font-bold text-slate-900">
                      {selectedProvider ? `${selectedProvider.firstName} ${selectedProvider.lastName}` : 'Any Available'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="p-2.5 bg-slate-200 rounded-xl shrink-0">
                    <Calendar className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Date & Time</p>
                    <p className="font-bold text-slate-900">{fmtDateLong(selectedDate)}</p>
                    <p className="text-xs text-slate-500">{fmt(selectedSlot.start)} – {fmt(selectedSlot.end)}</p>
                  </div>
                </div>
              </div>

              {/* ── Auth gate (unauthenticated) ── */}
              {!resolvedUser && (
                <AuthGate
                  clinicId={clinicId}
                  onAuthenticated={(u) => setResolvedUser(u)}
                />
              )}

              {/* ── Logged in: package selector + confirm button ── */}
              {resolvedUser && (
                <>
                  {patientPackages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <PackageIcon className="h-3.5 w-3.5" /> Use a Package
                      </p>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-slate-300">
                          <input
                            type="radio"
                            name="package"
                            checked={!selectedPackageId}
                            onChange={() => setSelectedPackageId(null)}
                            className="accent-primary"
                          />
                          <span className="text-sm text-slate-600">Pay normally</span>
                        </label>
                        {patientPackages.map((pkg: any) => (
                          <label key={pkg.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-primary">
                            <input
                              type="radio"
                              name="package"
                              checked={selectedPackageId === pkg.id}
                              onChange={() => setSelectedPackageId(pkg.id)}
                              className="accent-primary"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{pkg.package?.name}</p>
                              <p className="text-xs text-slate-400">{pkg.remainingSessions} session{pkg.remainingSessions !== 1 ? 's' : ''} remaining</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <AppButton
                    className="w-full rounded-2xl h-12 text-base font-bold"
                    onClick={() => bookMutation.mutate()}
                    disabled={bookMutation.isPending}
                  >
                    {bookMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Booking…
                      </span>
                    ) : 'Confirm Appointment'}
                  </AppButton>

                  <p className="text-xs text-center text-slate-400">
                    You can cancel or reschedule from your appointments page.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

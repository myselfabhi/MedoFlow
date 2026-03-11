'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api, { setAccessToken } from '@/lib/api';
import { getClinic } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders, getAvailability } from '@/lib/providerApi';
import {
  getClinicLocations,
  checkPatientExists,
  createAppointment,
  createSlotHold,
  releaseSlotHold,
} from '@/lib/appointmentApi';
import { createRecurringSeries, type RecurringConflict } from '@/lib/recurringApi';
import { LoginModal } from '@/components/LoginModal';
import { WaitlistModal } from '@/components/WaitlistModal';
import { RecurringConflictModal } from '@/components/RecurringConflictModal';
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardFooter,
  AppButton,
  AppInput,
  AppFormField,
} from '@/components/ui-system';
import type { TimeSlot } from '@/lib/types/booking';

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type PatientFormData = z.infer<typeof patientSchema>;

const STEPS = ['Provider', 'Date', 'Time', 'Patient', 'Confirm'];
const ONLINE_LOCATION_NAMES = ['online', 'virtual'];

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, isAuthenticated, user } = useAuth();
  const serviceId = params.serviceId as string;
  const clinicId = searchParams.get('clinicId') || '';
  const providerShortcutId = searchParams.get('providerId');

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [patientExists, setPatientExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringSessions, setRecurringSessions] = useState<number>(4);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');
  const [recurringUseEndDate, setRecurringUseEndDate] = useState(false);
  const [recurringConflictModal, setRecurringConflictModal] = useState<{
    conflicts: RecurringConflict[];
    createdCount: number;
  } | null>(null);
  const [slotHoldId, setSlotHoldId] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);

  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: () => getClinic(clinicId),
    enabled: !!clinicId,
  });

  const { data: services } = useQuery({
    queryKey: ['clinic-services', clinicId],
    queryFn: () => getClinicServices(clinicId),
    enabled: !!clinicId,
  });

  const { data: providers } = useQuery({
    queryKey: ['clinic-providers', clinicId],
    queryFn: () => getClinicProviders(clinicId),
    enabled: !!clinicId,
  });

  const { data: locations } = useQuery({
    queryKey: ['clinic-locations', clinicId],
    queryFn: () => getClinicLocations(clinicId),
    enabled: !!clinicId,
  });

  const service = services?.find((s) => s.id === serviceId);
  const launchLocation =
    locations?.find((location) =>
      ONLINE_LOCATION_NAMES.includes(location.name.trim().toLowerCase())
    ) ??
    locations?.[0] ??
    null;
  const providersForService = providers?.filter((p) =>
    p.providerServices.some((ps) => ps.serviceId === serviceId)
  );

  React.useEffect(() => {
    if (providerShortcutId && providersForService?.some((provider) => provider.id === providerShortcutId)) {
      setProviderId(providerShortcutId);
      setStep((current) => (current === 0 ? 1 : current));
    }
  }, [providerShortcutId, providersForService]);

  React.useEffect(() => {
    setBookingError(null);
  }, [selectedDate, providerId]);

  const { data: slots, isLoading: slotsLoading, isError: slotsError } = useQuery({
    queryKey: ['availability', clinicId, serviceId, selectedDate, providerId || 'any', launchLocation?.id || 'any'],
    queryFn: () =>
      getAvailability(
        clinicId,
        serviceId,
        selectedDate,
        providerId || undefined,
        launchLocation?.id
      ),
    enabled: !!clinicId && !!serviceId && !!selectedDate && (locations?.length ?? 0) > 0,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  const email = watch('email');

  const checkEmail = useCallback(async () => {
    if (!email || !email.includes('@')) return;
    setCheckingEmail(true);
    setPatientExists(null);
    try {
      const exists = await checkPatientExists(email);
      setPatientExists(exists);
      if (exists) setShowLoginModal(true);
    } finally {
      setCheckingEmail(false);
    }
  }, [email]);

  const releaseCurrentHold = useCallback(async () => {
    if (!slotHoldId || !clinicId) return;
    try {
      await releaseSlotHold(slotHoldId, clinicId);
    } catch {
      // Best-effort release; server also expires old holds.
    } finally {
      setSlotHoldId(null);
    }
  }, [slotHoldId, clinicId]);

  React.useEffect(() => {
    return () => {
      if (slotHoldId && clinicId) {
        void releaseSlotHold(slotHoldId, clinicId);
      }
    };
  }, [slotHoldId, clinicId]);

  // When user changes provider or date, release any hold and clear selected time so they must pick again.
  const prevProviderRef = React.useRef(providerId);
  const prevDateRef = React.useRef(selectedDate);
  React.useEffect(() => {
    if (prevProviderRef.current !== providerId || prevDateRef.current !== selectedDate) {
      prevProviderRef.current = providerId;
      prevDateRef.current = selectedDate;
      setSelectedSlot(null);
      if (slotHoldId && clinicId) {
        void releaseSlotHold(slotHoldId, clinicId);
        setSlotHoldId(null);
      }
    }
  }, [providerId, selectedDate, slotHoldId, clinicId]);

  const handleLoginSubmit = useCallback(
    async (loginEmail: string, password: string) => {
      setLoginError(null);
      try {
        await login(loginEmail, password);
        setShowLoginModal(false);
      } catch {
        setLoginError('Invalid email or password. Please try again.');
      }
    },
    [login]
  );

  const doCreateAppointment = useCallback(
    async (patientId: string) => {
      if (!selectedSlot) {
        throw new Error('No time slot selected. Please go back and choose a time.');
      }
      const appointment = await createAppointment({
        clinicId,
        ...(selectedSlot.locationId && { locationId: selectedSlot.locationId }),
        providerId: selectedSlot.providerId,
        serviceId,
        patientId,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...(slotHoldId && { slotHoldId }),
      });
      if (appointment.status === 'PENDING_PAYMENT') {
        router.push(`/payment/${appointment.id}`);
      } else {
        router.push('/dashboard/appointments');
      }
    },
    [
      clinicId,
      locations,
      providerId,
      providersForService,
      router,
      selectedSlot,
      serviceId,
      slotHoldId,
    ]
  );

  const doCreateRecurringSeries = useCallback(
    async (patientId: string): Promise<{ appointments: unknown[]; conflicts: RecurringConflict[] }> => {
      if (!selectedSlot) {
        throw new Error('No time slot selected. Please go back and choose a time.');
      }
      const payload = {
        clinicId,
        ...(selectedSlot.locationId && { locationId: selectedSlot.locationId }),
        providerId: selectedSlot.providerId,
        serviceId,
        patientId,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        frequency: 'WEEKLY' as const,
        ...(recurringUseEndDate && recurringEndDate
          ? { endDate: recurringEndDate }
          : { numberOfSessions: Math.max(2, recurringSessions) }),
      };
      const result = await createRecurringSeries(payload);
      if (result.conflicts.length > 0) {
        return result;
      }
      const first = result.appointments[0] as { status?: string; id?: string } | undefined;
      if (first?.status === 'PENDING_PAYMENT' && first?.id) {
        router.push(`/payment/${first.id}`);
      } else {
        router.push('/dashboard/appointments');
      }
      return result;
    },
    [
      clinicId,
      locations,
      providerId,
      providersForService,
      recurringEndDate,
      recurringSessions,
      recurringUseEndDate,
      router,
      selectedSlot,
      serviceId,
    ]
  );

  const appointmentMutation = useMutation({
    mutationFn: async (data: {
      patientId?: string;
      name?: string;
      email?: string;
      password?: string;
      recurring?: boolean;
    }) => {
      const runWithPatient = async (pid: string) => {
        if (data.recurring && isRecurring) {
          return doCreateRecurringSeries(pid);
        }
        await doCreateAppointment(pid);
        return { appointments: [], conflicts: [] };
      };
      if (data.patientId) return runWithPatient(data.patientId);
      if (!data.email || !data.password) throw new Error('Email and password required');

      const tryLoginFirst = async (): Promise<string | null> => {
        try {
          const { data: loginRes } = await api.post<{
            success: boolean;
            data: { accessToken: string; user: { id: string } };
          }>('/auth/login', { email: data.email, password: data.password });
          setAccessToken(loginRes.data.accessToken);
          return loginRes.data.user.id;
        } catch {
          return null;
        }
      };

      const existingUserId = await tryLoginFirst();
      if (existingUserId) {
        return runWithPatient(existingUserId);
      }

      try {
        await api.post('/auth/register', {
          name: data.name,
          email: data.email,
          password: data.password,
          role: 'PATIENT',
        });
      } catch (err: unknown) {
        const axErr = err as { response?: { data?: { message?: string } } };
        if (axErr.response?.data?.message === 'Email already registered') {
          throw new Error(
            'This email is already registered. Please log in with your existing account to continue.'
          );
        }
        throw err;
      }

      const { data: loginRes } = await api.post<{
        success: boolean;
        data: { accessToken: string; user: { id: string } };
      }>('/auth/login', { email: data.email, password: data.password });
      setAccessToken(loginRes.data.accessToken);
      return runWithPatient(loginRes.data.user.id);
    },
  });

  const handleBookingResult = useCallback(
    (result: { appointments: unknown[]; conflicts: RecurringConflict[] } | void) => {
      if (result?.conflicts?.length) {
        setRecurringConflictModal({
          conflicts: result.conflicts,
          createdCount: result.appointments?.length ?? 0,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    [queryClient]
  );

  const onSubmit = async (data: PatientFormData) => {
    setBookingError(null);
    try {
      let result: { appointments: unknown[]; conflicts: RecurringConflict[] } | void;
      if (isAuthenticated && user) {
        result = await appointmentMutation.mutateAsync({
          patientId: user.id,
          recurring: isRecurring,
        });
      } else if (patientExists) {
        const { data: meRes } = await api.get<{ success: boolean; data: { user: { id: string } } }>(
          '/auth/me'
        );
        result = await appointmentMutation.mutateAsync({
          patientId: meRes.data.user.id,
          recurring: isRecurring,
        });
      } else {
        result = await appointmentMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password,
          recurring: isRecurring,
        });
      }
      handleBookingResult(result);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string; code?: string } }; message?: string };
      const msg = axErr.response?.data?.message || axErr.message || 'Booking failed. Please try again.';
      const code = axErr.response?.data?.code;
      if ((axErr.response?.status === 409 || axErr.response?.status === 400) && code === 'expired_hold') {
        setBookingError('Your slot hold expired. Please select the time again.');
      } else if (axErr.response?.status === 400 && code === 'invalid_slot') {
        setBookingError('This slot is no longer available. Please select another.');
      } else if (axErr.response?.status === 409) {
        setBookingError('This slot was just booked. Please select another.');
      } else if (msg.includes('already registered') || msg.includes('log in with your existing')) {
        setBookingError(msg);
        setShowLoginModal(true);
      } else {
        setBookingError(msg);
      }
    }
  };

  const handleConfirmAuthenticated = async () => {
    if (!user) return;
    setBookingError(null);
    try {
      const result = await appointmentMutation.mutateAsync({
        patientId: user.id,
        recurring: isRecurring,
      });
      handleBookingResult(result);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string; code?: string } }; message?: string };
      const msg = axErr.response?.data?.message || axErr.message || 'Booking failed. Please try again.';
      const code = axErr.response?.data?.code;
      if ((axErr.response?.status === 409 || axErr.response?.status === 400) && code === 'expired_hold') {
        setBookingError('Your slot hold expired. Please select the time again.');
      } else if (axErr.response?.status === 400 && code === 'invalid_slot') {
        setBookingError('This slot is no longer available. Please select another.');
      } else if (axErr.response?.status === 409) {
        setBookingError('This slot was just booked. Please select another.');
      } else {
        setBookingError(msg);
      }
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const providerName = providerId
    ? `${providersForService?.find((p) => p.id === providerId)?.firstName || ''} ${providersForService?.find((p) => p.id === providerId)?.lastName || ''}`
    : 'Any Available';
  const selectedSlotProvider = selectedSlot
    ? providersForService?.find((provider) => provider.id === selectedSlot.providerId)
    : null;

  if (!clinicId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Invalid booking. Please select a service from a clinic.
        </div>
        <Link href="/" className="mt-6 inline-block text-primary-600 hover:underline">
          ← Back to clinics
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Step {step + 1} of 5: {STEPS[step]}
        </p>
      </div>

      <AppCard>
        <AppCardHeader>
          <h1 className="text-xl font-semibold text-slate-900">
            Book {service?.name || 'Service'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {service?.duration} min · ${service?.defaultPrice}
          </p>
        </AppCardHeader>
        <AppCardContent className="space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Select Provider</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setProviderId(null);
                    nextStep();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                    !providerId
                      ? 'border-primary-600 bg-primary-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">Any Available</span>
                </button>
                {providersForService?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderId(p.id);
                      nextStep();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                      providerId === p.id
                        ? 'border-primary-600 bg-primary-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {p.disciplines?.length
                        ? p.disciplines.map((pd) => pd.discipline.name).join(' · ')
                        : p.discipline?.name ?? ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Select Date</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Select Time</h2>
              {bookingError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {bookingError}
                </div>
              )}
              {(locations?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                  <p className="font-medium">No location set up yet</p>
                  <p className="mt-1 text-amber-700">
                    Even for online-only care, the clinic needs one location (e.g. &quot;Virtual&quot; or &quot;Online&quot;) so appointment times and timezones are set correctly. Ask the clinic to add a location in their dashboard under Locations.
                  </p>
                </div>
              ) : slotsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                  Unable to load available times. Please try another date or contact the clinic.
                </div>
              ) : slotsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots?.map((slot) => (
                    <button
                      key={`${slot.providerId}-${slot.locationId}-${slot.start}`}
                      type="button"
                      onClick={async () => {
                        if (holdingSlot) return;
                        setHoldingSlot(true);
                        setBookingError(null);
                        try {
                          await releaseCurrentHold();
                          const hold = await createSlotHold({
                            clinicId,
                            providerId: slot.providerId,
                            serviceId,
                            ...(slot.locationId && {
                              locationId: slot.locationId,
                            }),
                            timezone: slot.timezone,
                            startTime: slot.start,
                            endTime: slot.end,
                          });
                          setSlotHoldId(hold.id);
                          setSelectedSlot(slot);
                          nextStep();
                        } catch (err: unknown) {
                          const message =
                            err && typeof err === 'object' && 'response' in err
                              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                              : null;
                          setBookingError(
                            message || 'Unable to lock this slot. Please pick another time.'
                          );
                        } finally {
                          setHoldingSlot(false);
                        }
                      }}
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                        selectedSlot?.start === slot.start
                          ? 'border-primary-600 bg-primary-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>{formatTime(slot.start)}</div>
                      <div className="mt-1 text-[11px] font-normal text-gray-500">
                        {providersForService?.find((provider) => provider.id === slot.providerId)?.firstName}{' '}
                        {providersForService?.find((provider) => provider.id === slot.providerId)?.lastName}
                      </div>
                    </button>
                  ))}
                  {slots?.length === 0 && (
                    <div className="col-span-full space-y-3 text-center">
                      <p className="text-sm text-gray-500">
                        No slots available. Try another date.
                      </p>
                      {providerId && providersForService && providersForService.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowWaitlistModal(true)}
                          className="rounded-lg border-2 border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Join waitlist
                        </button>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Select a specific provider to join the waitlist.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {holdingSlot && (
                <p className="text-xs text-primary-700">
                  Locking slot for checkout...
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Patient Details</h2>
              {isAuthenticated && user ? (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">Booking as {user.email}</p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(nextStep)} className="space-y-4">
                  <AppFormField label="Name" error={errors.name?.message}>
                    <AppInput
                      {...register('name')}
                      className={errors.name ? 'border-danger' : ''}
                    />
                  </AppFormField>
                  <AppFormField
                    label="Email"
                    error={errors.email?.message}
                    description={
                      patientExists === true
                        ? 'Existing patient. Sign in to continue.'
                        : checkingEmail
                          ? 'Checking...'
                          : undefined
                    }
                  >
                    <AppInput
                      {...register('email')}
                      type="email"
                      onBlur={checkEmail}
                      className={errors.email ? 'border-danger' : ''}
                    />
                  </AppFormField>
                  <AppFormField label="Phone">
                    <AppInput {...register('phone')} type="tel" />
                  </AppFormField>
                  <AppFormField
                    label={patientExists === true ? 'Password (to confirm identity)' : 'Password (for new account)'}
                    error={errors.password?.message}
                  >
                    <AppInput
                      {...register('password')}
                      type="password"
                      className={errors.password ? 'border-danger' : ''}
                    />
                  </AppFormField>
                  <div className="flex gap-3 pt-2">
                    <AppButton type="button" variant="outline" onClick={prevStep}>
                      Back
                    </AppButton>
                    <AppButton type="submit">
                      Next
                    </AppButton>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Confirm Booking</h2>
              {!selectedSlot && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No time slot selected. Please go back and choose a time.
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-5 text-sm">
                <p>
                  <strong>Clinic:</strong> {clinic?.name}
                </p>
                <p>
                  <strong>Service:</strong> {service?.name}
                </p>
                <p>
                  <strong>Provider:</strong>{' '}
                  {selectedSlotProvider
                    ? `${selectedSlotProvider.firstName} ${selectedSlotProvider.lastName}`
                    : providerName}
                </p>
                <p>
                  <strong>Date & Time:</strong> {selectedDate && formatDate(selectedDate)} at{' '}
                  {selectedSlot && formatTime(selectedSlot.start)}
                </p>
                <p>
                  <strong>Location:</strong>{' '}
                  {selectedSlot?.locationId && locations?.length
                    ? locations.find((l) => l.id === selectedSlot.locationId)?.name ?? launchLocation?.name ?? 'Clinic location'
                    : launchLocation?.name ?? 'Clinic location'}
                </p>
                <p>
                  <strong>Price:</strong> ${service?.defaultPrice}
                </p>
                {!isAuthenticated && (
                  <p>
                    <strong>Patient:</strong> {watch('name')} ({watch('email')})
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Make this a recurring appointment
                  </span>
                </label>
                {isRecurring && (
                  <div className="ml-7 space-y-4 border-l-2 border-gray-100 pl-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Frequency
                      </label>
                      <select
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        value="WEEKLY"
                        disabled
                      >
                        <option value="WEEKLY">Weekly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="recurringMode"
                          checked={!recurringUseEndDate}
                          onChange={() => setRecurringUseEndDate(false)}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Number of sessions</span>
                      </label>
                      {!recurringUseEndDate && (
                        <input
                          type="number"
                          min={2}
                          max={52}
                          value={recurringSessions}
                          onChange={(e) =>
                            setRecurringSessions(Math.min(52, Math.max(2, parseInt(e.target.value, 10) || 2)))
                          }
                          className="block w-full max-w-[8rem] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="recurringMode"
                          checked={recurringUseEndDate}
                          onChange={() => setRecurringUseEndDate(true)}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">End date</span>
                      </label>
                      {recurringUseEndDate && (
                        <input
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          min={selectedDate || new Date().toISOString().split('T')[0]}
                          className="block w-full max-w-[12rem] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {bookingError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {bookingError}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={prevStep} className="rounded-lg border px-4 py-2">
                  Back
                </button>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleConfirmAuthenticated}
                    disabled={
                      !selectedSlot ||
                      appointmentMutation.isPending ||
                      Boolean(
                        isRecurring &&
                          recurringUseEndDate &&
                          (!recurringEndDate || (selectedDate && recurringEndDate < selectedDate))
                      )
                    }
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    {appointmentMutation.isPending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Booking...
                      </>
                    ) : (
                      isRecurring ? 'Confirm recurring booking' : 'Confirm Booking'
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="inline">
                    <button
                      type="submit"
                      disabled={
                        !selectedSlot ||
                        appointmentMutation.isPending ||
                        Boolean(
                          isRecurring &&
                            recurringUseEndDate &&
                            (!recurringEndDate || (selectedDate && recurringEndDate < selectedDate))
                        )
                      }
                      className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                    >
                      {appointmentMutation.isPending ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Booking...
                        </>
                      ) : (
                        isRecurring ? 'Confirm recurring booking' : 'Confirm Booking'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </AppCardContent>

        {/* Sticky step navigation - always visible at bottom */}
        {(step === 1 || step === 2) && (
          <AppCardFooter className="sticky bottom-0 z-10 flex-wrap gap-3 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={prevStep}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            {step === 1 && (
              <button
                type="button"
                onClick={nextStep}
                disabled={!selectedDate}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </AppCardFooter>
        )}
      </AppCard>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setLoginError(null);
        }}
        email={email}
        onSubmit={handleLoginSubmit}
        isLoading={false}
        error={loginError}
      />
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        clinicId={clinicId}
        providerId={providerId || ''}
        serviceId={serviceId}
        locationId={launchLocation?.id}
        timezone={launchLocation?.timezone}
        defaultPreferredDate={selectedDate}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['waitlist'] })}
      />
      {recurringConflictModal && (
        <RecurringConflictModal
          isOpen={!!recurringConflictModal}
          onClose={() => setRecurringConflictModal(null)}
          conflicts={recurringConflictModal.conflicts}
          createdCount={recurringConflictModal.createdCount}
          onProceedPartial={() => {
            setRecurringConflictModal(null);
            router.push('/dashboard/appointments');
          }}
          onCancel={() => setRecurringConflictModal(null)}
        />
      )}
    </div>
  );
}

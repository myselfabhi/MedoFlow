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
} from '@/lib/appointmentApi';
import { createRecurringSeries, type RecurringConflict } from '@/lib/recurringApi';
import { LoginModal } from '@/components/LoginModal';
import { WaitlistModal } from '@/components/WaitlistModal';
import { RecurringConflictModal } from '@/components/RecurringConflictModal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type PatientFormData = z.infer<typeof patientSchema>;

const STEPS = ['Provider', 'Date', 'Time', 'Patient', 'Confirm'];

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, isAuthenticated, user } = useAuth();
  const serviceId = params.serviceId as string;
  const clinicId = searchParams.get('clinicId') || '';

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
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
  const providersForService = providers?.filter((p) =>
    p.providerServices.some((ps) => ps.serviceId === serviceId)
  );

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['availability', clinicId, serviceId, selectedDate, providerId || 'any'],
    queryFn: () => getAvailability(clinicId, serviceId, selectedDate, providerId || undefined),
    enabled: !!clinicId && !!serviceId && !!selectedDate,
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
      const appointment = await createAppointment({
        clinicId,
        locationId: locations?.[0]?.id!,
        providerId: providerId || providersForService?.[0]?.id!,
        serviceId,
        patientId,
        startTime: selectedSlot!.start,
        endTime: selectedSlot!.end,
      });
      if (appointment.status === 'PENDING_PAYMENT') {
        router.push(`/payment/${appointment.id}`);
      } else {
        router.push('/dashboard/appointments');
      }
    },
    [clinicId, locations, providerId, providersForService, router, selectedSlot, serviceId]
  );

  const doCreateRecurringSeries = useCallback(
    async (patientId: string): Promise<{ appointments: unknown[]; conflicts: RecurringConflict[] }> => {
      const payload = {
        clinicId,
        locationId: locations?.[0]?.id!,
        providerId: providerId || providersForService?.[0]?.id!,
        serviceId,
        patientId,
        startTime: selectedSlot!.start,
        endTime: selectedSlot!.end,
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
      await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'PATIENT',
      });
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
      const axErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axErr.response?.status === 409) {
        setBookingError('This slot was just booked. Please select another.');
      } else {
        setBookingError(axErr.response?.data?.message || 'Booking failed. Please try again.');
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
      const axErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axErr.response?.status === 409) {
        setBookingError('This slot was just booked. Please select another.');
      } else {
        setBookingError(axErr.response?.data?.message || 'Booking failed. Please try again.');
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

      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-gray-900">
            Book {service?.name || 'Service'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {service?.duration} min · ${service?.defaultPrice}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
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
                    <span className="text-sm text-gray-500">{p.discipline.name}</span>
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
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!selectedDate}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Select Time</h2>
              {slotsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots?.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        nextStep();
                      }}
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                        selectedSlot?.start === slot.start
                          ? 'border-primary-600 bg-primary-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                  {slots?.length === 0 && (
                    <div className="col-span-full space-y-3 text-center">
                      <p className="text-sm text-gray-500">
                        No slots available. Try another date.
                      </p>
                      {providersForService && providersForService.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowWaitlistModal(true)}
                          className="rounded-lg border-2 border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                        >
                          Join waitlist
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button type="button" onClick={prevStep} className="text-sm text-gray-600 hover:underline">
                Back
              </button>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      {...register('name')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      onBlur={checkEmail}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    {checkingEmail && (
                      <p className="mt-1 text-sm text-gray-500">Checking...</p>
                    )}
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                    {patientExists === true && (
                      <p className="mt-1 text-sm text-amber-600">
                        Existing patient. Sign in to continue.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password {patientExists === true ? '(to confirm identity)' : '(for new account)'}
                    </label>
                    <input
                      {...register('password')}
                      type="password"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={prevStep} className="rounded-lg border px-4 py-2">
                      Back
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white"
                    >
                      Next
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-medium text-gray-900">Confirm Booking</h2>
              <div className="rounded-lg bg-gray-50 p-5 text-sm">
                <p>
                  <strong>Clinic:</strong> {clinic?.name}
                </p>
                <p>
                  <strong>Service:</strong> {service?.name}
                </p>
                <p>
                  <strong>Provider:</strong> {providerName}
                </p>
                <p>
                  <strong>Date & Time:</strong> {selectedDate && formatDate(selectedDate)} at{' '}
                  {selectedSlot && formatTime(selectedSlot.start)}
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
                        readOnly
                        aria-readonly
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
                      appointmentMutation.isPending ||
                      (isRecurring &&
                        recurringUseEndDate &&
                        (!recurringEndDate || (selectedDate && recurringEndDate < selectedDate)))
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
                        appointmentMutation.isPending ||
                        (isRecurring &&
                          recurringUseEndDate &&
                          (!recurringEndDate || (selectedDate && recurringEndDate < selectedDate)))
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
        </CardContent>
      </Card>

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
        providerId={providerId || providersForService?.[0]?.id || ''}
        serviceId={serviceId}
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

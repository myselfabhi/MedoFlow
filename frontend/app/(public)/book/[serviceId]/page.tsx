'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import api, { setAccessToken } from '@/lib/api';
import {
  getClinicServices,
  getClinicProviders,
  getClinicLocations,
  getAvailability,
  checkPatientExists,
} from '@/lib/publicApi';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const patientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type PatientFormData = z.infer<typeof patientSchema>;

const STEPS = ['Provider', 'Date', 'Time', 'Patient', 'Confirm'];

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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
    defaultValues: { name: '', email: '', password: '' },
  });

  const email = watch('email');

  const checkEmail = useCallback(async () => {
    if (!email || !email.includes('@')) return;
    setCheckingEmail(true);
    try {
      const exists = await checkPatientExists(email);
      setPatientExists(exists);
    } finally {
      setCheckingEmail(false);
    }
  }, [email]);

  const createAppointment = useCallback(
    async (patientId: string) => {
      const payload = {
        clinicId,
        locationId: locations?.[0]?.id,
        providerId: providerId || providersForService?.[0]?.id,
        serviceId,
        patientId,
        startTime: selectedSlot?.start,
        endTime: selectedSlot?.end,
      };
      const { data } = await api.post<{ success: boolean }>('/appointments', payload);
      return data;
    },
    [clinicId, locations, providerId, providersForService, selectedSlot, serviceId]
  );

  const appointmentMutation = useMutation({
    mutationFn: async (data: { patientId?: string; name?: string; email?: string; password?: string }) => {
      if (data.patientId) {
        return createAppointment(data.patientId);
      }
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
      return createAppointment(loginRes.data.user.id);
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setBookingError(null);
    try {
      if (isAuthenticated && user) {
        await appointmentMutation.mutateAsync({ patientId: user.id });
      } else if (patientExists) {
        await login(data.email, data.password);
        const { data: meRes } = await api.get<{ success: boolean; data: { user: { id: string } } }>(
          '/auth/me'
        );
        await appointmentMutation.mutateAsync({ patientId: meRes.data.user.id });
      } else {
        await appointmentMutation.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      window.location.href = '/dashboard?booked=1';
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axErr.response?.status === 409) {
        setBookingError('This time slot is no longer available. Please select another.');
      } else {
        setBookingError(axErr.response?.data?.message || 'Booking failed. Please try again.');
      }
    }
  };

  const handleConfirmAuthenticated = async () => {
    if (!user) return;
    setBookingError(null);
    try {
      await appointmentMutation.mutateAsync({ patientId: user.id });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      window.location.href = '/dashboard?booked=1';
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axErr.response?.status === 409) {
        setBookingError('This time slot is no longer available. Please select another.');
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
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          Invalid booking. Please select a service from a clinic.
        </div>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to clinics
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Step {step + 1} of 5: {STEPS[step]}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Book {service?.name || 'Service'}</h1>
          <p className="text-sm text-gray-500">
            {service?.duration} min · ${service?.defaultPrice}
          </p>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-medium">Select Provider</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setProviderId(null);
                    nextStep();
                  }}
                  className={`block w-full rounded-lg border p-4 text-left ${!providerId ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  Any Available
                </button>
                {providersForService?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderId(p.id);
                      nextStep();
                    }}
                    className={`block w-full rounded-lg border p-4 text-left ${providerId === p.id ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {p.firstName} {p.lastName} ({p.discipline.name})
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-medium">Select Date</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={nextStep}
                disabled={!selectedDate}
                className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-medium">Select Time</h2>
              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots?.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        nextStep();
                      }}
                      className={`rounded-md border p-2 text-sm ${selectedSlot?.start === slot.start ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                  {slots?.length === 0 && (
                    <p className="col-span-3 text-sm text-gray-500">
                      No slots available. Try another date.
                    </p>
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
              <h2 className="font-medium">Patient Information</h2>
              {isAuthenticated && user ? (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">Booking as {user.email}</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={prevStep} className="rounded-md border px-4 py-2">
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="rounded-md bg-primary-600 px-4 py-2 text-white"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    {checkingEmail && (
                      <p className="mt-1 text-sm text-gray-500">Checking...</p>
                    )}
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                    {patientExists === true && (
                      <p className="mt-1 text-sm text-amber-600">
                        Existing patient. Please{' '}
                        <Link href={`/login?returnUrl=${encodeURIComponent(`/book/${serviceId}?clinicId=${clinicId}`)}`} className="underline">
                          log in
                        </Link>{' '}
                        or enter your password below.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                      {patientExists === true
                        ? ' (to confirm your identity)'
                        : ' (for new account)'}
                    </label>
                    <input
                      {...register('password')}
                      type="password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={prevStep} className="rounded-md border px-4 py-2">
                      Back
                    </button>
                    <button type="submit" className="rounded-md bg-primary-600 px-4 py-2 text-white">
                      Next
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-medium">Confirm Booking</h2>
              <div className="rounded-lg bg-gray-50 p-4 text-sm">
                <p>
                  <strong>Service:</strong> {service?.name}
                </p>
                <p>
                  <strong>Date:</strong> {selectedDate && formatDate(selectedDate)}
                </p>
                <p>
                  <strong>Time:</strong> {selectedSlot && formatTime(selectedSlot.start)}
                </p>
                <p>
                  <strong>Provider:</strong> {providerName}
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
              {bookingError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{bookingError}</div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={prevStep} className="rounded-md border px-4 py-2">
                  Back
                </button>
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleConfirmAuthenticated}
                    disabled={appointmentMutation.isPending}
                    className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {appointmentMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </button>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="inline">
                    <button
                      type="submit"
                      disabled={appointmentMutation.isPending}
                      className="rounded-md bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      {appointmentMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

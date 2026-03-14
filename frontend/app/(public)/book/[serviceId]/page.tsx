'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  getClinic,
} from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders, getAvailability } from '@/lib/providerApi';
import {
  getClinicLocations,
  checkPatientExists,
  createAppointment,
  createSlotHold,
  releaseSlotHold,
} from '@/lib/appointmentApi';
import { getMyEntitlements } from '@/lib/patientApi';
import { createRecurringSeries, type RecurringConflict } from '@/lib/recurringApi';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppButton,
  AppInput,
  AppFormField,
  StickySummaryPanel,
  AppCalendar
} from '@/components/ui-system';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useAppToast } from '@/hooks/useAppToast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck,
  Search,
  Package as PackageIcon,
  CreditCard,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const ONLINE_LOCATION_NAMES = ['online', 'virtual'];

const patientSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type PatientFormData = z.infer<typeof patientSchema>;

type TimeSlot = {
  providerId: string;
  locationId: string | null;
  serviceId: string;
  timezone: string;
  start: string;
  end: string;
};

const STEPS = ['Select Provider', 'Choose Time', 'Your Details', 'Review'];

function BookingPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, isAuthenticated, user } = useAuth();
  const toast = useAppToast();
  
  const serviceId = params.serviceId as string;
  const clinicId = searchParams.get('clinicId') || '';
  const providerShortcutId = searchParams.get('providerId');

  const [step, setStep] = useState(0);
  const [providerId, setProviderId] = useState<string | null>(providerShortcutId);
  const [providerSearch, setProviderSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [patientExists, setPatientExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [slotHoldId, setSlotHoldId] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

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

  const { data: patientEntitlements } = useQuery({
    queryKey: ['patient-entitlements-self'],
    queryFn: () => getMyEntitlements(),
    enabled: !!isAuthenticated && !!user && user.role === 'PATIENT',
  });
  const patientPackages = patientEntitlements?.packages ?? [];

  const service = services?.find((s) => s.id === serviceId);
  const providersForService = providers?.filter((p) =>
    p.providerServices.some((ps) => ps.serviceId === serviceId)
  );

  const selectedProvider = providers?.find(p => p.id === (selectedSlot?.providerId || pendingSlot?.providerId || providerId));

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['availability', clinicId, serviceId, selectedDateStr, providerId || 'any'],
    queryFn: () => getAvailability(clinicId, serviceId, selectedDateStr, providerId || undefined),
    enabled: !!clinicId && !!serviceId && !!selectedDateStr,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', phone: '', password: '' },
  });

  const checkEmail = async () => {
    const email = watch('email');
    if (!email || !z.string().email().safeParse(email).success) return;
    setCheckingEmail(true);
    try {
      const exists = await checkPatientExists(email);
      setPatientExists(exists);
    } finally {
      setCheckingEmail(false);
    }
  };

  const releaseCurrentHold = async () => {
    if (slotHoldId) {
      try {
        await releaseSlotHold(slotHoldId, clinicId);
        setSlotHoldId(null);
      } catch (err) {
        console.error('Failed to release hold', err);
      }
    }
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (pendingSlot?.start === slot.start) {
      if (holdingSlot) return;
      setHoldingSlot(true);
      try {
        await releaseCurrentHold();
        const hold = await createSlotHold({
          clinicId,
          providerId: slot.providerId,
          serviceId,
          locationId: slot.locationId || locations?.[0]?.id || '',
          timezone: slot.timezone,
          startTime: slot.start,
          endTime: slot.end,
        });
        setSlotHoldId(hold.id);
        setSelectedSlot(slot);
        if (isAuthenticated) {
          setStep(3);
        } else {
          setStep(2);
        }
      } catch (err) {
        toast.error('Failed to hold slot. It may have just been taken.');
      } finally {
        setHoldingSlot(false);
      }
    } else {
      setPendingSlot(slot);
    }
  };

  const handlePatientFormSubmit = async (data: PatientFormData) => {
    if (patientExists === true) {
      try {
        await login(data.email, data.password);
        setStep(3);
      } catch (err) {
        toast.error('Invalid password. Please try again.');
      }
    } else {
      setStep(3);
    }
  };

  const handleBooking = async () => {
    try {
      const { appointment, clientSecret } = await createAppointment({
        clinicId,
        locationId: selectedSlot?.locationId || locations?.[0]?.id || '',
        providerId: selectedSlot!.providerId,
        serviceId,
        patientId: user?.id || '',
        startTime: selectedSlot!.start,
        endTime: selectedSlot!.end,
        slotHoldId: slotHoldId || undefined,
        patientPackageId: selectedPackageId || undefined,
      });

      if (clientSecret) {
        router.push(`/payment/${appointment.id}?clientSecret=${clientSecret}`);
      } else {
        toast.success('Appointment booked successfully!');
        router.push('/dashboard/patient/appointments');
      }
    } catch (err) {
      toast.error('Booking failed. Please try again.');
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to clinic
              </Link>
              <h1 className="text-3xl font-black text-slate-900">Book {service?.name || 'Consultation'}</h1>
              
              <div className="flex items-center gap-4 pt-4">
                {STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        i < step ? "bg-emerald-500 text-white" : 
                        i === step ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-500"
                      )}>
                        {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-sm font-medium hidden sm:inline",
                        i === step ? "text-slate-900" : "text-slate-400"
                      )}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className="h-px w-8 bg-slate-200 hidden sm:block" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <AppCard className="border-none shadow-xl rounded-3xl overflow-hidden bg-white min-h-[500px]">
              <AppCardContent className="p-8 lg:p-12">
                
                {step === 0 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl font-bold text-slate-900">Select a Provider</h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <AppInput 
                          placeholder="Search clinician..." 
                          className="pl-10 w-full sm:w-64 rounded-full"
                          value={providerSearch}
                          onChange={(e) => setProviderSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {(!providerSearch || 'any available'.includes(providerSearch.toLowerCase())) && (
                        <button
                          onClick={() => { setProviderId(null); nextStep(); }}
                          className={cn(
                            "flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left",
                            !providerId ? "border-primary-600 bg-primary-50/30" : "border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Any Available Provider</p>
                              <p className="text-sm text-slate-500">Fastest clinical access</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                        </button>
                      )}
                      {providersForService?.filter(p => 
                        `${p.firstName} ${p.lastName}`.toLowerCase().includes(providerSearch.toLowerCase())
                      ).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setProviderId(p.id); nextStep(); }}
                          className={cn(
                            "flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left",
                            providerId === p.id ? "border-primary-600 bg-primary-50/30" : "border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                              <User className="h-6 w-6 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                              <p className="text-sm text-slate-500">
                                {p.disciplines?.[0]?.discipline.name || 'Specialist'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[450px]">
                      {/* Calendar Column */}
                      <div className="flex-1 space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 px-3">Select a Date</h2>
                        <AppCalendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date);
                              setPendingSlot(null);
                            }
                          }}
                          disabled={{ before: new Date() }}
                          className="rounded-3xl border-none p-0"
                        />
                      </div>

                      {/* Time Slots Column */}
                      <div className="w-full lg:w-72 space-y-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          {format(selectedDate, 'EEEE, MMMM d')}
                        </h2>
                        
                        <div className="relative">
                          {slotsLoading ? (
                            <div className="space-y-3">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-2xl" />
                              ))}
                            </div>
                          ) : (
                            <ScrollArea className="h-[400px] pr-4">
                              <div className="space-y-3 pb-8">
                                {slots?.map((slot, i) => {
                                  const isPending = pendingSlot?.start === slot.start;
                                  return (
                                    <div key={i} className="flex gap-2">
                                      <button
                                        onClick={() => handleSlotSelect(slot)}
                                        className={cn(
                                          "flex-1 h-14 rounded-2xl border-2 font-bold transition-all duration-200",
                                          isPending 
                                            ? "border-slate-400 bg-slate-600 text-white w-1/2" 
                                            : "border-primary-100 text-primary-600 hover:border-primary-600 hover:bg-primary-50"
                                        )}
                                      >
                                        {format(parseISO(slot.start), 'h:mm a')}
                                      </button>
                                      {isPending && (
                                        <button
                                          onClick={() => handleSlotSelect(slot)}
                                          className="h-14 px-6 bg-primary-600 text-white rounded-2xl font-bold animate-in slide-in-from-left-2 fade-in duration-200"
                                        >
                                          Confirm
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                                {slots?.length === 0 && (
                                  <div className="text-center py-20 px-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-slate-400">No availability</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-12 pt-8 border-t border-slate-100">
                      <AppButton variant="ghost" onClick={prevStep} className="rounded-full font-bold text-slate-400 hover:text-primary-600">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Change Provider
                      </AppButton>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-xl font-bold text-slate-900">Patient Information</h2>
                    <form onSubmit={handleSubmit(handlePatientFormSubmit)} className="space-y-6 max-w-lg mx-auto">
                      <AppFormField label="Full Name" error={errors.name?.message}>
                        <AppInput {...register('name')} placeholder="e.g. John Doe" className="rounded-xl h-12" />
                      </AppFormField>
                      <AppFormField label="Email Address" error={errors.email?.message}>
                        <AppInput 
                          {...register('email')} 
                          type="email" 
                          placeholder="john@example.com" 
                          className="rounded-xl h-12" 
                          onBlur={checkEmail}
                        />
                      </AppFormField>
                      <AppFormField label="Phone Number" error={errors.phone?.message}>
                        <AppInput {...register('phone')} placeholder="+1 (555) 000-0000" className="rounded-xl h-12" />
                      </AppFormField>
                      
                      {patientExists !== null && (
                        <div className={cn(
                          "p-4 rounded-2xl border text-sm",
                          patientExists ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                        )}>
                          {patientExists ? (
                            <div className="flex gap-3">
                              <ShieldCheck className="h-5 w-5 shrink-0" />
                              <p><strong>Welcome back!</strong> We found an existing account. Enter your password to continue.</p>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <User className="h-5 w-5 shrink-0" />
                              <p><strong>New Account:</strong> We'll create a clinical profile for you. Please set a password.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <AppFormField label={patientExists ? "Account Password" : "Set Profile Password"} error={errors.password?.message}>
                        <AppInput {...register('password')} type="password" placeholder="••••••••" className="rounded-xl h-12" />
                      </AppFormField>

                      <div className="flex items-center gap-4 pt-4">
                        <AppButton variant="outline" type="button" onClick={prevStep} className="flex-1 rounded-full h-12">
                          Back
                        </AppButton>
                        <AppButton type="submit" className="flex-1 rounded-full h-12 shadow-lg">
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </AppButton>
                      </div>
                    </form>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600 mb-6">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Review & Confirm</h2>
                    <p className="text-slate-500 max-w-md mx-auto">Please review your appointment details. By confirming, you agree to our clinic's cancellation policy.</p>
                    
                    {isAuthenticated && patientPackages && patientPackages.length > 0 && (
                      <div className="max-w-md mx-auto p-6 bg-primary-50 rounded-3xl border border-primary-100 space-y-4 text-left">
                        <h3 className="font-bold text-primary-900 flex items-center gap-2">
                          <PackageIcon className="h-5 w-5" /> Use Wellness Package?
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:border-primary-300 border-2 border-transparent transition-all">
                            <input type="radio" name="pkg" checked={!selectedPackageId} onChange={() => setSelectedPackageId(null)} className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-medium">Standard Checkout (${service?.defaultPrice})</span>
                          </label>
                          {patientPackages.map(pkg => (
                            <label key={pkg.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:border-primary-300 border-2 border-transparent transition-all">
                              <input type="radio" name="pkg" checked={selectedPackageId === pkg.id} onChange={() => setSelectedPackageId(pkg.id)} className="h-4 w-4 text-primary-600" />
                              <div className="text-sm">
                                <p className="font-bold">{pkg.package.name}</p>
                                <p className="text-xs text-slate-500">{pkg.totalSessions - pkg.usedSessions} sessions remaining</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-8">
                      <AppButton variant="outline" onClick={prevStep} className="w-full sm:w-auto px-10 rounded-full h-14">
                        Back
                      </AppButton>
                      <AppButton className="w-full sm:w-auto px-12 rounded-full h-14 text-lg font-bold shadow-2xl" onClick={handleBooking}>
                        {selectedPackageId ? 'Confirm with Package' : 'Proceed to Payment'} <ArrowRight className="ml-2 h-4 w-4" />
                      </AppButton>
                    </div>
                  </div>
                )}

              </AppCardContent>
            </AppCard>
          </div>

          <div className="lg:col-span-1">
            <StickySummaryPanel 
              title="Booking Summary"
              items={[
                { label: 'Service', value: service?.name || '---' },
                { label: 'Provider', value: selectedProvider ? `${selectedProvider.firstName} ${selectedProvider.lastName}` : (providerId ? 'Selected' : 'Any Available') },
                { label: 'Duration', value: service ? `${service.duration} min` : '---' },
                { label: 'Date', value: selectedDate ? formatDate(selectedDate) : '---' },
                { label: 'Time', value: selectedSlot ? formatTime(selectedSlot.start) : '---' },
                { label: 'Price', value: `$${service?.defaultPrice || '0.00'}`, isTotal: true },
              ]}
              footer="Transparent pricing. No hidden fees."
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <React.Suspense fallback={null}>
      <BookingPageContent />
    </React.Suspense>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinic } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders } from '@/lib/providerApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppPageHeader,
  AppSection,
} from '@/components/ui-system';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Stethoscope,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: clinic, isLoading: clinicLoading, error: clinicError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['clinic-services', id],
    queryFn: () => getClinicServices(id),
    enabled: !!id,
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['clinic-providers', id],
    queryFn: () => getClinicProviders(id),
    enabled: !!id,
  });

  const isLoading = clinicLoading || servicesLoading || providersLoading;

  if (clinicError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-600 mb-6">
          <Building2 className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Not Found</h1>
        <p className="text-slate-500 mt-2">The clinic you are looking for does not exist or has been removed.</p>
        <AppButton variant="outline" className="mt-8 rounded-full" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </AppButton>
      </div>
    );
  }

  if (isLoading || !clinic) {
    return (
      <div className="p-8 space-y-8 container mx-auto">
        <Skeleton className="h-[300px] w-full rounded-3xl" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Clinic Hero */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Clinics
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest border border-primary-100">
                Authorized Medoflow Clinic
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">{clinic.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {clinic.email}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  United States
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Verified Facility
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AppButton size="lg" className="rounded-full px-8 h-14 font-bold shadow-xl shadow-primary-100" asChild>
                <Link href="#services">Book Appointment</Link>
              </AppButton>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-12">
            
            {/* Services Catalog */}
            <div id="services" className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Service Catalog</h2>
                  <h3 className="text-3xl font-bold text-slate-900">Clinical Offerings</h3>
                </div>
              </div>
              
              <div className="grid gap-4">
                {services?.map((svc) => (
                  <AppCard key={svc.id} className="group hover:border-primary-600 transition-all duration-300 border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <AppCardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 lg:p-8">
                        <div className="flex items-start gap-6">
                          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            <Stethoscope className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-slate-900">{svc.name}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {svc.duration} minutes</span>
                              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> ${svc.defaultPrice}</span>
                            </div>
                          </div>
                        </div>
                        <AppButton 
                          className="rounded-full px-8 group-hover:shadow-lg transition-all"
                          onClick={() => router.push(`/book/${svc.id}?clinicId=${id}`)}
                        >
                          Book Now <ChevronRight className="ml-2 h-4 w-4" />
                        </AppButton>
                      </div>
                    </AppCardContent>
                  </AppCard>
                ))}
                {(!services || services.length === 0) && (
                  <AppCard className="bg-slate-50 border-dashed border-2">
                    <AppCardContent className="py-12 text-center text-slate-400 font-medium">
                      No clinical services are currently listed for this facility.
                    </AppCardContent>
                  </AppCard>
                )}
              </div>
            </div>

            {/* Provider Team */}
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Our Team</h2>
              <h3 className="text-3xl font-bold text-slate-900">Expert Clinicians</h3>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {providers?.map((provider) => (
                  <AppCard key={provider.id} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <AppCardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                          <Users className="h-8 w-8 text-slate-300" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">Dr. {provider.firstName} {provider.lastName}</h4>
                          <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                            {provider.disciplines?.[0]?.discipline.name || 'Specialist'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 italic">
                          Dedicated to providing high-quality, personalized care focused on patient outcomes and clinical excellence.
                        </p>
                      </div>
                    </AppCardContent>
                  </AppCard>
                ))}
              </div>
            </div>

          </div>

          {/* Side Info Rail */}
          <div className="space-y-8">
            <AppCard className="border-none shadow-lg rounded-3xl overflow-hidden sticky top-32">
              <AppCardHeader className="bg-slate-900 text-white p-8 border-none">
                <AppCardTitle className="text-xl font-bold text-white">Facility Details</AppCardTitle>
              </AppCardHeader>
              <AppCardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Location</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">Main Clinical Facility</p>
                      <p className="text-sm text-slate-500">United States</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Hours</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">Mon - Fri: 9:00 AM - 5:00 PM</p>
                      <p className="text-sm text-slate-500">Weekend: By appointment</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Contact</p>
                      <p className="text-sm font-bold text-slate-900 mt-1">{clinic.email}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-800">Secure Self-Pay Booking</p>
                  </div>
                </div>
              </AppCardContent>
            </AppCard>
          </div>

        </div>
      </div>
    </div>
  );
}

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

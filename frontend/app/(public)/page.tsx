'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getClinics, getPublicClinicProducts } from '@/lib/clinicApi';
import { getClinicServices } from '@/lib/serviceApi';
import { getClinicProviders } from '@/lib/providerApi';
import { 
  AppButton, 
  AppCard, 
  AppCardContent,
  AppSection 
} from '@/components/ui-system';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Star,
  ChevronRight,
  ShoppingBag,
  Calendar,
  Users
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicHomePage() {
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: getClinics,
  });

  const mainClinic = clinics?.[0];
  const clinicId = mainClinic?.id;

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['public-services', clinicId],
    queryFn: () => getClinicServices(clinicId!),
    enabled: !!clinicId,
  });

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['public-providers', clinicId],
    queryFn: () => getClinicProviders(clinicId!),
    enabled: !!clinicId,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['public-products', clinicId],
    queryFn: () => getPublicClinicProducts(clinicId!),
    enabled: !!clinicId,
  });

  if (clinicsLoading) {
    return (
      <div className="space-y-12 py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-32">
        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider">
                <Star className="h-3 w-3 fill-current" />
                Premium Self-Pay Care
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Better care through <span className="text-primary-600">better operations.</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Experience a new standard of healthcare. Direct, transparent, and focused on your outcomes. No insurance complexity, just pure care.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <AppButton size="lg" className="h-14 px-8 rounded-full text-base" asChild>
                  <Link href="#book">
                    Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </AppButton>
                <AppButton variant="outline" size="lg" className="h-14 px-8 rounded-full text-base bg-white" asChild>
                  <Link href="#services">
                    Explore Services
                  </Link>
                </AppButton>
              </div>
              <div className="flex items-center gap-6 justify-center lg:justify-start pt-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Transparent Pricing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Specialist Access
                </div>
              </div>
            </div>
            <div className="flex-1 relative w-full max-w-xl">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
              <AppCard className="relative z-10 border-none shadow-2xl rounded-3xl overflow-hidden aspect-[4/5] bg-slate-200">
                {/* Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-300 to-slate-100 flex items-center justify-center">
                  <Calendar className="h-20 w-20 text-slate-400" />
                </div>
              </AppCard>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Care Strip */}
      <div className="bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Same-day Appointments</p>
                <p className="text-xs text-slate-500">Based on availability</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Secure Payments</p>
                <p className="text-xs text-slate-500">PCI Compliant Processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Expert Clinicians</p>
                <p className="text-xs text-slate-500">Certified Professionals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Health Store</p>
                <p className="text-xs text-slate-500">Curated supplements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Services */}
      <section id="services" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">Our Expertise</h2>
              <h3 className="text-4xl font-bold text-slate-900">Specialized Services</h3>
            </div>
            <AppButton variant="ghost" asChild>
              <Link href="/clinic">View all services <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </AppButton>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicesLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />) : 
              services?.slice(0, 6).map((service) => (
                <AppCard key={service.id} className="group hover:border-primary-200 hover:shadow-xl transition-all duration-300 rounded-2xl border-slate-100">
                  <AppCardContent className="p-8">
                    <div className="mb-6 inline-flex items-center justify-center p-3 bg-slate-50 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6">
                      {service.duration} minute consultation with our specialists.
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-lg font-bold text-slate-900">${service.defaultPrice}</span>
                      <AppButton size="sm" variant="outline" className="rounded-full group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600" asChild>
                        <Link href={`/book/${service.id}?clinicId=${clinicId}`}>Book Now</Link>
                      </AppButton>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))
            }
          </div>
        </div>
      </section>

      {/* Testimonial / Trust Band */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/10 skew-x-12 transform translate-x-1/2" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <div className="flex justify-center gap-1 text-amber-400">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-current" />)}
          </div>
          <blockquote className="text-3xl lg:text-4xl font-medium max-w-4xl mx-auto leading-tight italic">
            "Medoflow has completely transformed how I access specialized care. Transparent pricing and easy booking make a huge difference."
          </blockquote>
          <div className="pt-4">
            <p className="font-bold text-lg">Sarah Jenkins</p>
            <p className="text-slate-400">Patient since 2024</p>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section id="providers" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">Team</h2>
            <h3 className="text-4xl font-bold text-slate-900">Our Clinical Experts</h3>
            <p className="text-slate-500 max-w-2xl mx-auto">Experienced providers dedicated to delivering personalized care across multiple disciplines.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {providersLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />) : 
              providers?.slice(0, 4).map((provider) => (
                <div key={provider.id} className="group text-center">
                  <div className="relative mb-6 mx-auto w-48 h-48 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-xl">
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 group-hover:scale-110 transition-transform duration-500">
                      <Users className="h-12 w-12 text-slate-300" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{provider.firstName} {provider.lastName}</h4>
                  <p className="text-sm text-primary-600 font-semibold mb-4 uppercase tracking-wider">
                    {provider.disciplines?.[0]?.discipline.name || 'Specialist'}
                  </p>
                  <AppButton variant="ghost" size="sm" asChild>
                    <Link href={`/clinic/${clinicId}`}>View Profile</Link>
                  </AppButton>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* Storefront Preview */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">Health Store</h2>
              <h3 className="text-4xl font-bold text-slate-900 leading-tight">Curated products for your wellness journey.</h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                Shop our professional-grade supplements and health tools selected by our clinical team.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  Provider Recommended
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  Premium Quality Standards
                </li>
              </ul>
              <AppButton size="lg" className="rounded-full px-8" asChild>
                <Link href="/store">Shop the Store</Link>
              </AppButton>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {productsLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />) : 
                products?.slice(0, 4).map((p: any) => (
                  <AppCard key={p.id} className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <AppCardContent className="p-6 text-center">
                      <div className="h-24 w-full bg-slate-50 rounded-xl mb-4 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-primary-600 font-bold mt-1">${p.price}</p>
                    </AppCardContent>
                  </AppCard>
                ))
              }
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="book" className="py-24 bg-primary-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Ready to prioritize your health?</h2>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Book your first consultation today. Experience healthcare designed around you.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <AppButton size="lg" className="bg-white text-primary-600 hover:bg-slate-100 h-14 px-10 rounded-full text-lg shadow-xl" asChild>
              <Link href={`/clinic/${clinicId}`}>
                Book Appointment
              </Link>
            </AppButton>
            <AppButton variant="outline" size="lg" className="border-white text-white hover:bg-white/10 h-14 px-10 rounded-full text-lg" asChild>
              <Link href="/register">
                Create Account
              </Link>
            </AppButton>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { ClinicalHeroAnimation } from '@/components/common/ClinicalHeroAnimation';

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

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

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
            <motion.div 
              className="flex-1 text-center lg:text-left space-y-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider">
                <Star className="h-3 w-3 fill-current" />
                Premium Self-Pay Care
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                Better care through <span className="text-primary-600">better operations.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Experience a new standard of healthcare. Direct, transparent, and focused on your outcomes. No insurance complexity, just pure care.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <AppButton size="lg" className="h-14 px-8 rounded-full text-base font-bold shadow-xl shadow-primary-100" asChild>
                  <Link href="#book">
                    Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </AppButton>
                <AppButton variant="outline" size="lg" className="h-14 px-8 rounded-full text-base bg-white font-bold border-slate-200" asChild>
                  <Link href="#services">
                    Explore Services
                  </Link>
                </AppButton>
              </motion.div>
              <motion.div variants={fadeUp} className="flex items-center gap-6 justify-center lg:justify-start pt-4 text-sm text-slate-500 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Transparent Pricing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Specialist Access
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex-1 relative w-full max-w-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
              
              <div className="relative z-10 w-full aspect-square lg:aspect-[4/5]">
                <ClinicalHeroAnimation />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Access Care Strip */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-white border-y border-slate-100"
      >
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
      </motion.div>

      {/* Featured Services */}
      <section id="services" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div className="space-y-4">
              <h2 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Our Expertise</h2>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Specialized Services</h3>
            </div>
            <AppButton variant="ghost" className="font-bold text-slate-400 hover:text-primary-600" asChild>
              <Link href="/clinic">View all services <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </AppButton>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {servicesLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />) : 
              services?.slice(0, 6).map((service) => (
                <motion.div key={service.id} variants={fadeUp}>
                  <AppCard className="group h-full hover:border-primary-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border-slate-100 bg-white">
                    <AppCardContent className="p-8 flex flex-col h-full">
                      <div className="mb-6 inline-flex items-center justify-center p-4 bg-slate-50 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{service.name}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-8 font-medium">
                        {service.duration} minute consultation with our specialists.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                        <span className="text-2xl font-black text-slate-900">${service.defaultPrice}</span>
                        <AppButton size="sm" variant="outline" className="rounded-full px-6 font-bold group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all" asChild>
                          <Link href={`/book/${service.id}?clinicId=${clinicId}`}>Book Now</Link>
                        </AppButton>
                      </div>
                    </AppCardContent>
                  </AppCard>
                </motion.div>
              ))
            }
          </motion.div>
        </div>
      </section>

      {/* Testimonial / Trust Band */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/10 skew-x-12 transform translate-x-1/2" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10 text-center space-y-10"
        >
          <div className="flex justify-center gap-1.5 text-amber-400">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-current" />)}
          </div>
          <blockquote className="text-3xl lg:text-5xl font-bold max-w-5xl mx-auto leading-[1.2] italic tracking-tight">
            "Medoflow has completely transformed how I access specialized care. Transparent pricing and easy booking make a huge difference."
          </blockquote>
          <div className="pt-4">
            <p className="font-black text-xl tracking-wide uppercase">Sarah Jenkins</p>
            <p className="text-primary-400 font-bold uppercase tracking-widest text-xs mt-2">Patient since 2024</p>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section id="book" className="py-32 bg-primary-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1] 
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.1, 0.2] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-400/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" 
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">Ready to prioritize <br/>your health?</h2>
            <p className="text-xl lg:text-2xl text-primary-100 max-w-2xl mx-auto font-medium">
              Book your first consultation today. Experience healthcare designed around you.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-center"
          >
            <AppButton size="lg" className="bg-white text-primary-600 hover:bg-slate-50 h-16 px-12 rounded-full text-xl font-black shadow-2xl transition-transform hover:scale-105" asChild>
              <Link href={`/clinic/${clinicId}`}>
                Book Appointment
              </Link>
            </AppButton>
            <AppButton variant="ghost" size="lg" className="border-2 border-white/40 text-white hover:bg-white/10 h-16 px-12 rounded-full text-xl font-black transition-all" asChild>
              <Link href="/register">
                Create Account
              </Link>
            </AppButton>
          </motion.div>
        </div>
      </section>

      {/* Featured Providers */}
      <section id="providers" className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Our Team</h2>
            <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Clinical Experts</h3>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">Specialists dedicated to delivering personalized care across multiple disciplines.</p>
          </motion.div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {providersLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />) : 
              providers?.slice(0, 4).map((provider) => (
                <motion.div key={provider.id} variants={fadeUp} className="group text-center">
                  <div className="relative mb-8 mx-auto w-56 h-56 rounded-[3rem] overflow-hidden bg-white border-8 border-white shadow-2xl group-hover:rotate-2 transition-transform duration-500">
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 group-hover:scale-110 transition-transform duration-700">
                      <Users className="h-16 w-16 text-slate-200" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">Dr. {provider.firstName} {provider.lastName}</h4>
                  <p className="text-xs text-primary-600 font-black mb-6 uppercase tracking-[0.15em]">
                    {provider.disciplines?.[0]?.discipline.name || 'Specialist'}
                  </p>
                  <AppButton variant="ghost" size="sm" className="rounded-full font-bold text-slate-400 hover:text-primary-600" asChild>
                    <Link href={`/clinic/${clinicId}`}>View Profile</Link>
                  </AppButton>
                </motion.div>
              ))
            }
          </motion.div>
        </div>
      </section>

      {/* Storefront Preview */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">Health Store</h2>
                <h3 className="text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight">Curated products for your <span className="text-primary-600">wellness journey.</span></h3>
              </div>
              <p className="text-xl text-slate-500 leading-relaxed font-medium">
                Shop our professional-grade supplements and health tools selected by our clinical team for purity and efficacy.
              </p>
              <div className="space-y-5">
                {[
                  "Provider Recommended Formulations",
                  "Premium Clinical Quality Standards",
                  "Direct to Patient Shipping"
                ].map((text, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="flex items-center gap-4 text-slate-700 font-bold"
                  >
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    {text}
                  </motion.div>
                ))}
              </div>
              <AppButton size="lg" className="rounded-full px-10 h-14 font-bold shadow-xl shadow-primary-100" asChild>
                <Link href="/store">Shop the Store</Link>
              </AppButton>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 grid grid-cols-2 gap-6"
            >
              {productsLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />) : 
                products?.slice(0, 4).map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <AppCard className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-slate-50/50">
                      <AppCardContent className="p-8 text-center flex flex-col items-center">
                        <div className="h-32 w-full bg-white rounded-2xl mb-6 flex items-center justify-center shadow-inner">
                          <ShoppingBag className="h-10 w-10 text-primary-200" />
                        </div>
                        <p className="text-sm font-black text-slate-900 truncate w-full mb-1">{p.name}</p>
                        <p className="text-primary-600 font-black text-lg">${Number(p.price).toFixed(2)}</p>
                      </AppCardContent>
                    </AppCard>
                  </motion.div>
                ))
              }
            </motion.div>
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

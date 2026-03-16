'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { AppButton } from '@/components/ui-system';
import { ArrowRight, Play, CheckCircle2, ShieldCheck } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-24 overflow-hidden bg-[#fafafa]">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Pill Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[11px] font-semibold tracking-wide">
              <ShieldCheck className="h-3.5 w-3.5" />
              HIPAA & SOC2 compliant
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={fadeUp} 
            className="text-4xl md:text-5xl font-bold tracking-tight text-primary leading-[1.15] font-display"
          >
            The Operating System <br />
            for <span className="text-accent">Modern Clinics</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={fadeUp} 
            className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Stop piecing together scheduling, EHR, and billing tools. Run your entire practice on one unified timeline, from patient intake to revenue.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
            <AppButton size="lg" className="h-12 px-6 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary-900 shadow-lg shadow-primary/10" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </AppButton>
            <AppButton variant="outline" size="lg" className="h-12 px-6 rounded-full text-sm font-medium border-slate-200 bg-white hover:bg-slate-50 text-slate-700" asChild>
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4 text-slate-400" /> Watch Workflow
              </Link>
            </AppButton>
          </motion.div>
        </motion.div>

        {/* Desktop App Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative max-w-4xl mx-auto"
        >
          {/* The Floating Notification */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
            className="absolute -right-8 top-16 z-20 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4 hidden md:flex"
          >
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">Payment Received</p>
              <p className="text-xs text-slate-500">Sarah M. • $185.00</p>
            </div>
          </motion.div>

          {/* The Window */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(8,112,184,0.07)] overflow-hidden flex flex-col mx-auto w-full aspect-[16/10] max-h-[600px]">
            {/* macOS Window Header */}
            <div className="h-12 bg-slate-50 border-b border-slate-100 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="h-7 w-64 bg-slate-100/50 border border-slate-200 rounded-md flex items-center justify-center text-[11px] text-slate-400 font-medium">
                app.medoflow.com
              </div>
              <div className="w-16" /> {/* Spacer */}
            </div>
            
            {/* App Body */}
              <div className="flex-1 bg-[#fafafa] p-6 flex flex-col overflow-hidden text-left">
              {/* Header inside App */}
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                     <div className="w-full h-full bg-primary/20" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Good morning</p>
                    <h2 className="text-xl font-bold text-primary font-display">Dr. Chen</h2>
                  </div>
                </div>
                <div className="h-7 px-3 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-500 font-medium mb-0.5">Appts</p>
                  <p className="text-xl font-bold text-slate-900 font-display">12</p>
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-500 font-medium mb-0.5">Follow ups</p>
                  <p className="text-xl font-bold text-slate-900 font-display">7</p>
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] text-slate-500 font-medium mb-0.5">Revenue</p>
                  <p className="text-xl font-bold text-accent font-display">$4.2K</p>
                </div>
              </div>

              {/* Patient List */}
              <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                {[
                  { name: 'Sarah Mitchell', type: 'Wellness Check', time: '9:00 AM', status: 'Confirmed', color: 'text-emerald-600' },
                  { name: 'James Rodriguez', type: 'Follow up', time: '10:30 AM', status: 'In Room', color: 'text-accent' },
                  { name: 'Emily Watson', type: 'Consultation', time: '11:45 AM', status: 'Waiting', color: 'text-slate-500' }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{p.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-900">{p.time}</p>
                      <p className={`text-[10px] font-semibold ${p.color}`}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Blur reflection behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/10 blur-[120px] -z-10 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}

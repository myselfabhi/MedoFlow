'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { AppButton } from '@/components/ui-system';
import { ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const rotatingPhrases = ['Clinical Notes', 'Patient Scheduling', 'Revenue Tracking', 'AI Scribe', 'Billing & Payments'];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-24 pb-20 overflow-hidden">
      {/* Mesh background with floating orbs */}
      <div className="absolute inset-0 bg-[#fafafa]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#1C8B81]/[0.06] blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#223C58]/[0.06] blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-accent/[0.04] blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto space-y-7"
        >
          {/* Pill Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-card text-[11px] font-semibold tracking-wide text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              HIPAA & SOC2 Compliant
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] font-display"
          >
            <span className="text-slate-900">The AI Platform for</span>
            <br />
            <span className="ai-gradient-text relative">
              <motion.span
                key={phraseIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="inline-block"
              >
                {rotatingPhrases[phraseIndex]}
              </motion.span>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Stop piecing together scheduling, EHR, and billing tools. Run your entire practice on one intelligent, unified platform.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-2">
            <AppButton size="lg" className="h-13 px-8 rounded-full text-sm font-semibold ai-gradient-bg text-white hover:opacity-90 shadow-glow-lg transition-all duration-300" asChild>
              <Link href="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </AppButton>
            <AppButton variant="outline" size="lg" className="h-13 px-8 rounded-full text-sm font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-card" asChild>
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4 text-accent" /> Watch Demo
              </Link>
            </AppButton>
          </motion.div>
        </motion.div>

        {/* Desktop App Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          {/* Floating notification */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
            transition={{
              delay: 1.4,
              duration: 0.6,
              type: 'spring',
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="absolute -right-4 lg:-right-12 top-20 z-20 bg-white rounded-2xl p-4 shadow-glass border border-slate-100 items-center gap-4 hidden md:flex"
          >
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">Note Generated</p>
              <p className="text-xs text-slate-500">AI Scribe · 2 min ago</p>
            </div>
          </motion.div>

          {/* AI badge floating left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              delay: 1.8,
              duration: 0.6,
              type: 'spring',
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }
            }}
            className="absolute -left-4 lg:-left-10 top-40 z-20 bg-white rounded-2xl px-4 py-3 shadow-glass border border-slate-100 hidden md:flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-full ai-gradient-bg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Smart Scheduling</p>
              <p className="text-[10px] text-slate-500">3 slots optimized</p>
            </div>
          </motion.div>

          {/* Browser window */}
          <div className="rounded-2xl lg:rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-15px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col mx-auto w-full aspect-[16/10] max-h-[600px]">
            {/* Window chrome */}
            <div className="h-12 bg-slate-50/80 border-b border-slate-100 flex items-center px-4 justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="h-7 w-64 bg-slate-100/60 border border-slate-200/60 rounded-lg flex items-center justify-center text-[11px] text-slate-400 font-medium">
                app.medoflow.com
              </div>
              <div className="w-16" />
            </div>

            {/* App body */}
            <div className="flex-1 bg-[#fafafa] p-6 flex flex-col overflow-hidden text-left">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full ai-gradient-bg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">DC</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Good morning</p>
                    <h2 className="text-xl font-bold text-slate-900 font-display">Dr. Chen</h2>
                  </div>
                </div>
                <div className="h-7 px-3 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Appointments', value: '12', color: 'text-slate-900' },
                  { label: 'AI Notes', value: '8', color: 'text-slate-900' },
                  { label: 'Revenue', value: '$4.2K', color: 'text-accent' },
                ].map((m, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-3 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
                    <p className="text-[10px] text-slate-500 font-medium mb-0.5">{m.label}</p>
                    <p className={`text-xl font-bold font-display ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-100 rounded-xl shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] overflow-hidden flex-1 flex flex-col">
                {[
                  { name: 'Sarah Mitchell', type: 'Wellness Check', time: '9:00 AM', status: 'Confirmed', color: 'text-emerald-600' },
                  { name: 'James Rodriguez', type: 'Follow up', time: '10:30 AM', status: 'In Room', color: 'text-accent' },
                  { name: 'Emily Watson', type: 'Consultation', time: '11:45 AM', status: 'Waiting', color: 'text-slate-500' }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
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

          {/* Glow behind mockup */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-accent/8 blur-[100px] -z-10 rounded-full" />
        </motion.div>

        {/* Stats ribbon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            { value: 10, suffix: 'x', label: 'Faster Clinical Notes' },
            { value: 99, suffix: '%', label: 'Platform Uptime' },
            { value: 60, suffix: '%', label: 'Less Admin Work' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold font-display text-slate-900">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Calendar as CalendarIcon, BarChart3, Users, Shield, Puzzle, CheckCircle2, DollarSign, Truck } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export function BentoGridSection() {
  const [typedText, setTypedText] = useState('');
  const fullText = "Patient reports improved mobility following 4 weeks of physical therapy. Recommending continued sessions...";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        setTimeout(() => { i = 0; }, 2000);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="features" className="py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">Platform</p>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight mb-4">
              Everything you need,{' '}
              <span className="ai-gradient-text">beautifully unified</span>
            </h2>
            <p className="text-lg text-slate-500">
              Purpose-built tools that work together seamlessly
            </p>
          </ScrollReveal>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto auto-rows-[300px]">

          {/* Card 1: AI Scribe (spans 2 cols) */}
          <ScrollReveal className="col-span-1 md:col-span-2">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-br from-[#fafafa] to-white rounded-3xl p-8 border border-slate-100 h-full flex flex-col justify-between overflow-hidden relative group hover:shadow-card-hover transition-shadow duration-500"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-2xl ai-gradient-bg flex items-center justify-center mb-4">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">AI Scribe</h3>
                <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                  HIPAA-compliant voice-to-text captures every detail while you focus on patients.
                </p>
              </div>
              {/* Mockup */}
              <div className="mt-6 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <Mic className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-bold text-accent flex items-center gap-1 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Listening
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-4 h-8">
                  {[1, 2, 3, 4, 3, 5, 2, 4, 2, 1, 2, 3, 4, 2].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [6, h * 5, 6] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                      className="w-1 bg-accent/20 rounded-full"
                    />
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 shadow-card border border-slate-100 w-full max-w-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Auto-transcribing</p>
                  <p className="text-[11px] text-slate-700 font-medium min-h-[1.5em] leading-relaxed">
                    {typedText}<span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 align-middle animate-pulse" />
                  </p>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Card 2: Patient Portal (spans 2 rows) */}
          <ScrollReveal delay={0.1} className="row-span-1 md:row-span-2">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-br from-[#fafafa] to-white rounded-3xl p-8 border border-slate-100 h-full flex flex-col items-center overflow-hidden relative group hover:shadow-card-hover transition-shadow duration-500"
            >
              <div className="w-full relative z-10 text-left mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Patient Portal</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Your clinic in their pocket. Booking, forms, and communication.
                </p>
              </div>
              {/* Phone Mockup */}
              <motion.div
                whileHover={{ y: -4 }}
                className="w-44 h-[340px] bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl relative border-4 border-slate-800"
              >
                <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-b-xl z-20" />
                  <div className="ai-gradient-bg text-white p-4 pt-6 pb-4">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Medoflow</p>
                  </div>
                  <div className="p-3 flex-1 space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                        <CalendarIcon className="w-3 h-3 text-accent" />
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded w-12 mb-1" />
                      <div className="h-1.5 bg-slate-100 rounded w-16" />
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-accent/20">
                      <p className="text-[8px] text-accent font-bold uppercase tracking-widest mb-1.5">Next Appointment</p>
                      <p className="text-[10px] font-bold text-slate-900 mb-3">Tomorrow, 10:30 AM</p>
                      <div className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full w-max uppercase tracking-wider">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Forms completed
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </ScrollReveal>

          {/* Card 3: Commerce */}
          <ScrollReveal delay={0.15}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-br from-[#fafafa] to-white rounded-3xl p-8 border border-slate-100 h-full flex flex-col justify-between overflow-hidden relative group hover:shadow-card-hover transition-shadow duration-500"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Commerce</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Sell supplements with automatic fulfillment.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 animate-buoyancy">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">$245.00</p>
                    <p className="text-[9px] text-slate-500 leading-none">Vitamin D Pack</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 ml-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">Fulfilled</p>
                    <p className="text-[9px] text-slate-500 leading-none">Shipped via USPS</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Card 4: Scheduling */}
          <ScrollReveal delay={0.2}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-gradient-to-br from-[#fafafa] to-white rounded-3xl p-8 border border-slate-100 h-full flex flex-col justify-between overflow-hidden relative group hover:shadow-card-hover transition-shadow duration-500"
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <CalendarIcon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Smart Scheduling</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Zero-conflict booking with AI availability.
                </p>
              </div>
              <div className="mt-4 flex justify-center">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 inline-block">
                  <div className="flex gap-1.5 text-[9px] font-bold text-slate-300 mb-2 px-1 uppercase tracking-widest">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">{d}</div>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <div className="w-5 h-5 rounded-md ai-gradient-bg flex items-center justify-center text-[9px] text-white font-bold shadow-sm">8</div>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10">9</div>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10">10</div>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10 border border-accent/20">11</div>
                    {[12,13,14].map(d => (
                      <div key={d} className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">{d}</div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>

        {/* Additional feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16 max-w-3xl mx-auto">
          {[
            { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Revenue Analytics' },
            { icon: <Shield className="w-3.5 h-3.5" />, label: 'HIPAA Security' },
            { icon: <Puzzle className="w-3.5 h-3.5" />, label: 'Integrations' },
          ].map((f, i) => (
            <ScrollReveal key={i} delay={0.1 * i}>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-100 shadow-card text-sm font-medium text-slate-600 hover:shadow-card-hover hover:border-slate-200 transition-all duration-300">
                <span className="text-accent">{f.icon}</span>
                {f.label}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

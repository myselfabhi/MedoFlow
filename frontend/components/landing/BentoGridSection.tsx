'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, CheckCircle2, DollarSign, Truck, Calendar as CalendarIcon } from 'lucide-react';

export function BentoGridSection() {
  const [typedText, setTypedText] = useState('');
  const fullText = "Patient reports improved mobility following 4 weeks of physical therapy...";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold font-display text-primary mb-3"
          >
            Everything you need, beautifully unified
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-slate-500"
          >
            Purpose-built tools that work together seamlessly
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto auto-rows-[280px]">
          
          {/* Card 1: AI Scribe (Top Left, spans 2 cols) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="bg-[#fafafa] rounded-3xl p-8 border border-slate-100 col-span-1 md:col-span-2 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] transition-all duration-300"
          >
            <div className="relative z-10">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">AI Scribe</h3>
              <p className="text-slate-500 text-xs max-w-md leading-relaxed">
                Charts that write themselves. HIPAA-compliant voice-to-text captures every detail while you focus on patients.
              </p>
            </div>
            {/* Mockup */}
            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                <Mic className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-bold text-accent flex items-center gap-1 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Listening
                </span>
              </div>
              {/* Sound waves animation */}
              <div className="flex items-center gap-1.5 mb-6 h-10">
                {[1, 2, 3, 4, 3, 5, 2, 4, 2, 1, 2, 3, 4, 2].map((h, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: [8, h * 6, 8] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                    className="w-1.5 bg-slate-200/60 rounded-full"
                  />
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 w-full max-w-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Auto-transcribing</p>
                <p className="text-[11px] text-slate-700 font-medium min-h-[1.5em] leading-relaxed">
                  {typedText}<span className="inline-block w-1 h-3.5 bg-accent ml-0.5 align-middle animate-pulse" />
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Patient App (Right side, spans 2 rows) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="bg-[#fafafa] rounded-3xl p-8 border border-slate-100 row-span-1 md:row-span-2 flex flex-col items-center relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] transition-all duration-300"
          >
            <div className="w-full relative z-10 text-left mb-12">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">Patient App</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Your clinic in their pocket. Booking, forms, and communication in one place.
              </p>
            </div>
            {/* Phone Mockup */}
            <motion.div 
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-44 h-[350px] bg-primary rounded-[2.5rem] p-2 shadow-2xl relative border-4 border-slate-800"
            >
              <div className="w-full h-full bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-b-xl z-20" />
                <div className="bg-primary text-white p-4 pt-6 pb-4">
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

          {/* Card 2: Commerce (Bottom Left, 1 col) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="bg-[#fafafa] rounded-3xl p-8 border border-slate-100 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] transition-all duration-300"
          >
            <div className="relative z-10">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">Commerce</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Launch your branded store. Sell supplements from verified suppliers with automatic fulfillment.
              </p>
            </div>
            {/* Mockup Toasts */}
            <div className="mt-6 space-y-2">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 animate-buoyancy">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">Payment Received</p>
                  <p className="text-[9px] text-slate-500 leading-none">$245.00 · Vitamin D Pack</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 ml-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-900 leading-none mb-1">Order Fulfilled</p>
                  <p className="text-[9px] text-slate-500 leading-none">Shipped via USPS</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Scheduling (Bottom Center, 1 col) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="bg-[#fafafa] rounded-3xl p-8 border border-slate-100 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.01] transition-all duration-300"
          >
            <div className="relative z-10">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-2">Scheduling</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Zero-conflict booking with smart availability.
              </p>
            </div>
            {/* Mockup Calendar */}
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 inline-block">
                <div className="flex gap-1.5 text-[9px] font-bold text-slate-300 mb-2 px-1 uppercase tracking-widest">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-200">1</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">2</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">3</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">4</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">5</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">6</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">7</div>
                </div>
                <div className="flex gap-1 mt-1">
                  <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-[9px] text-white font-bold shadow-sm">8</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10">9</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10">10</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-accent font-bold bg-accent/10 shadow-sm border border-accent/20">11</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">12</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">13</div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] text-slate-400">14</div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

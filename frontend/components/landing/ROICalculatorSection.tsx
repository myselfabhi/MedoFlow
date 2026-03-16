'use client';

import React, { useState, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { AnimatedCounter } from './AnimatedCounter';

export function ROICalculatorSection() {
  const [staff, setStaff] = useState(4);
  const [hours, setHours] = useState(15);
  const [displayValue, setDisplayValue] = useState(46800);

  const calculateROI = (s: number, h: number) => Math.round(s * h * 26 * 0.6 * 52);

  useEffect(() => {
    const newValue = calculateROI(staff, hours);
    const controls = animate(displayValue, newValue, {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [staff, hours]);

  const daysFreed = ((staff * hours * 0.6) / 8).toFixed(1);
  const hoursYear = (staff * hours * 0.6 * 52).toLocaleString();
  const fte = (staff * hours * 0.6 / 40).toFixed(2);

  return (
    <section className="py-28 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">ROI Calculator</p>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight mb-4">
              Calculate your{' '}
              <span className="ai-gradient-text">savings</span>
            </h2>
            <p className="text-lg text-slate-500">
              See how much time Medoflow can give back to your practice
            </p>
          </ScrollReveal>
        </div>

        {/* Calculator */}
        <ScrollReveal>
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-card border border-slate-100">
            <div className="grid md:grid-cols-2 gap-10">

              {/* Inputs */}
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                      <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      Admin Staff
                    </div>
                    <span className="text-2xl font-bold font-display text-slate-900">{staff}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={staff}
                    onChange={(e) => setStaff(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>1 person</span>
                    <span>20 people</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5 text-slate-700 text-sm font-semibold">
                      <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      Admin Hours/Week
                    </div>
                    <span className="text-2xl font-bold font-display text-slate-900">{hours}h</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>5 hours</span>
                    <span>40 hours</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-500 border border-slate-100">
                  <p className="font-semibold text-slate-700 mb-1 text-xs uppercase tracking-wider">How we calculate</p>
                  <p className="text-xs leading-relaxed">Based on US healthcare admin wages ($22–$28/hr avg) and 60% automation across scheduling, intake, follow-ups, and commerce.</p>
                </div>
              </div>

              {/* Output */}
              <div className="ai-gradient-bg rounded-2xl p-8 text-center flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-white/70 mb-2 uppercase tracking-widest">Admin Capacity Freed Annually</p>
                  <h3 className="text-5xl font-bold font-display text-white mb-2">
                    ${displayValue.toLocaleString()}
                  </h3>
                  <p className="text-xs text-white/60 mb-8">worth of time reallocated to patient care</p>

                  <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xl font-bold text-white">{daysFreed}</p>
                      <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider mt-1">days/wk freed</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{hoursYear}</p>
                      <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider mt-1">hours/year</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{fte}</p>
                      <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider mt-1">FTE equiv</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom stats */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: '12–20h', label: 'Admin time saved / week' },
            { value: '5–10%', label: 'More revenue per patient' },
            { value: '20–35%', label: 'Reduction in no-shows' },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={0.1 * i}>
              <div>
                <p className="text-2xl font-bold font-display text-slate-900 mb-1">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

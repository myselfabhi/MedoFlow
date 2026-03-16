'use client';

import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { Users, Clock, TrendingUp } from 'lucide-react';

export function ROICalculatorSection() {
  const [staff, setStaff] = useState(4);
  const [hours, setHours] = useState(15);
  const [displayValue, setDisplayValue] = useState(46800);

  // Logic: (Staff * Hours * Hourly Wage * Automation Rate * Weeks)
  // Heuristic: $46,800 is the anchor for (4 staff, 15 hours).
  // Formula: staff * hours * 26 (avg wage) * 0.6 (automation) * 52 (weeks)
  const calculateROI = (s: number, h: number) => {
    return Math.round(s * h * 26 * 0.6 * 52);
  };

  useEffect(() => {
    const newValue = calculateROI(staff, hours);
    const controls = animate(displayValue, newValue, {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    });
    return () => controls.stop();
  }, [staff, hours]);

  const daysFreed = ((staff * hours * 0.6) / 8).toFixed(1);
  const hoursYear = (staff * hours * 0.6 * 52).toLocaleString();
  const fte = (staff * hours * 0.6 / 40).toFixed(2);

  return (
    <section className="py-24 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-primary mb-3">
            Calculate your savings
          </h2>
          <p className="text-base text-slate-500">
            See how much time Medoflow can give back to your practice
          </p>
        </div>

        {/* Calculator Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,04)] border border-slate-100">
          <div className="grid md:grid-cols-2 gap-10">
            
            {/* Left: Inputs */}
            <div className="space-y-8">
              {/* Staff Slider */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-bold uppercase tracking-widest">
                    <Users className="w-4 h-4 text-slate-400" />
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
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-700 transition-all"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>1 person</span>
                  <span>20 people</span>
                </div>
              </div>

              {/* Hours Slider */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-bold uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-slate-400" />
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
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-700 transition-all"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>5 hours</span>
                  <span>40 hours</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 flex gap-3 border border-slate-100">
                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0 text-[10px] font-bold">i</div>
                <div className="leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5 uppercase tracking-wider text-[9px]">How we calculate this</span>
                  Based on US healthcare admin wages ($22–$28/hr avg) and 60% automation across scheduling, intake, follow-ups, and commerce tasks.
                </div>
              </div>
            </div>

            {/* Right: Output */}
            <div className="bg-slate-100/40 rounded-2xl p-8 border border-slate-200 text-center flex flex-col justify-center relative overflow-hidden">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Admin Capacity Freed Annually</p>
              <h3 className="text-5xl font-bold font-display text-slate-900 mb-2">
                ${displayValue.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 mb-8 font-medium">worth of time reallocated to patient care</p>

              <div className="border-t border-slate-200 pt-6 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xl font-bold text-slate-900">{daysFreed}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">days/week freed</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{hoursYear}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">hours/year</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{fte}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">FTE equivalent</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-6 italic font-medium">Time reallocated to higher-value work — not headcount reduction</p>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
          >
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">12–20h</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Admin time saved / week <br/><span className="text-[9px] lowercase opacity-60">for Clinics</span></p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.1, duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
          >
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">5–10%</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">More revenue per patient</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
          >
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">20–35%</p>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reduction in patient no-shows</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

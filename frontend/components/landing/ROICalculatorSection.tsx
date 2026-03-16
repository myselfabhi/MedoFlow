'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp } from 'lucide-react';

export function ROICalculatorSection() {
  const [staff, setStaff] = useState(3);
  const [hours, setHours] = useState(15);

  // Simple mock calculation logic to make it interactive if desired,
  // but we can stick to static visual based on the image for now.
  const calcSavings = staff * hours * 52 * 15; // Rough heuristic for visual

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
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100">
          <div className="grid md:grid-cols-2 gap-10">
            
            {/* Left: Inputs */}
            <div className="space-y-8">
              {/* Staff Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                    <Users className="w-4 h-4 text-slate-400" />
                    Admin Staff
                  </div>
                  <span className="text-xl font-bold font-display text-slate-900">{staff}</span>
                </div>
                {/* Mock Slider Track */}
                <div className="relative w-full h-1.5 bg-slate-100 rounded-full mt-2">
                  <div className="absolute left-0 top-0 h-full bg-accent rounded-full w-[15%]" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-4 h-4 bg-white border-2 border-accent rounded-full shadow cursor-grab" />
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>1 person</span>
                  <span>20 people</span>
                </div>
              </div>

              {/* Hours Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Admin Hours/Week <span className="text-[10px] w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 cursor-help">?</span>
                  </div>
                  <span className="text-xl font-bold font-display text-slate-900">{hours}h</span>
                </div>
                {/* Mock Slider Track */}
                <div className="relative w-full h-1.5 bg-slate-100 rounded-full mt-2">
                  <div className="absolute left-0 top-0 h-full bg-accent rounded-full w-[40%]" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-[40%] w-4 h-4 bg-white border-2 border-accent rounded-full shadow cursor-grab" />
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>5 hours</span>
                  <span>30 hours</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">i</div>
                <div>
                  <span className="font-medium text-slate-700 block mb-0.5">How we calculate this</span>
                  Based on US healthcare admin wages ($22–$28/hr avg) and 60% automation across scheduling, intake, follow-ups, and commerce tasks.
                </div>
              </div>
            </div>

            {/* Right: Output */}
            <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200 text-center flex flex-col justify-center">
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-1">Admin Capacity Freed Annually</p>
              <h3 className="text-4xl font-bold font-display text-slate-900 mb-1">$35,100</h3>
              <p className="text-[10px] text-slate-400 mb-6 uppercase tracking-wider">worth of time reallocated to patient care</p>

              <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">3.4</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">days/week freed</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">1,404</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">hours/year</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">0.68</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">FTE equivalent</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 mt-5">Time reallocated to higher-value work — not headcount reduction</p>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">12–20h</p>
            <p className="text-xs text-slate-500">Admin time saved / week <br/><span className="text-[9px] text-slate-400 uppercase tracking-wider">for Clinics</span></p>
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">5–10%</p>
            <p className="text-xs text-slate-500">More revenue per patient</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-slate-900 mb-1">20–35%</p>
            <p className="text-xs text-slate-500">Reduction in patient no-shows</p>
          </div>
        </div>

      </div>
    </section>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText } from 'lucide-react';

export function TrustBanner() {
  return (
    <section className="py-16 bg-[#fafafa] border-b border-slate-100">
      <div className="container mx-auto px-4">
        {/* Security Features */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-12">
          <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium">
            <Shield className="h-4 w-4 text-slate-400" />
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>SOC2 Type II</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>256-bit Encryption</span>
          </div>
        </div>

        {/* Trusted By text */}
        <div className="text-center space-y-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Trusted by forward-thinking practices across the country
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-lg font-display font-bold text-slate-200/80">
            <span>Vitality Medical</span>
            <span>Evergreen Clinic</span>
            <span>Summit Health</span>
            <span>Wellness Partners</span>
            <span>Horizon Care</span>
          </div>
        </div>
      </div>
    </section>
  );
}

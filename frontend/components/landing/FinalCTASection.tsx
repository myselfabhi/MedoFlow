'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export function FinalCTASection() {
  return (
    <section id="demo" className="py-28 bg-[#fafafa] relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-primary/[0.04] blur-[80px]" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-card text-[11px] font-semibold tracking-wide text-slate-600 mb-8">
              No credit card required
            </div>

            <h2 className="text-4xl md:text-6xl font-bold font-display text-slate-900 tracking-tight mb-6">
              Ready to{' '}
              <span className="ai-gradient-text">transform</span>
              <br />
              your practice?
            </h2>

            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
              Join forward-thinking practices already running on Medoflow. Start free, scale when ready.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppButton size="lg" className="h-14 px-10 rounded-full text-base font-semibold ai-gradient-bg text-white hover:opacity-90 shadow-glow-lg transition-all duration-300" asChild>
                <Link href="/register">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </AppButton>
              <AppButton variant="outline" size="lg" className="h-14 px-10 rounded-full text-base font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-card" asChild>
                <Link href="#demo">
                  Book a Demo
                </Link>
              </AppButton>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 mt-12 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                HIPAA Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                SOC2 Type II
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                99.9% Uptime
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

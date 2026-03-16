'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { ArrowRight } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="py-24 bg-[#fafafa]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-primary mb-4">
          Ready to modernize?
        </h2>
        <p className="text-base text-slate-500 mb-8 max-w-xl mx-auto">
          Join forward-thinking practices already running on Medoflow
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <AppButton size="lg" className="px-8 h-12 text-sm font-medium" asChild>
            <Link href="#demo">
              Book a Demo <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </AppButton>
          <AppButton variant="outline" size="lg" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary px-8 h-12 text-sm font-medium" asChild>
            <Link href="/register">
              Start Free Trial
            </Link>
          </AppButton>
        </div>
      </div>
    </section>
  );
}

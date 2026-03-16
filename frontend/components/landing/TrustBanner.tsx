'use client';

import React from 'react';
import { ScrollReveal } from './ScrollReveal';

const specialties = [
  'Primary Care',
  'Dermatology',
  'Mental Health',
  'Orthopedics',
  'Pediatrics',
  'Cardiology',
  'Med Spas',
  'Wellness Clinics',
  'Internal Medicine',
  'Neurology',
];

export function TrustBanner() {
  // Double the list for seamless marquee
  const doubled = [...specialties, ...specialties];

  return (
    <section className="py-14 bg-white border-y border-slate-100 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <ScrollReveal>
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">
            Trusted by forward-thinking practices across every specialty
          </p>
        </ScrollReveal>
      </div>

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex animate-marquee">
          {doubled.map((name, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-6 px-6 py-3 rounded-full border border-slate-100 bg-slate-50/50 text-sm font-display font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-white transition-all duration-300 cursor-default"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

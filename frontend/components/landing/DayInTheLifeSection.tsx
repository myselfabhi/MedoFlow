'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Mic, CreditCard, ArrowRight } from 'lucide-react';

const steps = [
  {
    time: '08:00 AM',
    title: 'Prep',
    description:
      'AI summarizes history, allergies, and last visits before the first appointment begins.',
    outcome: 'Ready before opening hour',
    icon: BrainCircuit,
  },
  {
    time: '10:30 AM',
    title: 'The Visit',
    description:
      'Voice-driven notes capture the encounter while Medoflow drafts structured SOAP documentation.',
    outcome: 'Documentation completed in-session',
    icon: Mic,
  },
  {
    time: '10:50 AM',
    title: 'Checkout',
    description:
      'Payment, product purchase, and follow-up booking happen in one connected checkout flow.',
    outcome: 'Patient leaves fully set',
    icon: CreditCard,
  },
];

export function DayInTheLifeSection() {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary"
          >
            Clinical Flow
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 font-display text-3xl font-bold text-primary md:text-5xl"
          >
            A calmer day, by design
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-base text-slate-500 md:text-lg"
          >
            One workflow from prep to payment with less context switching and
            fewer handoffs.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.05] text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {step.time}
                  </p>
                </div>

                <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700">
                  {step.outcome}
                </div>

                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                    <div className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

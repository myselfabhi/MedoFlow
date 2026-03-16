'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  CheckCircle2,
  DollarSign,
  Truck,
  Calendar as CalendarIcon,
  FileText,
  Sparkles,
  ShieldCheck,
  BellRing,
  CreditCard,
} from 'lucide-react';

export function BentoGridSection() {
  const [typedText, setTypedText] = useState('');
  const fullText =
    'SOAP complete: pain down 30%, mobility improved, home protocol sent.';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 34);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFC_100%)] py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-primary"
          >
            One Platform. Zero Handoffs.
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 font-display text-3xl font-bold leading-tight text-primary md:text-5xl"
          >
            From first booking to final payment, every workflow moves in sync
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-base leading-relaxed text-slate-500 md:text-lg"
          >
            Capture notes, automate scheduling, engage patients, and collect
            payments from the same connected workflow.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-6xl auto-rows-[320px] grid-cols-1 gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="group relative col-span-1 overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFAFA] p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2"
          >
            <div className="relative z-10">
              <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
                AI Scribe
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                Speak naturally during consultations while Medoflow drafts SOAP
                notes, structures clinical details, and prepares follow-up tasks
                in real time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Live transcription',
                  'SOAP auto-draft',
                  'HIPAA aligned',
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <Mic className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1E3A5F]">
                    Listening
                  </span>
                </div>
                <div className="mb-4 flex h-8 items-center gap-1.5">
                  {[1, 2, 3, 4, 2, 5, 3, 2, 4, 2, 3, 1].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, h * 5, 8] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: 'easeInOut',
                      }}
                      className="w-1.5 rounded-full bg-slate-200"
                    />
                  ))}
                </div>
                <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Auto-transcribing
                  </p>
                  <p className="min-h-[1.5em] text-[11px] font-semibold leading-relaxed text-slate-700">
                    {typedText}
                    <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-primary align-middle" />
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Generated Outputs
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  SOAP note drafted
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs font-semibold text-slate-700">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Follow-up plan suggested
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Audit-friendly timeline stored
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="group relative row-span-1 flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFAFA] p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:row-span-2"
          >
            <div className="mb-6">
              <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
                Patient App
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Give patients a clean mobile experience for booking, forms,
                reminders, and payments without extra apps.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Self-booking', 'Intake forms', 'Reminders'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto h-[360px] w-44 rounded-[2.5rem] border-4 border-slate-800 bg-primary p-2 shadow-2xl"
            >
              <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-slate-50">
                <div className="absolute left-1/2 top-0 z-20 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-slate-800" />
                <div className="bg-primary px-4 pb-4 pt-6 text-white">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                    Medoflow
                  </p>
                </div>
                <div className="flex-1 space-y-3 p-3">
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                    <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <CalendarIcon className="h-3 w-3 text-primary" />
                    </div>
                    <div className="mb-1 h-1.5 w-12 rounded bg-slate-100" />
                    <div className="h-1.5 w-16 rounded bg-slate-100" />
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-white p-3 shadow-sm">
                    <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-primary">
                      Next appointment
                    </p>
                    <p className="mb-3 text-[10px] font-bold text-slate-900">
                      Tomorrow, 10:30 AM
                    </p>
                    <div className="w-max rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-600">
                      Forms completed
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                      <CreditCard className="h-2.5 w-2.5 text-primary" />
                      Saved payment method
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFAFA] p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div>
              <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
                Commerce
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Turn recommendations into revenue with checkout, order tracking,
                and fulfillment updates built into clinic workflows.
              </p>
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                This Week Collected
              </p>
              <p className="mt-1 text-xl font-black text-emerald-700">$18,420</p>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-900">
                    Payment Received
                  </p>
                  <p className="text-[9px] text-slate-500">
                    $245.00 · Vitamin D Pack
                  </p>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Truck className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-900">
                    Order Fulfilled
                  </p>
                  <p className="text-[9px] text-slate-500">Shipped via USPS</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-[#FAFAFA] p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <div>
              <h3 className="mb-2 font-display text-2xl font-bold text-slate-900">
                Smart Scheduling
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Fill calendars faster with rule-based availability, automated
                reminders, and fewer no-shows.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-100 bg-white p-2.5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Rebook Rate
                </p>
                <p className="mt-1 text-lg font-black text-[#1E3A5F]">+27%</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-2.5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  No-shows
                </p>
                <p className="mt-1 text-lg font-black text-[#1E3A5F]">-18%</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-300">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
              <div className="flex gap-1">
                {[8, 9, 10, 11, 12, 13].map((day) => (
                  <div
                    key={day}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold ${
                      day >= 8 && day <= 11
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400'
                    } ${day === 8 ? 'bg-primary text-white' : ''}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                <BellRing className="h-3 w-3" />
                reminders sent automatically
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

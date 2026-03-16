'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Mic, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export function DayInTheLifeSection() {
  return (
    <section className="py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">Workflow</p>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight mb-4">
              A day in the life{' '}
              <span className="ai-gradient-text">with AI</span>
            </h2>
            <p className="text-lg text-slate-500">
              See how Medoflow transforms your typical workday
            </p>
          </ScrollReveal>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 max-w-6xl mx-auto">

          {/* Left: Phone mockup */}
          <ScrollReveal direction="left" className="relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-[280px] h-[540px] bg-slate-900 rounded-[2.5rem] border-[10px] border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-20" />

                <div className="w-full h-full bg-slate-900 flex flex-col pt-8">
                  <div className="px-6 pb-5 border-b border-white/5 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold font-display text-white">Medoflow</h3>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Dashboard</p>
                    </div>
                    <p className="text-[10px] font-bold text-white/60 uppercase">10:30 AM</p>
                  </div>

                  <div className="px-4 py-4">
                    <div className="bg-white flex rounded-xl overflow-hidden shadow-sm">
                      <TabItem label="Patients" value="12" active />
                      <TabItem label="Tasks" value="5" />
                      <TabItem label="Messages" value="3" />
                    </div>
                  </div>

                  <div className="flex-1 bg-white rounded-t-[2rem] mt-2 p-5 space-y-4 overflow-hidden">
                    <ListItem name="Sarah M." time="8:30 AM" tag="Follow-up" status="done" />
                    <ListItem name="James R." time="10:00 AM" tag="Annual Physical" status="current" />
                    <ListItem name="Emily W." time="10:30 AM" tag="Lab Review" status="waiting" />
                    <ListItem name="Maria L." time="11:15 AM" tag="Consultation" status="upcoming" />
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-accent/[0.06] blur-[80px] -z-10 rounded-full" />
          </ScrollReveal>

          {/* Right: Timeline */}
          <div className="flex-1 max-w-md relative">
            <div className="absolute left-[1.15rem] top-10 bottom-10 w-px bg-gradient-to-b from-accent/20 via-slate-200 to-slate-100" />

            <div className="space-y-14">
              <TimelineItem
                icon={<BrainCircuit />}
                time="08:00 AM"
                title="AI Prep"
                desc="AI prepares patient summaries before you start. Histories, allergies, and last visit notes — all ready when you arrive."
                accent
                delay={0}
              />
              <TimelineItem
                icon={<Mic />}
                time="10:30 AM"
                title="The Visit"
                desc="Voice-to-text charting captures every detail. Speak naturally, and Medoflow handles the documentation in real-time."
                delay={0.1}
              />
              <TimelineItem
                icon={<CreditCard />}
                time="10:50 AM"
                title="Checkout"
                desc="Patients pay securely, order from your clinic store, and book follow-ups — all in seconds. They leave happy."
                delay={0.2}
              />
              <TimelineItem
                icon={<Clock />}
                time="05:00 PM"
                title="Day Complete"
                desc="Zero charts left to finish. Revenue tracked automatically. Tomorrow's AI prep is already running."
                delay={0.3}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TabItem({ label, value, active = false }: any) {
  return (
    <div className={`flex-1 py-2.5 text-center ${active ? 'bg-white' : 'bg-slate-50 border-l border-slate-100'}`}>
      <p className="text-base font-bold text-slate-900 font-display leading-none">{value}</p>
      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function ListItem({ name, time, tag, status }: { name: string; time: string; tag: string; status: string }) {
  const statusColors: Record<string, string> = {
    done: 'bg-emerald-500',
    current: 'bg-accent',
    waiting: 'bg-amber-400',
    upcoming: 'bg-slate-200',
  };

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 border-b border-slate-50 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{time} · {tag}</p>
          </div>
          <div className={`w-2 h-2 rounded-full mt-1 ${statusColors[status]}`} />
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ icon, time, title, desc, accent = false, delay = 0 }: any) {
  return (
    <ScrollReveal direction="right" delay={delay}>
      <div className="relative pl-12">
        <div className={`absolute left-0 top-1 w-9 h-9 rounded-xl border flex items-center justify-center z-10 ${accent ? 'ai-gradient-bg border-transparent text-white shadow-glow' : 'bg-white border-slate-200 text-slate-400'}`}>
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </div>
        <p className={`text-[10px] font-bold mb-1.5 tracking-widest uppercase ${accent ? 'text-accent' : 'text-slate-400'}`}>{time}</p>
        <h4 className="text-lg font-bold text-slate-900 mb-2 font-display">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </ScrollReveal>
  );
}

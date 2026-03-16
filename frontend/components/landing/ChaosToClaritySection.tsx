'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Mail, CreditCard, Database, Activity, MessagesSquare, FileText, ShoppingBag, Users, BarChart } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { AnimatedCounter } from './AnimatedCounter';

export function ChaosToClaritySection() {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <section className="py-28 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <ScrollReveal>
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-4">Transformation</p>
            <h2 className="text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight mb-4">
              From chaos to{' '}
              <span className="ai-gradient-text">clarity</span>
            </h2>
            <p className="text-lg text-slate-500">
              See the difference a unified platform makes
            </p>
          </ScrollReveal>
        </div>

        {/* Toggle */}
        <ScrollReveal>
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-card">
              <button
                onClick={() => setShowAfter(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${!showAfter ? 'ai-gradient-bg text-white shadow-glow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Before
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${showAfter ? 'ai-gradient-bg text-white shadow-glow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                After
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Comparison */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!showAfter ? (
              <motion.div
                key="before"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-white rounded-3xl p-10 border border-slate-100 shadow-card relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest">Before Medoflow</span>
                    <h3 className="text-2xl font-bold font-display text-slate-900 mt-4">The Integration Tax</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                      Fragmented tools waste hours every week and create gaps in patient care.
                    </p>
                  </div>
                </div>

                {/* Scattered icons representing chaos */}
                <div className="relative h-64 w-full mt-4">
                  <ScatteredIcon icon={<Mail />} top="5%" left="10%" delay={0} />
                  <ScatteredIcon icon={<Calendar />} top="10%" right="20%" delay={1} />
                  <ScatteredIcon icon={<Database />} bottom="20%" right="10%" delay={0.5} />
                  <ScatteredIcon icon={<CreditCard />} bottom="10%" left="25%" delay={1.5} />
                  <ScatteredIcon icon={<Activity />} top="40%" left="45%" delay={0.8} />
                  {/* Dashed connection lines to show disconnection */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-dashed border-red-200/40 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-dashed border-red-200/20 rounded-full" />
                </div>

                {/* Pain point metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { label: 'Tools to manage', value: '6+', color: 'text-red-500' },
                    { label: 'Hours wasted / week', value: '15', color: 'text-red-500' },
                    { label: 'Data sync errors', value: 'Daily', color: 'text-red-500' },
                  ].map((m, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-red-50/50 border border-red-100/50">
                      <p className={`text-2xl font-bold font-display ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-white rounded-3xl p-10 border border-slate-100 shadow-card relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">With Medoflow</span>
                    <h3 className="text-2xl font-bold font-display text-slate-900 mt-4">One Unified Platform</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                      Everything in sync. Zero integration headaches. Pure focus on patient care.
                    </p>
                  </div>
                </div>

                {/* Orbital diagram */}
                <div className="relative h-64 w-full flex items-center justify-center mt-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute w-16 h-16 ai-gradient-bg rounded-full flex items-center justify-center text-white font-bold text-2xl font-display shadow-glow-lg z-20"
                  >
                    M
                  </motion.div>

                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} className="absolute w-36 h-36 border border-accent/10 rounded-full" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }} className="absolute w-56 h-56 border border-accent/5 rounded-full" />

                  <OrbitNode icon={<Users />} label="Patients" angle={-90} radius={65} delay={0.2} />
                  <OrbitNode icon={<Calendar />} label="Scheduling" angle={-160} radius={95} delay={0.3} />
                  <OrbitNode icon={<MessagesSquare />} label="Messaging" angle={160} radius={95} delay={0.4} />
                  <OrbitNode icon={<FileText />} label="Charting" angle={110} radius={115} delay={0.5} />
                  <OrbitNode icon={<ShoppingBag />} label="Commerce" angle={50} radius={115} delay={0.6} />
                  <OrbitNode icon={<CreditCard />} label="Payments" angle={20} radius={95} delay={0.7} />
                  <OrbitNode icon={<BarChart />} label="Analytics" angle={-30} radius={115} delay={0.8} />

                  <div className="absolute inset-0 bg-accent/[0.03] blur-[60px] rounded-full z-0" />
                </div>

                {/* Improvement metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { label: 'Single platform', value: 1, suffix: '', color: 'text-accent' },
                    { label: 'Hours saved / week', value: 15, suffix: '+', color: 'text-accent' },
                    { label: 'Sync errors', value: 0, suffix: '', color: 'text-accent' },
                  ].map((m, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-accent/5 border border-accent/10">
                      <p className={`text-2xl font-bold font-display ${m.color}`}>
                        <AnimatedCounter target={m.value} suffix={m.suffix} />
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ScatteredIcon({ icon, top, left, right, bottom, delay }: any) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
      className="absolute p-3 bg-white border border-slate-100 shadow-glass rounded-xl"
      style={{ top, left, right, bottom }}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 text-slate-400' })}
    </motion.div>
  );
}

function OrbitNode({ icon, label, angle, radius, delay }: { icon: React.ReactNode; label: string; angle: number; radius: number; delay: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
      className="absolute flex flex-col items-center gap-1.5 z-10"
    >
      <div className="w-9 h-9 bg-white border border-slate-100 rounded-full shadow-card flex items-center justify-center text-accent">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <span className="text-[9px] font-bold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

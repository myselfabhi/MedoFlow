'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, CreditCard, Database, Activity, MessagesSquare, FileText, ShoppingBag, Users, BarChart } from 'lucide-react';

export function ChaosToClaritySection() {
  return (
    <section className="py-24 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold font-display text-primary mb-3"
          >
            From chaos to clarity
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-slate-500"
          >
            See the difference a unified platform makes for your practice
          </motion.p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before: The Integration Tax */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden min-h-[400px]"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-display text-slate-900">The Integration Tax</h3>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest">Before</span>
            </div>
            <p className="text-sm text-slate-500 mb-10 leading-relaxed">
              Fragmented tools waste hours every week and create gaps in patient care.
            </p>

            {/* Scattered Icons */}
            <div className="relative h-56 w-full mt-10">
              <ScatteredIcon icon={<Mail />} top="10%" left="15%" delay={0} />
              <ScatteredIcon icon={<Calendar />} top="15%" right="15%" delay={1} />
              <ScatteredIcon icon={<Database />} bottom="25%" right="10%" delay={0.5} />
              <ScatteredIcon icon={<CreditCard />} bottom="5%" right="25%" delay={1.5} />
              <div className="absolute top-1/2 left-1/4 p-4 border border-dashed border-slate-200 rounded-2xl opacity-40">
                <Activity className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </motion.div>

          {/* After: The Medoflow Way */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px]"
          >
            <div className="flex justify-between items-start mb-4 relative z-20">
              <h3 className="text-xl font-bold font-display text-primary">The Medoflow Way</h3>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">After</span>
            </div>
            <p className="text-sm text-slate-600 mb-10 relative z-20 leading-relaxed">
              Everything in sync. One platform. Zero integration headaches.
            </p>

            {/* Orbital Diagram */}
            <div className="relative h-64 w-full flex items-center justify-center mt-6">
              {/* Center Node - with glow shadow */}
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
                className="absolute w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_0_40px_-10px_rgba(30,58,95,0.4)] z-20"
              >
                M
              </motion.div>

              {/* Rings with subtle rotation */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 border border-slate-200/50 rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                className="absolute w-60 h-60 border border-slate-200/30 rounded-full"
              />
              <div className="absolute w-80 h-80 border border-slate-100/20 rounded-full" />

              {/* Nodes on rings */}
              <OrbitNode icon={<Users />} label="Patients" angle={-90} radius={70} delay={0.2} />
              <OrbitNode icon={<Calendar />} label="Scheduling" angle={-160} radius={100} delay={0.3} />
              <OrbitNode icon={<MessagesSquare />} label="Messaging" angle={160} radius={100} delay={0.4} />
              <OrbitNode icon={<FileText />} label="Charting" angle={110} radius={120} delay={0.5} />
              <OrbitNode icon={<ShoppingBag />} label="Commerce" angle={50} radius={120} delay={0.6} />
              <OrbitNode icon={<CreditCard />} label="Payments" angle={20} radius={100} delay={0.7} />
              <OrbitNode icon={<BarChart />} label="Analytics" angle={-30} radius={120} delay={0.8} />

              <div className="absolute inset-0 bg-primary/5 blur-[60px] rounded-full z-0" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ScatteredIcon({ icon, top, left, right, bottom, delay }: any) {
  return (
    <motion.div 
      animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
      className="absolute p-3 bg-white border border-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-xl"
      style={{ top, left, right, bottom }}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 text-slate-400' })}
    </motion.div>
  );
}

function OrbitNode({ icon, label, angle, radius, delay }: { icon: React.ReactNode, label: string, angle: number, radius: number, delay: number }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      whileInView={{ opacity: 1, scale: 1, x, y }}
      viewport={{ once: true }}
      transition={{ 
        delay, 
        duration: 0.6, 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      className="absolute flex flex-col items-center gap-1.5 z-10"
    >
      <div className="w-8 h-8 bg-white border border-slate-100 rounded-full shadow-sm flex items-center justify-center text-primary">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
      </div>
      <span className="text-[9px] font-bold text-slate-500 bg-white/60 px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}

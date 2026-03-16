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
          <h2 className="text-3xl md:text-4xl font-bold font-display text-primary mb-3">
            From chaos to clarity
          </h2>
          <p className="text-base text-slate-500">
            See the difference a unified platform makes for your practice
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before: The Integration Tax */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden min-h-[400px]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-display text-slate-900">The Integration Tax</h3>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider">Before</span>
            </div>
            <p className="text-sm text-slate-500 mb-10">
              Fragmented tools waste hours every week and create gaps in patient care.
            </p>

            {/* Scattered Icons */}
            <div className="relative h-64 w-full">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 left-4 p-4 bg-white border border-slate-100 shadow-md rounded-2xl"
              >
                <Mail className="h-6 w-6 text-slate-400" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-12 right-12 p-4 bg-white border border-slate-100 shadow-md rounded-2xl"
              >
                <Calendar className="h-6 w-6 text-slate-400" />
              </motion.div>

              <motion.div 
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-12 right-4 p-4 bg-white border border-slate-100 shadow-md rounded-2xl"
              >
                <Database className="h-6 w-6 text-slate-400" />
              </motion.div>

              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-4 right-16 p-4 bg-white border border-slate-100 shadow-md rounded-2xl z-10"
              >
                <CreditCard className="h-6 w-6 text-slate-400" />
              </motion.div>

              {/* Broken connection line */}
              <div className="absolute top-1/2 left-1/4 p-4 border border-dashed border-slate-200 rounded-2xl">
                <Activity className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </div>

          {/* After: The Medoflow Way */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px]">
            <div className="flex justify-between items-start mb-4 relative z-20">
              <h3 className="text-xl font-bold font-display text-primary">The Medoflow Way</h3>
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">After</span>
            </div>
            <p className="text-sm text-slate-600 mb-10 relative z-20">
              Everything in sync. One platform. Zero integration headaches.
            </p>

            {/* Orbital Diagram */}
            <div className="relative h-64 w-full flex items-center justify-center">
              {/* Center Node */}
              <div className="absolute w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl z-20">
                M
              </div>

              {/* Rings */}
              <div className="absolute w-48 h-48 border border-slate-200 rounded-full" />
              <div className="absolute w-72 h-72 border border-slate-200 rounded-full" />
              <div className="absolute w-96 h-96 border border-slate-100 rounded-full" />

              {/* Nodes on rings */}
              <OrbitNode icon={<Users />} label="Patients" angle={-90} radius={80} delay={0} />
              <OrbitNode icon={<Calendar />} label="Scheduling" angle={-160} radius={110} delay={0.2} />
              <OrbitNode icon={<MessagesSquare />} label="Messaging" angle={160} radius={110} delay={0.4} />
              <OrbitNode icon={<FileText />} label="Charting" angle={110} radius={130} delay={0.6} />
              <OrbitNode icon={<ShoppingBag />} label="Commerce" angle={50} radius={130} delay={0.8} />
              <OrbitNode icon={<CreditCard />} label="Payments" angle={20} radius={110} delay={1.0} />
              <OrbitNode icon={<BarChart />} label="Analytics" angle={-30} radius={130} delay={1.2} />

              <div className="absolute inset-0 bg-accent/5 blur-[80px] rounded-full z-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper component for orbital nodes
function OrbitNode({ icon, label, angle, radius, delay }: { icon: React.ReactNode, label: string, angle: number, radius: number, delay: number }) {
  // Convert angle to radians
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: delay, duration: 0.5, type: 'spring' }}
      className="absolute flex flex-col items-center gap-2 z-10"
      style={{ 
        transform: `translate(${x}px, ${y}px)` 
      }}
    >
      <div className="w-10 h-10 bg-white border border-slate-100 rounded-full shadow-sm flex items-center justify-center text-accent">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <span className="text-[10px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm">{label}</span>
    </motion.div>
  );
}

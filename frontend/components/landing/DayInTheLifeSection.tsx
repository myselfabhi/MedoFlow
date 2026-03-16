'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Mic, CreditCard } from 'lucide-react';

export function DayInTheLifeSection() {
  return (
    <section className="py-24 bg-[#fafafa]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-primary mb-3">
            A day in the life
          </h2>
          <p className="text-base text-slate-500">
            See how Medoflow transforms your typical workday
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 max-w-5xl mx-auto">
          
          {/* Left: Mobile App Mockup (Dark Mode) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="w-[300px] h-[550px] bg-[#1E2530] rounded-[2.5rem] border-[10px] border-[#151a22] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#151a22] rounded-b-2xl z-20" />
              
              {/* Mobile App Screen */}
              <div className="w-full h-full bg-[#1E2530] flex flex-col pt-8">
                {/* Header */}
                <div className="px-6 pb-6 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold font-display text-white">Medoflow</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Dashboard</p>
                  </div>
                  <p className="text-xs font-medium text-white">10:30 AM</p>
                </div>
                
                {/* Tabs */}
                <div className="px-4 py-4">
                  <div className="bg-white flex rounded-xl overflow-hidden shadow-sm">
                    <div className="flex-1 bg-white py-3 text-center border-r border-slate-100">
                      <p className="text-lg font-bold text-slate-900 font-display leading-none">12</p>
                      <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Patients</p>
                    </div>
                    <div className="flex-1 bg-slate-50 py-3 text-center border-r border-slate-100">
                      <p className="text-lg font-bold text-slate-900 font-display leading-none">5</p>
                      <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Tasks</p>
                    </div>
                    <div className="flex-1 bg-slate-50 py-3 text-center">
                      <p className="text-lg font-bold text-slate-900 font-display leading-none">3</p>
                      <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Messages</p>
                    </div>
                  </div>
                </div>

                {/* List */}
                <div className="flex-1 bg-white rounded-t-3xl mt-2 p-6 space-y-6 overflow-hidden">
                  {[
                    { name: 'Sarah M.', time: '8:30 AM · Follow-up', status: 'done', color: 'bg-emerald-500' },
                    { name: 'James R.', time: '10:00 AM · Annual Physical', status: 'current', color: 'bg-slate-200' },
                    { name: 'Emily W.', time: '10:30 AM · Lab Review', status: 'waiting', color: 'bg-slate-200' },
                  ].map((p, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-500">{p.time}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Subtle glow behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-slate-200/50 blur-[80px] -z-10 rounded-full" />
          </motion.div>

          {/* Right: Timeline */}
          <div className="flex-1 max-w-md relative">
            {/* Connecting Line */}
            <div className="absolute left-[1.15rem] top-8 bottom-8 w-px bg-slate-200" />

            <div className="space-y-12">
              {/* Item 1 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center z-10">
                  <BrainCircuit className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[10px] font-bold text-accent mb-1 tracking-widest uppercase">08:00 AM</p>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Prep</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  AI prepares patient summaries before you start. You review and approve each summary before use. Histories, allergies, and last visit notes, all ready when you arrive.
                </p>
              </motion.div>

              {/* Item 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2 }}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center z-10">
                  <Mic className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[10px] font-bold text-primary mb-1 tracking-widest uppercase">10:30 AM</p>
                <h4 className="text-lg font-bold text-slate-900 mb-2">The Visit</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Voice-to-text charting captures every detail. Speak naturally, and Medoflow handles the documentation.
                </p>
              </motion.div>

              {/* Item 3 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.4 }}
                className="relative pl-12"
              >
                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center z-10">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[10px] font-bold text-primary mb-1 tracking-widest uppercase">10:50 AM</p>
                <h4 className="text-lg font-bold text-slate-900 mb-2">Checkout</h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Patients order from your clinic-branded storefront, pay securely, and receive shipping updates. Follow-up booked in seconds. They leave happy, you're ready for the next.
                </p>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

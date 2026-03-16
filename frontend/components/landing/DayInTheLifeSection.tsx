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
          
          {/* Left: Mobile App Mockup (Dark Mode) - with subtle float */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="w-[280px] h-[520px] bg-[#1E2530] rounded-[2.5rem] border-[10px] border-[#151a22] shadow-glass overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#151a22] rounded-b-2xl z-20" />
              
              <div className="w-full h-full bg-[#1E2530] flex flex-col pt-8">
                <div className="px-6 pb-6 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold font-display text-white">Medoflow</h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Dashboard</p>
                  </div>
                  <p className="text-[10px] font-bold text-white opacity-60 uppercase">10:30 AM</p>
                </div>
                
                <div className="px-4 py-4">
                  <div className="bg-white flex rounded-xl overflow-hidden shadow-sm">
                    <TabItem label="Patients" value="12" active />
                    <TabItem label="Tasks" value="5" />
                    <TabItem label="Messages" value="3" />
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-t-[2rem] mt-2 p-5 space-y-5 overflow-hidden">
                  <ListItem name="Sarah M." time="8:30 AM · Follow-up" status="done" color="bg-emerald-500" />
                  <ListItem name="James R." time="10:00 AM · Annual Physical" status="current" color="bg-slate-200" />
                  <ListItem name="Emily W." time="10:30 AM · Lab Review" status="waiting" color="bg-slate-200" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-slate-200/30 blur-[80px] -z-10 rounded-full" />
          </motion.div>

          {/* Right: Timeline */}
          <div className="flex-1 max-w-md relative">
            <div className="absolute left-[1.15rem] top-8 bottom-8 w-px bg-slate-200" />

            <div className="space-y-12">
              <TimelineItem 
                icon={<BrainCircuit />} 
                time="08:00 AM" 
                title="Prep" 
                desc="AI prepares patient summaries before you start. You review and approve each summary before use. Histories, allergies, and last visit notes, all ready when you arrive." 
                accent
              />
              <TimelineItem 
                icon={<Mic />} 
                time="10:30 AM" 
                title="The Visit" 
                desc="Voice-to-text charting captures every detail. Speak naturally, and Medoflow handles the documentation." 
              />
              <TimelineItem 
                icon={<CreditCard />} 
                time="10:50 AM" 
                title="Checkout" 
                desc="Patients order from your clinic-branded storefront, pay securely, and receive shipping updates. Follow-up booked in seconds. They leave happy, you're ready for the next." 
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

function ListItem({ name, time, color }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 border-b border-slate-50 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{time}</p>
          </div>
          <div className={`w-1.5 h-1.5 rounded-full mt-1 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ icon, time, title, desc, accent = false, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.6, 1] }}
      className="relative pl-12"
    >
      <div className={`absolute left-0 top-1 w-9 h-9 rounded-xl border flex items-center justify-center z-10 ${accent ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white border-slate-200 text-slate-400'}`}>
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </div>
      <p className={`text-[10px] font-bold mb-1 tracking-widest uppercase ${accent ? 'text-accent' : 'text-slate-400'}`}>{time}</p>
      <h4 className="text-lg font-bold text-slate-900 mb-2 font-display">{title}</h4>
      <p className="text-slate-500 text-xs leading-relaxed font-medium">
        {desc}
      </p>
    </motion.div>
  );
}

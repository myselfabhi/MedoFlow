'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  CreditCard, 
  Activity, 
  ShieldCheck, 
  Stethoscope 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ClinicalHeroAnimation() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.5,
      },
    },
  };

  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -15, 0],
      transition: {
        duration: 3 + i,
        repeat: Infinity,
        ease: "easeInOut",
      },
    }),
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background organic blob */}
      <motion.div 
        className="absolute w-[80%] h-[80%] bg-primary-100/40 rounded-[40% 60% 70% 30% / 40% 50% 60% 50%] blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Main Scene: Doctor & Patient Illustration */}
      <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center">
        {/* Minimalist SVG Illustration of Consultation */}
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
          {/* Patient */}
          <motion.path
            d="M100,300 Q120,200 150,250 T200,300"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="150"
            cy="200"
            r="30"
            fill="#E2E8F0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          />

          {/* Doctor */}
          <motion.path
            d="M300,300 Q280,180 250,220 T200,280"
            fill="none"
            stroke="#2563EB"
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
          <motion.circle
            cx="250"
            cy="180"
            r="30"
            fill="#DBEAFE"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          />

          {/* AI Scribe Tablet */}
          <motion.rect
            x="210"
            y="230"
            width="40"
            height="60"
            rx="4"
            fill="white"
            stroke="#2563EB"
            strokeWidth="2"
            initial={{ opacity: 0, rotate: -15 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 1.5 }}
          />
          {/* Animated lines on tablet */}
          {[245, 255, 265, 275].map((y, i) => (
            <motion.line
              key={i}
              x1="218"
              y1={y}
              x2="242"
              y2={y}
              stroke="#DBEAFE"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2 + (i * 0.2), duration: 0.5 }}
            />
          ))}
        </svg>

        {/* Floating Operational Elements */}
        
        {/* Appointment Card */}
        <motion.div
          custom={0}
          variants={floatingVariants}
          animate="animate"
          className="absolute -top-4 -left-4"
        >
          <motion.div 
            variants={cardVariants}
            className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-48"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Schedule</p>
              <p className="text-xs font-bold text-slate-900 leading-none">9:00 AM Today</p>
            </div>
          </motion.div>
        </motion.div>

        {/* AI Note Generated Card */}
        <motion.div
          custom={1}
          variants={floatingVariants}
          animate="animate"
          className="absolute top-1/4 -right-12"
        >
          <motion.div 
            variants={cardVariants}
            className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-52"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">AI Scribe</p>
              <p className="text-xs font-bold text-slate-900 leading-none">Note Generated</p>
            </div>
            <motion.div 
              className="ml-auto"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Payment Card */}
        <motion.div
          custom={2}
          variants={floatingVariants}
          animate="animate"
          className="absolute bottom-4 -left-8"
        >
          <motion.div 
            variants={cardVariants}
            className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-44"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Revenue</p>
              <p className="text-xs font-bold text-slate-900 leading-none">$210.00 Paid</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Vital/Security Bubble */}
        <motion.div
          custom={3}
          variants={floatingVariants}
          animate="animate"
          className="absolute -bottom-8 right-4"
        >
          <motion.div 
            variants={cardVariants}
            className="bg-slate-900 p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Activity className="h-4 w-4 text-primary-400" />
            </motion.div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Secure Link Active</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

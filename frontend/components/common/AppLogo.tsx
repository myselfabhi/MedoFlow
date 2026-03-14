'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'primary';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AppLogo({ 
  className, 
  variant = 'primary', 
  showText = true,
  size = 'md' 
}: AppLogoProps) {
  
  const sizeMap = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
    xl: { icon: 64, text: 'text-5xl' },
  };

  const colors = {
    primary: {
      textMain: 'text-slate-900',
      textAccent: 'text-primary-600',
      markMain: '#2563EB', // primary-600
      markAccent: '#10B981', // emerald-500
    },
    dark: {
      textMain: 'text-slate-900',
      textAccent: 'text-primary-600',
      markMain: '#0F172A', // slate-900
      markAccent: '#2563EB',
    },
    light: {
      textMain: 'text-white',
      textAccent: 'text-white/80',
      markMain: '#FFFFFF',
      markAccent: '#DBEAFE',
    }
  };

  const activeColors = colors[variant];
  const activeSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      {/* The Mark: Geometric M + Flow Wave */}
      <div 
        style={{ width: activeSize.icon, height: activeSize.icon }}
        className="relative shrink-0"
      >
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Geometric M Background */}
          <motion.path
            d="M8 32V12L20 22L32 12V32"
            stroke={activeColors.markMain}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          
          {/* Flow Wave / Pulse Line */}
          <motion.path
            d="M4 24C10 24 12 16 20 16C28 16 30 24 36 24"
            stroke={activeColors.markAccent}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0, x: -5 }}
            animate={{ pathLength: 1, opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          />
          
          {/* Core Dot (Precision) */}
          <motion.circle
            cx="20"
            cy="22"
            r="2.5"
            fill={activeColors.markAccent}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
          />
        </svg>
      </div>

      {/* The Typography */}
      {showText && (
        <motion.div 
          className={cn("flex items-baseline tracking-tighter", activeSize.text)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <span className={cn("font-black", activeColors.textMain)}>
            Medo
          </span>
          <span className={cn("font-light", activeColors.textAccent)}>
            flow
          </span>
          <motion.span 
            className="text-primary-600 font-black ml-px"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            .
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

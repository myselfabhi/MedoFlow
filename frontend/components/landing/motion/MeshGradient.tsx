'use client'

import React from 'react'
import { motion } from 'framer-motion'

type Props = {
  variant?: 'navy' | 'light' | 'mixed'
  className?: string
}

/**
 * Animated mesh gradient — large soft blobs that drift slowly.
 * Used as a section background for depth without being distracting.
 */
export function MeshGradient({ variant = 'navy', className = '' }: Props) {
  const palette =
    variant === 'navy'
      ? {
          a: 'rgba(13, 148, 136, 0.35)',
          b: 'rgba(94, 234, 212, 0.18)',
          c: 'rgba(30, 58, 95, 0.6)',
        }
      : variant === 'light'
        ? {
            a: 'rgba(13, 148, 136, 0.12)',
            b: 'rgba(94, 234, 212, 0.10)',
            c: 'rgba(30, 58, 95, 0.06)',
          }
        : {
            a: 'rgba(13, 148, 136, 0.22)',
            b: 'rgba(94, 234, 212, 0.14)',
            c: 'rgba(30, 58, 95, 0.18)',
          }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full blur-[140px]"
        style={{ backgroundColor: palette.a }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full blur-[140px]"
        style={{ backgroundColor: palette.b }}
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/3 left-1/3 h-[60vh] w-[60vh] rounded-full blur-[160px]"
        style={{ backgroundColor: palette.c }}
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

'use client'

/**
 * FinalCTA — the cinematic close.
 *
 * Scroll-driven reveal: dark frame opens like a doorway, copy ascends from
 * below with letter-stagger, central teal light blooms behind the CTA.
 */

import React, { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { MeshGradient } from './motion/MeshGradient'
import { MagneticButton } from './motion/MagneticButton'
import { useAuthModal } from '@/components/auth/AuthModal'

const words = ['Run', 'your', 'entire', 'practice', 'on', 'a', 'single', 'timeline.']

export function FinalCTASection() {
  const { openLogin } = useAuthModal()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Doorway-opens effect: two dark slabs slide out from center as you scroll in.
  const leftDoorX = useTransform(scrollYProgress, [0.1, 0.55], ['0%', '-105%'])
  const rightDoorX = useTransform(scrollYProgress, [0.1, 0.55], ['0%', '105%'])
  const bloomScale = useTransform(scrollYProgress, [0.2, 0.7], [0.3, 1.3])
  const bloomOpacity = useTransform(scrollYProgress, [0.2, 0.6], [0, 0.55])
  const contentY = useTransform(scrollYProgress, [0.3, 0.7], [60, 0])
  const contentOpacity = useTransform(scrollYProgress, [0.3, 0.7], [0, 1])

  return (
    <section ref={ref} className="relative h-[120vh] min-h-[900px] overflow-hidden bg-[#0B1E35]">
      <MeshGradient variant="navy" />

      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
        aria-hidden
      />

      {/* Sticky inner viewport — content stays centered through scroll */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Central teal bloom */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80vh] w-[80vh] rounded-full"
          style={{
            scale: bloomScale,
            opacity: bloomOpacity,
            background:
              'radial-gradient(circle, rgba(94, 234, 212, 0.55) 0%, rgba(13, 148, 136, 0.25) 30%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          aria-hidden
        />

        {/* The "doors" — two dark slabs that part to reveal the CTA */}
        <motion.div
          className="absolute left-0 top-0 z-[5] h-full w-1/2 border-r border-white/5 bg-[#0B1E35]/95 backdrop-blur-sm"
          style={{ x: leftDoorX }}
          aria-hidden
        />
        <motion.div
          className="absolute right-0 top-0 z-[5] h-full w-1/2 border-l border-white/5 bg-[#0B1E35]/95 backdrop-blur-sm"
          style={{ x: rightDoorX }}
          aria-hidden
        />

        {/* Content */}
        <motion.div
          className="container relative z-10 mx-auto px-6 text-center"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mf-eyebrow mb-6 text-white/60"
          >
            Ready when you are
          </motion.p>

          <h2 className="mf-display mx-auto max-w-5xl text-[clamp(40px,7vw,82px)] leading-[1.02] tracking-[-0.02em] text-white">
            <span className="inline-flex flex-wrap justify-center gap-x-[0.25em]">
              {words.slice(0, 6).map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.7,
                    delay: 0.3 + i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <br />
            <span className="inline-flex flex-wrap justify-center gap-x-[0.25em]">
              {words.slice(6).map((word, i) => (
                <motion.span
                  key={i + 6}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.7,
                    delay: 0.7 + i * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={
                    word === 'timeline.'
                      ? 'bg-gradient-to-r from-[#5EEAD4] via-[#2DD4BF] to-[#5EEAD4] bg-clip-text text-transparent'
                      : ''
                  }
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="mx-auto mt-8 max-w-xl text-[17px] leading-relaxed text-white/70"
          >
            Join 2,400+ clinics already running intake, charting, and billing on MedoFlow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 1.15 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            <MagneticButton
              onClick={openLogin}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-[#0B1E35] shadow-[0_14px_50px_-12px_rgba(94,234,212,0.7)] transition-shadow hover:shadow-[0_18px_60px_-10px_rgba(94,234,212,0.95)]"
            >
              Start free trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
            >
              Book a demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 1.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-white/50"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#5EEAD4]" />
              14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#5EEAD4]" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#5EEAD4]" />
              HIPAA &amp; SOC2 aligned
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

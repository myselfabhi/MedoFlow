'use client'

/**
 * ROICalculatorSection — chapter 7 of the narrative.
 *
 * Role: make it personal. Big animated number front-and-center; the inputs
 * are intentionally secondary so the page reads as an answer, not a form.
 */

import React, { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { Users, Clock, Info, TrendingUp } from 'lucide-react'
import { SectionHeader, fadeUpInView } from './primitives'

// Heuristic: staff × hours/week × $26/hr × 60% automation × 52 weeks.
const calcAnnualValue = (staff: number, hours: number) => Math.round(staff * hours * 26 * 0.6 * 52)

export function ROICalculatorSection() {
  const [staff, setStaff] = useState(4)
  const [hours, setHours] = useState(15)
  const [displayValue, setDisplayValue] = useState(() => calcAnnualValue(4, 15))

  // Spring the headline number to the new target.
  useEffect(() => {
    const controls = animate(displayValue, calcAnnualValue(staff, hours), {
      duration: 0.7,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, hours])

  const productiveHours = staff * hours * 0.6
  const daysFreed = (productiveHours / 8).toFixed(1)
  const hoursYear = (productiveHours * 52).toLocaleString()
  const fte = (productiveHours / 40).toFixed(2)

  return (
    <section className="mf-zone-white py-28 md:py-36 border-t border-hairline">
      <div className="container mx-auto px-6">
        <SectionHeader
          eyebrow="Your numbers"
          title={
            <>
              How much time <br className="hidden md:block" />
              would you get back?
            </>
          }
          description="Move the sliders. We'll estimate the admin capacity Medoflow could return to your practice every year."
        />

        <div className="mx-auto mt-20 max-w-5xl">
          <motion.div {...fadeUpInView(0.05)} className="mf-card overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[1fr_1.15fr]">
              {/* ─── Left: the big answer ─────────────────── */}
              <div className="flex flex-col justify-between bg-navy p-8 text-white md:p-10">
                <div>
                  <p className="mf-eyebrow text-white/60">Admin capacity freed / year</p>
                  <motion.p
                    key={displayValue}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className="mf-display mt-3 text-[56px] leading-none md:text-[76px]"
                  >
                    ${displayValue.toLocaleString()}
                  </motion.p>
                  <p className="mt-3 max-w-xs text-[13px] text-white/60">
                    worth of staff time reallocated to patient care, not headcount cuts.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                  <AnswerStat value={daysFreed} unit="days/wk" label="Freed" />
                  <AnswerStat value={hoursYear} unit="hrs" label="Per year" />
                  <AnswerStat value={fte} unit="FTE" label="Equivalent" />
                </div>
              </div>

              {/* ─── Right: controls ──────────────────────── */}
              <div className="p-8 md:p-10">
                <SliderRow
                  icon={<Users className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  label="Admin staff"
                  value={staff}
                  min={1}
                  max={20}
                  onChange={setStaff}
                  minLabel="1 person"
                  maxLabel="20 people"
                />

                <div className="mt-9">
                  <SliderRow
                    icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    label="Admin hours / week"
                    value={hours}
                    unit="h"
                    min={5}
                    max={40}
                    onChange={setHours}
                    minLabel="5 hours"
                    maxLabel="40 hours"
                  />
                </div>

                <div className="mt-9 flex gap-3 rounded-[12px] bg-canvas p-4 border border-hairline">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} />
                  <div className="text-[12.5px] leading-relaxed text-ink-muted">
                    <p className="mf-eyebrow mb-1 text-ink-muted">How we calculate</p>
                    Healthcare admin wages ($22&ndash;$28/hr avg) &times; 60% automation across
                    scheduling, intake, follow-ups, and commerce.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Outcome strip */}
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { v: '12–20h', l: 'Admin time saved / week', icon: Clock },
              { v: '5–10%', l: 'Revenue per visit', icon: TrendingUp },
              { v: '20–35%', l: 'Fewer no-shows', icon: Users },
            ].map(({ v, l, icon: Icon }, i) => (
              <motion.div key={l} {...fadeUpInView(i * 0.06)} className="mf-card p-6">
                <span className="mf-stat-chip">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <p className="mf-display mt-4 text-[28px] text-navy">{v}</p>
                <p className="mt-1 text-[13px] text-ink-muted">{l}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────── Pieces ──────────────────────────────────

function AnswerStat({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div>
      <p className="mf-display text-[20px] text-white">
        {value}
        <span className="ml-1 text-[12px] text-white/50">{unit}</span>
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/50">{label}</p>
    </div>
  )
}

type SliderRowProps = {
  icon: React.ReactNode
  label: string
  value: number
  unit?: string
  min: number
  max: number
  onChange: (v: number) => void
  minLabel: string
  maxLabel: string
}

function SliderRow({
  icon,
  label,
  value,
  unit = '',
  min,
  max,
  onChange,
  minLabel,
  maxLabel,
}: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="mf-eyebrow flex items-center gap-2 text-ink-muted">
          <span className="text-ink-faint">{icon}</span>
          {label}
        </span>
        <span className="mf-display text-[22px] text-navy">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-3 w-full cursor-pointer"
        style={{ accentColor: '#0D9488' }}
        aria-label={label}
      />
      <div className="mt-2 flex justify-between text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

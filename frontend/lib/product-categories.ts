/**
 * Maps a product name to a visual category so the storefront can render
 * consistent gradient cards, icons, and category chips without requiring
 * new DB columns. Pure string → metadata.
 */

import {
  Activity,
  Bandage,
  Baby,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  Leaf,
  Moon,
  Pill,
  ShieldPlus,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type CategoryId =
  | 'supplements'
  | 'recovery'
  | 'mobility'
  | 'performance'
  | 'skincare'
  | 'gut'
  | 'immunity'
  | 'metabolic'
  | 'womens'
  | 'diagnostics'
  | 'sleep'

export type CategoryMeta = {
  id: CategoryId
  label: string
  /** tailwind gradient utility string, e.g. 'from-teal-50 to-sky-50' */
  gradient: string
  /** tailwind ring / accent color for chip + icon tile */
  accent: string
  /** hex color used for product-card headline icon fill */
  accentHex: string
  icon: LucideIcon
  /** one-line marketing tagline shown above the category section */
  tagline: string
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  supplements: {
    id: 'supplements',
    label: 'Supplements',
    gradient: 'from-emerald-50 via-teal-50 to-sky-50',
    accent: 'bg-teal-50 text-teal-700 ring-teal-100',
    accentHex: '#0D9488',
    icon: Pill,
    tagline: 'Physician-vetted daily formulas',
  },
  recovery: {
    id: 'recovery',
    label: 'Recovery',
    gradient: 'from-indigo-50 via-violet-50 to-purple-50',
    accent: 'bg-violet-50 text-violet-700 ring-violet-100',
    accentHex: '#7C3AED',
    icon: Moon,
    tagline: 'Support deeper sleep & soft-tissue repair',
  },
  mobility: {
    id: 'mobility',
    label: 'Mobility',
    gradient: 'from-orange-50 via-amber-50 to-yellow-50',
    accent: 'bg-amber-50 text-amber-700 ring-amber-100',
    accentHex: '#D97706',
    icon: Bandage,
    tagline: 'Between-session tools for joint care',
  },
  performance: {
    id: 'performance',
    label: 'Performance',
    gradient: 'from-sky-50 via-cyan-50 to-teal-50',
    accent: 'bg-sky-50 text-sky-700 ring-sky-100',
    accentHex: '#0284C7',
    icon: Zap,
    tagline: 'Built for active patients and athletes',
  },
  skincare: {
    id: 'skincare',
    label: 'Skin & Aesthetics',
    gradient: 'from-rose-50 via-pink-50 to-orange-50',
    accent: 'bg-rose-50 text-rose-700 ring-rose-100',
    accentHex: '#E11D48',
    icon: Sparkles,
    tagline: 'Dermatologist-grade everyday skin care',
  },
  gut: {
    id: 'gut',
    label: 'Gut Health',
    gradient: 'from-lime-50 via-emerald-50 to-teal-50',
    accent: 'bg-lime-50 text-lime-700 ring-lime-100',
    accentHex: '#65A30D',
    icon: Leaf,
    tagline: 'Probiotics & digestive balance',
  },
  immunity: {
    id: 'immunity',
    label: 'Immunity',
    gradient: 'from-blue-50 via-sky-50 to-indigo-50',
    accent: 'bg-blue-50 text-blue-700 ring-blue-100',
    accentHex: '#2563EB',
    icon: ShieldPlus,
    tagline: 'Daily defense through every season',
  },
  metabolic: {
    id: 'metabolic',
    label: 'Metabolic Health',
    gradient: 'from-red-50 via-orange-50 to-amber-50',
    accent: 'bg-orange-50 text-orange-700 ring-orange-100',
    accentHex: '#EA580C',
    icon: Flame,
    tagline: 'Blood sugar & energy regulation',
  },
  womens: {
    id: 'womens',
    label: "Women's Health",
    gradient: 'from-pink-50 via-fuchsia-50 to-rose-50',
    accent: 'bg-pink-50 text-pink-700 ring-pink-100',
    accentHex: '#DB2777',
    icon: Baby,
    tagline: 'Prenatal, cycle, and hormonal support',
  },
  diagnostics: {
    id: 'diagnostics',
    label: 'Home Diagnostics',
    gradient: 'from-slate-50 via-zinc-50 to-neutral-50',
    accent: 'bg-slate-100 text-slate-700 ring-slate-200',
    accentHex: '#475569',
    icon: HeartPulse,
    tagline: 'Clinic-grade monitoring at home',
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep & Stress',
    gradient: 'from-indigo-50 via-blue-50 to-cyan-50',
    accent: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    accentHex: '#4338CA',
    icon: Moon,
    tagline: 'Calmer nights, sharper days',
  },
}

// Order below controls the default "match first" priority.
const MATCHERS: Array<{ id: CategoryId; patterns: RegExp[] }> = [
  { id: 'skincare', patterns: [/serum/i, /spf/i, /sunscreen/i, /dermatolog/i, /\bskin\b/i] },
  { id: 'gut', patterns: [/probiotic/i, /\bgut\b/i, /digest/i] },
  { id: 'immunity', patterns: [/immune/i, /immun(ity|e)/i, /elderberry/i] },
  { id: 'metabolic', patterns: [/metabolic/i, /blood sugar/i, /berberine/i] },
  { id: 'womens', patterns: [/prenatal/i, /women/i, /maternal/i, /hormone/i] },
  {
    id: 'diagnostics',
    patterns: [/monitor/i, /\btest kit\b/i, /glucometer/i, /thermometer/i, /pressure/i],
  },
  { id: 'sleep', patterns: [/sleep/i, /stress/i, /ashwagandha/i, /melaton/i] },
  { id: 'recovery', patterns: [/recovery/i, /magnesium/i, /recover/i] },
  { id: 'mobility', patterns: [/\bjoint\b/i, /mobility/i, /roller/i, /rehab/i] },
  {
    id: 'performance',
    patterns: [/electrolyte/i, /performance/i, /protein/i, /whey/i, /isolate/i],
  },
]

export function categorize(name: string | null | undefined): CategoryMeta {
  const n = (name ?? '').toString()
  for (const m of MATCHERS) {
    if (m.patterns.some((p) => p.test(n))) return CATEGORIES[m.id]
  }
  return CATEGORIES.supplements
}

/**
 * Derive benefit bullets from the product description when none are stored.
 * Splits on sentence boundaries and takes up to `max` short chunks.
 */
export function deriveBenefits(description: string | null | undefined, max = 4): string[] {
  if (!description) return []
  const parts = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 140)
  return parts.slice(0, max)
}

export { Activity, Droplets, Dumbbell, Sun }

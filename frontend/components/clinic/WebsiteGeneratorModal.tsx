'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Sparkles,
  X,
  Wand2,
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Layers,
  Palette,
  Calendar,
  Trash2,
  ArrowRight,
  Globe,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateClinicWebsite, type GenerateWebsiteResult } from '@/lib/clinicApi'

type Step = 'form' | 'generating' | 'success'

const DEFAULT_THEME = '#0D9488'

const INDUSTRY_PRESETS: Array<{ label: string; color: string }> = [
  { label: 'Teal', color: '#0D9488' },
  { label: 'Indigo', color: '#4F46E5' },
  { label: 'Rose', color: '#E11D48' },
  { label: 'Amber', color: '#D97706' },
  { label: 'Navy', color: '#1E3A5F' },
  { label: 'Plum', color: '#7C3AED' },
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractPaletteFromImage(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const w = 64, h = 64
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve([]); return }
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h).data
        const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          const a = data[i + 3] ?? 0
          if (a < 200) continue
          const max = Math.max(r, g, b), min = Math.min(r, g, b)
          if (max > 240 && min > 240) continue
          if (max < 30) continue
          if (max - min < 25) continue
          const key = `${r >> 4}-${g >> 4}-${b >> 4}`
          const prev = buckets.get(key)
          if (prev) { prev.r += r; prev.g += g; prev.b += b; prev.n += 1 }
          else buckets.set(key, { r, g, b, n: 1 })
        }
        const top = Array.from(buckets.values())
          .sort((a, b) => b.n - a.n).slice(0, 6)
          .map((c) => {
            const r = Math.round(c.r / c.n), g = Math.round(c.g / c.n), b = Math.round(c.b / c.n)
            return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
          })
        resolve(top)
      } catch { resolve([]) }
    }
    img.onerror = () => resolve([])
    img.src = src
  })
}

export function WebsiteGeneratorModal({
  open,
  onOpenChange,
  mode = 'create',
  defaultName = '',
  defaultLogoUrl,
  defaultThemeColor,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode?: 'create' | 'edit'
  defaultName?: string
  defaultLogoUrl?: string
  defaultThemeColor?: string
  onGenerated?: (result: GenerateWebsiteResult) => void
}) {
  const [step, setStep] = React.useState<Step>('form')
  const [name, setName] = React.useState(defaultName)
  const [logoUrl, setLogoUrl] = React.useState(defaultLogoUrl ?? '')
  const [themeColor, setThemeColor] = React.useState(defaultThemeColor ?? DEFAULT_THEME)
  const [extractedColors, setExtractedColors] = React.useState<string[]>([])
  const [extracting, setExtracting] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<GenerateWebsiteResult | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [stage, setStage] = React.useState<0 | 1 | 2 | 3>(0)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Reset + re-seed when modal opens
  React.useEffect(() => {
    if (open) {
      setStep('form')
      setError(null)
      setResult(null)
      setCopied(false)
      setStage(0)
      setName(defaultName)
      setLogoUrl(defaultLogoUrl ?? '')
      setThemeColor(defaultThemeColor ?? DEFAULT_THEME)
      setExtractedColors([])
    }
  }, [open, defaultName, defaultLogoUrl, defaultThemeColor])

  // Extract palette from logo whenever it changes
  React.useEffect(() => {
    let cancelled = false
    if (!logoUrl) { setExtractedColors([]); return }
    setExtracting(true)
    extractPaletteFromImage(logoUrl).then((palette) => {
      if (cancelled) return
      setExtractedColors(palette)
      if (palette[0]) setThemeColor(palette[0].toUpperCase())
      setExtracting(false)
    })
    return () => { cancelled = true }
  }, [logoUrl])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Logo must be an image'); return }
    if (file.size > 2_000_000) { setError('Logo must be under 2 MB'); return }
    try {
      const data = await fileToDataUrl(file)
      setLogoUrl(data)
      setError(null)
    } catch { setError('Could not read that file') }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) { setError('Clinic name is required'); return }
    setError(null)
    setStep('generating')
    setStage(1)

    if (mode === 'edit') {
      // Quick save — no multi-stage theater needed
      const minHold = new Promise<void>((resolve) => setTimeout(resolve, 1200))
      try {
        const [generated] = await Promise.all([
          generateClinicWebsite({ name: name.trim(), logoUrl: logoUrl.trim() || undefined, themeColor: themeColor || undefined }),
          minHold,
        ])
        setResult(generated)
        setStep('success')
        onGenerated?.(generated)
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not save changes'
        setError(msg)
        setStep('form')
        setStage(0)
      }
      return
    }

    // Create mode — full 3-stage theater
    const t1 = setTimeout(() => setStage(2), 900)
    const t2 = setTimeout(() => setStage(3), 1800)
    const minHold = new Promise<void>((resolve) => setTimeout(resolve, 2600))
    try {
      const [generated] = await Promise.all([
        generateClinicWebsite({ name: name.trim(), logoUrl: logoUrl.trim() || undefined, themeColor: themeColor || undefined }),
        minHold,
      ])
      clearTimeout(t1); clearTimeout(t2)
      setResult(generated)
      setStep('success')
      onGenerated?.(generated)
    } catch (err: unknown) {
      clearTimeout(t1); clearTimeout(t2)
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not generate website'
      setError(msg)
      setStep('form')
      setStage(0)
    }
  }

  const fullUrl = result
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}${result.websiteUrl}`
    : ''

  const copyUrl = async () => {
    if (!fullUrl) return
    try { await navigator.clipboard.writeText(fullUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  const palette: Array<{ label: string; color: string }> =
    extractedColors.length > 0
      ? extractedColors.map((color, i) => ({ label: i === 0 ? 'Primary' : `Shade ${i + 1}`, color }))
      : INDUSTRY_PRESETS

  const isEdit = mode === 'edit'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[61] w-[96vw] -translate-x-1/2 -translate-y-1/2',
            step === 'form' ? 'max-w-[820px]' : 'max-w-[560px]',
            'overflow-hidden rounded-[28px] bg-white shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'transition-[max-width] duration-300'
          )}
        >
          {step !== 'generating' && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          )}

          {step === 'form' && (
            <div className="flex min-h-0 flex-col sm:flex-row">
              {/* ── Left: form ───────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 p-7">
                {/* Header */}
                <div className="flex items-center gap-3 pr-8">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm transition-colors"
                    style={{ backgroundColor: themeColor || DEFAULT_THEME }}
                  >
                    {isEdit ? <Wand2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <DialogPrimitive.Title className="text-[17px] font-bold text-slate-900 leading-tight">
                      {isEdit ? 'Update branding' : 'Launch your patient site'}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="mt-0.5 text-[13px] text-slate-500">
                      {isEdit
                        ? 'Changes go live instantly across your booking site.'
                        : 'Name · logo · color — we handle the rest.'}
                    </DialogPrimitive.Description>
                  </div>
                </div>

                {/* Clinic name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Clinic name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Everwell Medical"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {/* Logo upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Logo <span className="normal-case font-normal text-slate-300">(optional)</span>
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => { setLogoUrl(''); setExtractedColors([]) }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]) }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-4 py-3.5 transition-all',
                      dragActive
                        ? 'border-slate-400 bg-slate-100'
                        : logoUrl
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    )}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} />
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Logo preview" className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <ImageIcon className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-700">
                        {logoUrl ? 'Logo ready' : 'Drop image or click to browse'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {extracting
                          ? 'Sampling brand colors…'
                          : extractedColors.length > 0
                            ? '✓ Colors extracted from your logo'
                            : 'PNG · JPG · SVG · max 2 MB'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Theme color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Theme color
                    </label>
                    {extractedColors.length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">
                        ✦ From logo
                      </span>
                    )}
                  </div>

                  {/* Palette swatches */}
                  <div className="flex flex-wrap gap-2">
                    {palette.map((p) => {
                      const active = themeColor.toLowerCase() === p.color.toLowerCase()
                      return (
                        <button
                          key={p.color}
                          type="button"
                          onClick={() => setThemeColor(p.color.toUpperCase())}
                          title={p.label}
                          className={cn(
                            'relative h-8 w-8 rounded-full border-2 transition-all',
                            active
                              ? 'border-slate-800 scale-110 shadow-md'
                              : 'border-transparent hover:scale-105 hover:border-slate-300'
                          )}
                          style={{ backgroundColor: p.color }}
                        >
                          {active && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Hex + color picker row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value.toUpperCase())}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5"
                      aria-label="Pick custom color"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value.toUpperCase())}
                      className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                    />
                    <span className="text-[12px] text-slate-400">Custom hex</span>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: themeColor || DEFAULT_THEME }}
                >
                  {isEdit ? (
                    <><Wand2 className="h-4 w-4" /> Save changes</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate patient site</>
                  )}
                </button>
              </form>

              {/* ── Right: live preview ───────────────────────────────── */}
              <div className="hidden sm:flex w-[280px] shrink-0 flex-col border-l border-slate-100 bg-slate-50/60 p-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Live preview
                </p>
                <LivePreview name={name || 'Your Clinic'} logoUrl={logoUrl} themeColor={themeColor || DEFAULT_THEME} />
              </div>
            </div>
          )}

          {step === 'generating' && (
            isEdit
              ? <SavingSpinner themeColor={themeColor} />
              : <GenerationTheater clinicName={name.trim()} logoUrl={logoUrl} themeColor={themeColor} stage={stage} />
          )}

          {step === 'success' && result && (
            <SuccessReveal
              result={result}
              fullUrl={fullUrl}
              copied={copied}
              themeColor={themeColor}
              isEdit={isEdit}
              onCopy={copyUrl}
              onClose={() => onOpenChange(false)}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─── Live preview panel ────────────────────────────────────────────────

function LivePreview({ name, logoUrl, themeColor }: { name: string; logoUrl: string; themeColor: string }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-clinic'
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-rose-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="ml-2 truncate text-[9px] font-mono text-slate-400">
          /clinic/{slug}
        </span>
      </div>

      {/* Navbar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-5 w-5 rounded-md object-cover" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-md text-white" style={{ backgroundColor: themeColor }}>
              <Globe className="h-3 w-3" />
            </div>
          )}
          <span className="max-w-[80px] truncate text-[10px] font-bold text-slate-800">{name || 'Your Clinic'}</span>
        </div>
        <div className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: themeColor }}>
          Book
        </div>
      </div>

      {/* Hero */}
      <div
        className="px-3 py-4"
        style={{ background: `linear-gradient(135deg, ${themeColor}20 0%, transparent 70%)` }}
      >
        <div className="mb-1 h-2.5 w-3/4 rounded bg-slate-800" />
        <div className="h-2 w-1/2 rounded bg-slate-300" />
        <div className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold text-white" style={{ backgroundColor: themeColor }}>
          Book a visit <ChevronRight className="h-2.5 w-2.5" />
        </div>
      </div>

      {/* Service cards */}
      <div className="space-y-1.5 px-3 pb-3">
        {['Consultation', 'Follow-up'].map((label) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-2" style={{ borderLeftColor: themeColor, borderLeftWidth: 3 }}>
            <div>
              <div className="text-[10px] font-semibold text-slate-700">{label}</div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <Clock className="h-2.5 w-2.5" /> 30 min
              </div>
            </div>
            <div className="rounded-full px-2 py-0.5 text-[8px] font-bold text-white" style={{ backgroundColor: themeColor }}>
              Book
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Saving spinner (edit mode) ────────────────────────────────────────

function SavingSpinner({ themeColor }: { themeColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-14">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: themeColor }}
      >
        <Wand2 className="h-6 w-6 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-slate-900">Saving changes…</p>
        <p className="mt-1 text-sm text-slate-500">Updating your patient site branding</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: themeColor, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Generation theater (create mode) ─────────────────────────────────

function GenerationTheater({ clinicName, logoUrl, themeColor, stage }: {
  clinicName: string; logoUrl: string; themeColor: string; stage: 0 | 1 | 2 | 3
}) {
  const stages: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; sub: string }> = [
    { icon: Layers, label: 'Designing layout', sub: 'Building page structure' },
    { icon: Palette, label: 'Applying brand', sub: 'Colors, logo & typography' },
    { icon: Calendar, label: 'Wiring booking', sub: 'Connecting appointment flow' },
  ]
  return (
    <div className="grid gap-6 p-7 sm:grid-cols-[1fr_220px]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: themeColor || DEFAULT_THEME }}>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">Building your site</p>
            <p className="text-[12px] text-slate-500">This takes about 3 seconds</p>
          </div>
        </div>
        <ul className="space-y-2.5">
          {stages.map((s, i) => {
            const idx = (i + 1) as 1 | 2 | 3
            const active = stage === idx
            const done = stage > idx
            return (
              <li key={s.label} className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300',
                done ? 'border-emerald-200 bg-emerald-50' : active ? 'border-slate-200 bg-white shadow-sm' : 'border-slate-100 bg-white'
              )}>
                <div
                  className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors', done ? 'bg-emerald-500 text-white' : active ? 'text-white' : 'bg-slate-100 text-slate-300')}
                  style={active && !done ? { backgroundColor: themeColor } : undefined}
                >
                  {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <div>
                  <p className={cn('text-[13px] font-semibold', done || active ? 'text-slate-900' : 'text-slate-400')}>{s.label}</p>
                  <p className={cn('text-[11px]', done ? 'text-emerald-600' : active ? 'text-slate-500' : 'text-slate-300')}>{done ? 'Done' : s.sub}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <LivePreview name={clinicName || 'Your Clinic'} logoUrl={logoUrl} themeColor={themeColor} />
    </div>
  )
}

// ─── Success state ─────────────────────────────────────────────────────

function SuccessReveal({ result, fullUrl, copied, themeColor, isEdit, onCopy, onClose }: {
  result: GenerateWebsiteResult; fullUrl: string; copied: boolean; themeColor: string; isEdit: boolean; onCopy: () => void; onClose: () => void
}) {
  const accent = result.themeColor || themeColor
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: accent }}>
          <Check className="h-6 w-6" />
        </div>
        <div>
          <DialogPrimitive.Title className="text-xl font-bold text-slate-900">
            {isEdit ? 'Branding updated!' : 'Your site is live!'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-[13px] text-slate-500">
            {isEdit
              ? `${result.name} is live with your new branding.`
              : `${result.name} is now accepting bookings at the link below.`}
          </DialogPrimitive.Description>
        </div>
      </div>

      {/* URL card */}
      <div
        className="overflow-hidden rounded-2xl border p-5"
        style={{ borderColor: `${accent}30`, background: `linear-gradient(135deg, ${accent}08, transparent)` }}
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Patient site URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-white/80 px-3 py-2.5 font-mono text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
            {fullUrl}
          </code>
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors',
              copied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <a
          href={result.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          <ExternalLink className="h-4 w-4" />
          Visit site
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Done
        </button>
      </div>

      {/* Next steps — only for first-time creation */}
      {!isEdit && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: 'Add a service', href: '/dashboard/services' },
            { label: 'Invite clinician', href: '/dashboard/staff' },
            { label: 'View analytics', href: '/dashboard/analytics' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
            >
              {label}
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

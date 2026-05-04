'use client'

/**
 * Section-based page editor (Shopify-style). Three columns:
 *   1. Section tree on the left — add, reorder, delete sections.
 *   2. Live preview centre — renders the same section components as the
 *      public page so what the clinic admin sees is what the patient gets.
 *   3. Settings panel right — schema-driven from siteSections.fields, so a
 *      new section type only needs a renderer + a SECTIONS entry.
 *
 * Saves write to draftSectionsJson; Publish copies it onto sectionsJson on
 * the server.
 */

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Globe2,
  Loader2,
  Plus,
  Save,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import api from '@/lib/api'
import { SECTIONS, SECTION_BY_TYPE, newSection, type Section } from '@/lib/siteSections'
import { SiteSectionList, type RenderContext } from '@/components/clinic/SiteSectionRenderer'
import { useAuth } from '@/contexts/AuthContext'

interface PageDetail {
  id: string
  clinicId: string
  slug: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  draftSectionsJson: Section[]
  sectionsJson: Section[]
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
}

const DEFAULT_THEME = '#0D9488'

export default function SitePageEditor() {
  const params = useParams<{ id: string }>()
  const pageId = params?.id
  const router = useRouter()
  const { user } = useAuth()

  const [page, setPage] = React.useState<PageDetail | null>(null)
  const [sections, setSections] = React.useState<Section[]>([])
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<Date | null>(null)
  const [services, setServices] = React.useState<RenderContext['services']>([])
  const [providers, setProviders] = React.useState<RenderContext['providers']>([])
  const [themeColor, setThemeColor] = React.useState<string>(DEFAULT_THEME)
  const [adderOpen, setAdderOpen] = React.useState(false)

  React.useEffect(() => {
    if (!pageId) return
    let cancelled = false
    void (async () => {
      try {
        const { data } = await api.get<{ success: boolean; data: PageDetail }>(
          `/site-pages/${pageId}`
        )
        if (cancelled) return
        const draft = (data.data.draftSectionsJson ?? []) as Section[]
        setPage(data.data)
        setSections(Array.isArray(draft) ? draft : [])
        if (Array.isArray(draft) && draft.length > 0) setSelectedIdx(0)
      } catch (e: unknown) {
        if (cancelled) return
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not load page'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageId])

  // Pull the clinic's services + providers + theme so the live preview matches
  // what the patient will see. Fail silently — preview is best-effort.
  React.useEffect(() => {
    const clinicId = user?.clinicId ?? page?.clinicId
    if (!clinicId) return
    void (async () => {
      try {
        const [svcRes, provRes, clinicRes] = await Promise.all([
          api.get<{ success: boolean; data: { services: unknown[] } }>(
            `/public/clinics/${clinicId}/services`
          ),
          api.get<{ success: boolean; data: { providers: unknown[] } }>(
            `/public/clinics/${clinicId}/providers`
          ),
          api.get<{ success: boolean; data: { clinic: { themeColor?: string | null } } }>(
            `/public/clinics/${clinicId}`
          ),
        ])
        setServices((svcRes.data.data.services as RenderContext['services']) ?? [])
        setProviders((provRes.data.data.providers as RenderContext['providers']) ?? [])
        const tc = clinicRes.data.data.clinic?.themeColor
        if (tc) setThemeColor(tc)
      } catch {
        /* preview best effort */
      }
    })()
  }, [user?.clinicId, page?.clinicId])

  const updateSelected = (patch: Partial<Section>) => {
    if (selectedIdx == null) return
    setSections((prev) => {
      const next = [...prev]
      next[selectedIdx] = { ...next[selectedIdx]!, ...patch }
      return next
    })
    setSavedAt(null)
  }

  const updateSelectedSetting = (key: string, value: unknown) => {
    if (selectedIdx == null) return
    setSections((prev) => {
      const next = [...prev]
      const cur = next[selectedIdx]!
      next[selectedIdx] = {
        ...cur,
        settings: { ...cur.settings, [key]: value },
      }
      return next
    })
    setSavedAt(null)
  }

  const move = (idx: number, delta: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev]
      const target = idx + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target]!, next[idx]!]
      return next
    })
    setSelectedIdx((cur) =>
      cur == null ? cur : cur === idx ? idx + delta : cur === idx + delta ? idx : cur
    )
    setSavedAt(null)
  }

  const remove = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx))
    setSelectedIdx((cur) => (cur == null ? cur : cur === idx ? null : cur > idx ? cur - 1 : cur))
    setSavedAt(null)
  }

  const add = (type: string) => {
    setSections((prev) => [...prev, newSection(type)])
    setSelectedIdx(sections.length)
    setAdderOpen(false)
    setSavedAt(null)
  }

  const onSave = async () => {
    if (!page || saving) return
    setSaving(true)
    setError(null)
    try {
      await api.put(`/site-pages/${page.id}`, { sections })
      setSavedAt(new Date())
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const onPublish = async () => {
    if (!page || publishing) return
    setPublishing(true)
    setError(null)
    try {
      await api.put(`/site-pages/${page.id}`, { sections })
      const { data } = await api.post<{ success: boolean; data: PageDetail }>(
        `/site-pages/${page.id}/publish`
      )
      setPage(data.data)
      setSavedAt(new Date())
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not publish'
      setError(msg)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading editor…</div>
  if (error && !page)
    return <div className="m-8 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
  if (!page) return null

  const selected = selectedIdx != null ? sections[selectedIdx] : null
  const selectedDef = selected ? SECTION_BY_TYPE[selected.type] : null

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/site/pages')}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All pages
          </button>
          <span className="text-slate-300">·</span>
          <p className="text-sm font-semibold text-slate-900">{page.title}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
            /{page.slug}
          </span>
          {page.status === 'PUBLISHED' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <Globe2 className="h-3 w-3" /> Published
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe2 className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </header>

      {/* Body: 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: section tree */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sections
          </p>
          <ul className="mt-2 space-y-1">
            {sections.map((sec, idx) => {
              const def = SECTION_BY_TYPE[sec.type]
              const active = idx === selectedIdx
              return (
                <li key={sec.id ?? idx}>
                  <div
                    className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                      active ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className="flex-1 truncate text-left font-medium"
                    >
                      {def?.label ?? sec.type}
                    </button>
                    <div className="flex items-center gap-0.5">
                      <IconBtn label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        label="Move down"
                        disabled={idx === sections.length - 1}
                        onClick={() => move(idx, 1)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Delete" onClick={() => remove(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </IconBtn>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setAdderOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add section
            </button>
            {adderOpen && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {SECTIONS.map((s) => (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => add(s.type)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-900">{s.label}</span>
                    <span className="ml-2 text-xs text-slate-500">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Centre: live preview */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              Live preview · click a section to edit
            </div>
            <div className="bg-white">
              {sections.length === 0 ? (
                <p className="px-6 py-16 text-center text-sm text-slate-400">
                  Empty page. Add a section from the left to get started.
                </p>
              ) : (
                <SiteSectionList sections={sections} ctx={{ themeColor, services, providers }} />
              )}
            </div>
          </div>
        </main>

        {/* Right: settings panel */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
          {selected && selectedDef ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {selectedDef.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{selectedDef.description}</p>
              <div className="mt-4 space-y-4">
                {selectedDef.fields.map((f) => (
                  <FieldEditor
                    key={f.key}
                    field={f}
                    value={selected.settings[f.key]}
                    onChange={(v) => updateSelectedSetting(f.key, v)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a section on the left to edit it.</p>
          )}
        </aside>
      </div>

      {error && (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded p-1 hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; type: string; hint?: string }
  value: unknown
  onChange: (v: unknown) => void
}) {
  const baseInput =
    'w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold text-slate-700">{field.label}</span>
      {field.type === 'longtext' && (
        <textarea
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        />
      )}
      {field.type === 'string' && (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        />
      )}
      {field.type === 'image-url' && (
        <input
          type="url"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
          placeholder="https://…"
        />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          value={typeof value === 'number' ? value : Number(value) || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={baseInput}
        />
      )}
      {field.type === 'color' && (
        <input
          type="color"
          value={typeof value === 'string' ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200"
        />
      )}
      {field.type === 'boolean' && (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
      )}
      {field.type === 'string-list' && (
        <textarea
          rows={5}
          value={Array.isArray(value) ? (value as string[]).join('\n') : ''}
          onChange={(e) =>
            onChange(
              e.target.value
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
            )
          }
          className={`${baseInput} font-mono text-xs`}
          placeholder="One item per line"
        />
      )}
      {field.hint && <p className="mt-1 text-[11px] text-slate-500">{field.hint}</p>}
    </label>
  )
}

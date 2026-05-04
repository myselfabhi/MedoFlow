'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Globe2, FileText, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { starterHomeSections } from '@/lib/siteSections'

interface PageRow {
  id: string
  slug: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  updatedAt: string
}

export default function SitePagesListPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<PageRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showNew, setShowNew] = React.useState(false)
  const [draft, setDraft] = React.useState({ title: '', slug: '', preset: 'home' })

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<{ success: boolean; data: { items: PageRow[] } }>(
        '/site-pages'
      )
      setItems(data.data.items)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load pages'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const sections = draft.preset === 'home' ? starterHomeSections() : []
      const { data } = await api.post<{ success: boolean; data: PageRow }>('/site-pages', {
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        sections,
      })
      router.push(`/dashboard/site/pages/${data.data.id}`)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create the page'
      setError(msg)
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Patient website
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Pages</h1>
          <p className="mt-1 text-sm text-slate-600">
            Build and publish the pages your patients see on your clinic site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
      </div>

      {showNew && (
        <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Create a page</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-800">Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Home, About, Services…"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-800">URL slug</span>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="home"
                required
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-800">Starter content</span>
              <select
                value={draft.preset}
                onChange={(e) => setDraft({ ...draft, preset: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="home">
                  Home page (Hero + Services + Providers + Testimonials + FAQ + CTA)
                </option>
                <option value="blank">Blank page (no sections)</option>
              </select>
            </label>
          </div>
          {error && (
            <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create page
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                  <FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  No pages yet. Create your first one.
                </td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/site/pages/${row.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">/{row.slug}</td>
                <td className="px-4 py-3">
                  {row.status === 'PUBLISHED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <Globe2 className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(row.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

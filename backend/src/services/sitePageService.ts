import prisma from '../config/prisma'
import { ApiError } from '../types/errors'
import type { SitePageStatus } from '@prisma/client'

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/

function validateSlug(slug: string): string {
  const cleaned = slug.trim().toLowerCase()
  if (!SLUG_RE.test(cleaned)) {
    const err = new Error(
      'Slug must be 1-62 chars: lowercase letters, numbers, hyphens (no leading/trailing hyphen).'
    ) as ApiError
    err.statusCode = 400
    throw err
  }
  return cleaned
}

export interface SectionInput {
  type: string
  settings?: Record<string, unknown>
  blocks?: Array<{ type: string; settings?: Record<string, unknown> }>
}

function validateSections(sections: unknown): SectionInput[] {
  if (!Array.isArray(sections)) {
    const err = new Error('sections must be an array') as ApiError
    err.statusCode = 400
    throw err
  }
  if (sections.length > 50) {
    const err = new Error('A page can have at most 50 sections') as ApiError
    err.statusCode = 400
    throw err
  }
  return sections.map((s, idx) => {
    if (!s || typeof s !== 'object') {
      const err = new Error(`Section ${idx} must be an object`) as ApiError
      err.statusCode = 400
      throw err
    }
    const sec = s as Record<string, unknown>
    if (typeof sec['type'] !== 'string' || !sec['type']) {
      const err = new Error(`Section ${idx} is missing a type`) as ApiError
      err.statusCode = 400
      throw err
    }
    return {
      type: sec['type'] as string,
      settings: (sec['settings'] as Record<string, unknown>) ?? {},
      blocks: Array.isArray(sec['blocks'])
        ? (sec['blocks'] as Array<{ type: string; settings?: Record<string, unknown> }>)
        : [],
    }
  })
}

export async function listPages(clinicId: string) {
  return prisma.sitePage.findMany({
    where: { clinicId },
    orderBy: [{ status: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  })
}

export async function getPage(clinicId: string, pageId: string) {
  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, clinicId },
  })
  if (!page) {
    const err = new Error('Page not found') as ApiError
    err.statusCode = 404
    throw err
  }
  return page
}

export async function getPublishedBySlug(clinicId: string, slug: string) {
  const page = await prisma.sitePage.findFirst({
    where: { clinicId, slug, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      sectionsJson: true,
      seoTitle: true,
      seoDescription: true,
      publishedAt: true,
    },
  })
  return page
}

export async function createPage(
  clinicId: string,
  input: {
    slug: string
    title: string
    sections?: SectionInput[]
    seoTitle?: string | null
    seoDescription?: string | null
  }
) {
  const slug = validateSlug(input.slug)
  const sections = validateSections(input.sections ?? [])

  const existing = await prisma.sitePage.findUnique({
    where: { clinicId_slug: { clinicId, slug } },
  })
  if (existing) {
    const err = new Error('A page with that slug already exists') as ApiError
    err.statusCode = 409
    throw err
  }

  return prisma.sitePage.create({
    data: {
      clinicId,
      slug,
      title: input.title.trim(),
      status: 'DRAFT',
      draftSectionsJson: sections as unknown as object,
      sectionsJson: [] as unknown as object,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    },
  })
}

export async function updateDraft(
  clinicId: string,
  pageId: string,
  input: {
    title?: string
    sections?: SectionInput[]
    seoTitle?: string | null
    seoDescription?: string | null
  }
) {
  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, clinicId },
    select: { id: true },
  })
  if (!page) {
    const err = new Error('Page not found') as ApiError
    err.statusCode = 404
    throw err
  }

  const data: Record<string, unknown> = {}
  if (input.title !== undefined) data['title'] = input.title.trim()
  if (input.sections !== undefined) {
    data['draftSectionsJson'] = validateSections(input.sections) as unknown as object
  }
  if (input.seoTitle !== undefined) data['seoTitle'] = input.seoTitle
  if (input.seoDescription !== undefined) data['seoDescription'] = input.seoDescription

  return prisma.sitePage.update({
    where: { id: page.id },
    data,
  })
}

export async function publish(clinicId: string, pageId: string) {
  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, clinicId },
  })
  if (!page) {
    const err = new Error('Page not found') as ApiError
    err.statusCode = 404
    throw err
  }
  return prisma.sitePage.update({
    where: { id: page.id },
    data: {
      sectionsJson: page.draftSectionsJson as unknown as object,
      status: 'PUBLISHED' as SitePageStatus,
      publishedAt: new Date(),
    },
  })
}

export async function unpublish(clinicId: string, pageId: string) {
  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, clinicId },
    select: { id: true },
  })
  if (!page) {
    const err = new Error('Page not found') as ApiError
    err.statusCode = 404
    throw err
  }
  return prisma.sitePage.update({
    where: { id: page.id },
    data: { status: 'DRAFT' as SitePageStatus, publishedAt: null },
  })
}

export async function deletePage(clinicId: string, pageId: string) {
  const page = await prisma.sitePage.findFirst({
    where: { id: pageId, clinicId },
    select: { id: true },
  })
  if (!page) {
    const err = new Error('Page not found') as ApiError
    err.statusCode = 404
    throw err
  }
  await prisma.sitePage.delete({ where: { id: page.id } })
}

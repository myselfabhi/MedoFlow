/**
 * Section registry for the clinic website builder.
 *
 * Each section type defines:
 *   - `defaults`: starter settings the editor uses when adding a new instance.
 *   - `fields`: the schema-driven settings panel — what knobs the clinic
 *     admin can twist. Field types kept narrow on purpose (string, longtext,
 *     number, boolean, color, image-url, list-of-strings) so the editor UI
 *     can render every section without bespoke forms.
 *
 * Renderers live next to this file in `siteSectionRenderers.tsx` so the
 * type registry can be imported by both the dashboard and the public
 * renderer without dragging React components into Node-only contexts.
 */

export type FieldType =
  | 'string'
  | 'longtext'
  | 'number'
  | 'boolean'
  | 'color'
  | 'image-url'
  | 'string-list'

export interface SectionField {
  key: string
  label: string
  type: FieldType
  hint?: string
}

export interface SectionDef {
  type: string
  label: string
  description: string
  defaults: Record<string, unknown>
  fields: SectionField[]
}

export interface Section {
  id?: string
  type: string
  settings: Record<string, unknown>
  blocks?: Array<{ type: string; settings?: Record<string, unknown> }>
}

export const SECTIONS: SectionDef[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Top-of-page banner with headline, subheadline, and CTA.',
    defaults: {
      eyebrow: 'Welcome',
      headline: 'Care that fits your life.',
      subheadline: 'Book a visit, message your provider, manage your care from one place.',
      ctaLabel: 'Book a visit',
      ctaHref: '#services',
      backgroundImage: '',
    },
    fields: [
      { key: 'eyebrow', label: 'Eyebrow text', type: 'string' },
      { key: 'headline', label: 'Headline', type: 'string' },
      { key: 'subheadline', label: 'Sub-headline', type: 'longtext' },
      { key: 'ctaLabel', label: 'Primary CTA label', type: 'string' },
      { key: 'ctaHref', label: 'Primary CTA link', type: 'string' },
      {
        key: 'backgroundImage',
        label: 'Background image URL',
        type: 'image-url',
        hint: 'Leave empty for a solid brand-color hero.',
      },
    ],
  },
  {
    type: 'service-grid',
    label: 'Service grid',
    description: 'A grid of services pulled from the clinic catalog.',
    defaults: {
      title: 'What we offer',
      intro: 'Tap a service to see availability.',
      maxItems: 6,
    },
    fields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'intro', label: 'Intro paragraph', type: 'longtext' },
      { key: 'maxItems', label: 'Max items shown', type: 'number' },
    ],
  },
  {
    type: 'provider-bios',
    label: 'Provider bios',
    description: 'Cards for each provider (photo, name, specialty, bio).',
    defaults: {
      title: 'Meet the team',
      intro: '',
      maxItems: 6,
    },
    fields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'intro', label: 'Intro paragraph', type: 'longtext' },
      { key: 'maxItems', label: 'Max providers shown', type: 'number' },
    ],
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Patient quotes — supports multiple blocks.',
    defaults: {
      title: 'What patients say',
      quotes: [
        '“Saved me hours of paperwork.” — Sarah',
        '“My provider actually listens.” — James',
        '“Best clinic visit I’ve had in years.” — Priya',
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'quotes', label: 'Quotes (one per line)', type: 'string-list' },
    ],
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Question / answer pairs in a clean stacked layout.',
    defaults: {
      title: 'Frequently asked',
      items: [
        'Do you accept insurance?|We bill most major insurers — bring your card to your first visit.',
        'How do I cancel an appointment?|From the patient menu, open Appointments and tap Cancel up to 24h in advance.',
      ],
    },
    fields: [
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'items', label: 'Items (Q|A per line)', type: 'string-list' },
    ],
  },
  {
    type: 'booking-cta',
    label: 'Booking call-to-action',
    description: 'Final-row banner inviting patients to book.',
    defaults: {
      headline: 'Ready when you are.',
      subheadline: 'Same-day visits available most weekdays.',
      ctaLabel: 'Find an appointment',
      ctaHref: '#services',
    },
    fields: [
      { key: 'headline', label: 'Headline', type: 'string' },
      { key: 'subheadline', label: 'Sub-headline', type: 'longtext' },
      { key: 'ctaLabel', label: 'CTA label', type: 'string' },
      { key: 'ctaHref', label: 'CTA link', type: 'string' },
    ],
  },
  {
    type: 'rich-text',
    label: 'Rich text',
    description: 'A free-form paragraph block for general copy.',
    defaults: {
      title: '',
      body: 'Write something for your patients here.',
    },
    fields: [
      { key: 'title', label: 'Title (optional)', type: 'string' },
      { key: 'body', label: 'Body', type: 'longtext' },
    ],
  },
]

export const SECTION_BY_TYPE: Record<string, SectionDef> = SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.type]: s }),
  {}
)

export function newSection(type: string): Section {
  const def = SECTION_BY_TYPE[type]
  if (!def) throw new Error(`Unknown section type: ${type}`)
  return {
    id: `s_${Math.random().toString(36).slice(2, 10)}`,
    type,
    settings: { ...def.defaults },
    blocks: [],
  }
}

/** Convenience: a sensible starter Home page. */
export function starterHomeSections(): Section[] {
  return [
    newSection('hero'),
    newSection('service-grid'),
    newSection('provider-bios'),
    newSection('testimonials'),
    newSection('faq'),
    newSection('booking-cta'),
  ]
}

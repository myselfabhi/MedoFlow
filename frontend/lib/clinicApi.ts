import axios from 'axios'
import authedApi from './api'
import type { Clinic } from './types/booking'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const api = axios.create({
  baseURL: `${baseURL}/api/v1/public`,
  headers: { 'Content-Type': 'application/json' },
})

export interface GetClinicsResponse {
  success: boolean
  data: { clinics: Clinic[] }
}

export interface GetClinicResponse {
  success: boolean
  data: { clinic: Clinic }
}

export const getClinics = async (): Promise<Clinic[]> => {
  const { data } = await api.get<GetClinicsResponse>('/clinics')
  return data.data.clinics
}

export const getClinic = async (id: string): Promise<Clinic> => {
  const { data } = await api.get<GetClinicResponse>(`/clinics/${id}`)
  return data.data.clinic
}

export const getPublicClinicProducts = async (clinicId: string) => {
  const { data } = await api.get(`/clinics/${clinicId}/products`)
  return data.data.products
}

export const getPublicClinicPackages = async (clinicId: string) => {
  const { data } = await api.get(`/clinics/${clinicId}/packages`)
  return data.data.packages
}

export const getPublicClinicMemberships = async (clinicId: string) => {
  const { data } = await api.get(`/clinics/${clinicId}/memberships`)
  return data.data.memberships
}

export const getPublicProduct = async (id: string) => {
  const { data } = await api.get(`/products/${id}`)
  return data.data.product
}

export interface GenerateWebsiteInput {
  name: string
  logoUrl?: string
  themeColor?: string
}

export interface GenerateWebsiteResult {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  themeColor: string | null
  websiteUrl: string
}

export const generateClinicWebsite = async (
  input: GenerateWebsiteInput
): Promise<GenerateWebsiteResult> => {
  const { data } = await authedApi.post('/clinics/generate-website', input)
  return data.data as GenerateWebsiteResult
}

// ---------------------------------------------------------------------------
// AI Website Bootstrap
// ---------------------------------------------------------------------------

export interface AiBootstrapInput {
  name: string
  logoUrl?: string | null
  themeColor?: string | null
  sectionTypes: string[]
}

export interface BootstrappedSection {
  id: string
  type: string
  settings: Record<string, unknown>
  blocks: unknown[]
}

export interface AiBootstrapResult {
  pageId: string
  sections: BootstrappedSection[]
}

export const aiBootstrapWebsite = async (input: AiBootstrapInput): Promise<AiBootstrapResult> => {
  const { data } = await authedApi.post('/site-pages/ai-bootstrap', input)
  return data.data as AiBootstrapResult
}

export const publishSitePage = async (pageId: string): Promise<void> => {
  await authedApi.post(`/site-pages/${pageId}/publish`)
}

export const saveSitePageDraft = async (
  pageId: string,
  sections: BootstrappedSection[]
): Promise<void> => {
  await authedApi.put(`/site-pages/${pageId}`, { sections })
}

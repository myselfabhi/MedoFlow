/**
 * Legacy /register entrypoint — use /signup ? Same destination: the
 * <AuthModal> flow on the landing page. Server-redirects to
 * `/?auth=signup`.
 */

import { redirect } from 'next/navigation'

export default function RegisterPage({ searchParams }: { searchParams: { returnUrl?: string } }) {
  const qs = new URLSearchParams({ auth: 'signup' })
  if (searchParams?.returnUrl) qs.set('returnUrl', searchParams.returnUrl)
  redirect(`/?${qs.toString()}`)
}

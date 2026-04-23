/**
 * Legacy /signup entrypoint — the full-page signup was replaced by the
 * <AuthModal> flow on the landing page. This page server-redirects to
 * `/?auth=signup` so the modal opens.
 */

import { redirect } from 'next/navigation'

export default function SignupPage({ searchParams }: { searchParams: { returnUrl?: string } }) {
  const qs = new URLSearchParams({ auth: 'signup' })
  if (searchParams?.returnUrl) qs.set('returnUrl', searchParams.returnUrl)
  redirect(`/?${qs.toString()}`)
}

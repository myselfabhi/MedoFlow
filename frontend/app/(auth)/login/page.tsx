/**
 * Legacy /login entrypoint — the full-page login was replaced by the
 * <AuthModal> flow on the landing page. This page server-redirects to
 * `/?auth=login` so the modal opens, forwarding any `returnUrl` that
 * emails, bookmarks, or auth guards may have included.
 */

import { redirect } from 'next/navigation'

export default function LoginPage({ searchParams }: { searchParams: { returnUrl?: string } }) {
  const qs = new URLSearchParams({ auth: 'login' })
  if (searchParams?.returnUrl) qs.set('returnUrl', searchParams.returnUrl)
  redirect(`/?${qs.toString()}`)
}

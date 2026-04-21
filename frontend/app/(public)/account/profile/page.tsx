'use client'

import * as React from 'react'
import { Save } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import {
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppCardTitle,
  AppFormField,
  AppInput,
  AppPageHeader,
  AppButton,
} from '@/components/ui-system'

export default function AccountProfilePage() {
  const { user, patchUser } = useAuth()
  const [name, setName] = React.useState(user?.name ?? '')
  const [email, setEmail] = React.useState(user?.email ?? '')
  const [saving, setSaving] = React.useState(false)
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Name must be at least 2 characters')
      setSaveStatus('error')
      return
    }
    setSaving(true)
    setErrorMessage(null)
    try {
      const { data } = await api.patch('/auth/me', { name: name.trim() })
      if (data?.data?.user) {
        patchUser({ name: data.data.user.name })
      }
      setSaveStatus('saved')
      window.setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Could not update profile')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Profile"
        description="Your personal information. Email is your login ID and can't be changed here."
      />

      <AppCard className="border border-slate-100 shadow-sm">
        <AppCardHeader className="border-b border-slate-100">
          <AppCardTitle className="text-base">Personal details</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6 space-y-5">
          <AppFormField label="Full name" required>
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </AppFormField>

          <AppFormField label="Email">
            <AppInput type="email" value={email} disabled className="bg-slate-50" />
          </AppFormField>

          {errorMessage && (
            <p className="text-sm text-rose-600" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <AppButton onClick={handleSave} disabled={saving || name.trim() === (user?.name ?? '')}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save changes'}
            </AppButton>
            {saveStatus === 'saved' && (
              <span className="text-xs font-medium text-emerald-600">Saved ✓</span>
            )}
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard className="border border-slate-100 shadow-sm">
        <AppCardHeader className="border-b border-slate-100">
          <AppCardTitle className="text-base">Security</AppCardTitle>
        </AppCardHeader>
        <AppCardContent className="p-6">
          <p className="text-sm text-slate-600">
            To change your password, use the "Forgot password" link on the login page. An email with
            a reset link will be sent to <strong>{user?.email}</strong>.
          </p>
        </AppCardContent>
      </AppCard>
    </div>
  )
}

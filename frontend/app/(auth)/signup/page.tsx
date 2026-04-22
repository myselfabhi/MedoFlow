'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import api from '@/lib/api'
import { Building2, User, Mail, Lock, Globe, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

const signupSchema = z.object({
  ownerName: z.string().min(2, 'Name must be at least 2 characters'),
  ownerEmail: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  clinicName: z.string().min(2, 'Clinic name must be at least 2 characters'),
  clinicEmail: z.string().email('Invalid clinic email'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomain: lowercase letters, numbers, hyphens only'),
})

type SignupFormData = z.infer<typeof signupSchema>

const STEPS = ['Account', 'Clinic', 'Subdomain'] as const

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = React.useState<boolean | null>(null)
  const [checkingSubdomain, setCheckingSubdomain] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      ownerName: '',
      ownerEmail: '',
      password: '',
      clinicName: '',
      clinicEmail: '',
      subdomain: '',
    },
  })

  const subdomain = watch('subdomain')

  React.useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }
    const timer = setTimeout(async () => {
      setCheckingSubdomain(true)
      try {
        const res = await api.get(`/tenants/check-subdomain?subdomain=${subdomain}`)
        setSubdomainAvailable((res.data as { data: { available: boolean } }).data.available)
      } catch {
        setSubdomainAvailable(null)
      } finally {
        setCheckingSubdomain(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [subdomain])

  const stepFields: Record<number, (keyof SignupFormData)[]> = {
    0: ['ownerName', 'ownerEmail', 'password'],
    1: ['clinicName', 'clinicEmail'],
    2: ['subdomain'],
  }

  const handleNext = async () => {
    const fields = stepFields[step]
    if (!fields) return
    const valid = await trigger(fields)
    if (valid) setStep((s) => s + 1)
  }

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    setIsSubmitting(true)
    try {
      await api.post('/tenants/signup', data)
      router.push('/login?registered=1')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            'Signup failed. Please try again.')
          : 'Signup failed. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Start your free trial</h1>
          <p className="text-gray-500 mt-2">Set up your clinic in under 2 minutes</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i < step
                      ? 'bg-indigo-600 text-white'
                      : i === step
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium ${i === step ? 'text-indigo-700' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Step 0: Account */}
              {step === 0 && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Your account</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('ownerName')}
                          placeholder="Jane Smith"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {errors.ownerName && (
                        <p className="text-xs text-red-600 mt-1">{errors.ownerName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('ownerEmail')}
                          type="email"
                          placeholder="jane@yourclinic.com"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {errors.ownerEmail && (
                        <p className="text-xs text-red-600 mt-1">{errors.ownerEmail.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('password')}
                          type="password"
                          placeholder="At least 8 characters"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Clinic */}
              {step === 1 && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Your clinic</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic name
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('clinicName')}
                          placeholder="Everwell Longevity Clinic"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {errors.clinicName && (
                        <p className="text-xs text-red-600 mt-1">{errors.clinicName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          {...register('clinicEmail')}
                          type="email"
                          placeholder="hello@yourclinic.com"
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {errors.clinicEmail && (
                        <p className="text-xs text-red-600 mt-1">{errors.clinicEmail.message}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Subdomain */}
              {step === 2 && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose your URL</h2>
                  <p className="text-sm text-gray-500 mb-3">
                    This is where your patients will book appointments.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subdomain
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                      <div className="flex items-center pl-3 pr-2 gap-1.5 bg-gray-50 border-r border-gray-300 h-full py-2.5">
                        <Globe className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        {...register('subdomain')}
                        placeholder="yourclinic"
                        className="flex-1 px-2 py-2.5 text-sm focus:outline-none"
                      />
                      <span className="pr-3 text-sm text-gray-400 whitespace-nowrap">
                        .medoflow.com
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p className="text-xs text-red-600 mt-1">{errors.subdomain.message}</p>
                    )}
                    {subdomain && subdomain.length >= 3 && !errors.subdomain && (
                      <p
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          checkingSubdomain
                            ? 'text-gray-400'
                            : subdomainAvailable
                              ? 'text-green-600'
                              : 'text-red-600'
                        }`}
                      >
                        {checkingSubdomain ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                          </>
                        ) : subdomainAvailable ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />{' '}
                            <strong>{subdomain}.medoflow.com</strong> is available
                          </>
                        ) : (
                          <>This subdomain is already taken. Try another.</>
                        )}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back
                </button>
              ) : (
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  Already have an account?
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || subdomainAvailable === false}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating clinic...
                    </>
                  ) : (
                    <>
                      Launch my clinic <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </div>
    </div>
  )
}

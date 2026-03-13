'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { joinByToken, grantConsent, type ConsultationSession } from '@/lib/consultationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AppButton } from '@/components/ui-system';
import { Skeleton } from '@/components/ui/skeleton';

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        NOT_STARTED: 'Waiting',
        READY: 'Ready',
        LIVE: 'In Session',
        RECORDING: 'Recording in Progress',
        ENDED: 'Session Ended',
        PROCESSING: 'Processing',
        TRANSCRIPT_READY: 'Complete',
        FAILED: 'Issue Detected',
    };
    return map[status] || status;
}

export default function PatientConsultationPage() {
    const params = useParams();
    const token = params.token as string;

    const [session, setSession] = useState<ConsultationSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [consenting, setConsenting] = useState(false);

    const loadSession = useCallback(async () => {
        try {
            setLoading(true);
            const s = await joinByToken(token);
            setSession(s);
        } catch {
            setError('This consultation link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    // Poll for status updates
    useEffect(() => {
        if (!session) return;
        const poll = setInterval(async () => {
            try {
                const s = await joinByToken(token);
                setSession(s);
            } catch {
                // ignore
            }
        }, 5000);
        return () => clearInterval(poll);
    }, [session, token]);

    const handleConsent = async () => {
        if (!session) return;
        try {
            setConsenting(true);
            setError(null);
            const updated = await grantConsent(session.id);
            setSession(updated);
        } catch {
            setError('Failed to grant consent. Please try again.');
        } finally {
            setConsenting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="space-y-6">
                <Link href="/dashboard/patient/appointments" className="inline-block text-sm text-primary-600 hover:text-primary-700">
                    ← Back to appointments
                </Link>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-5xl mb-4">🔗</div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                        <p className="text-gray-600 text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session) return null;

    const consentGranted = session.consentStatus === 'GRANTED';

    return (
        <div className="space-y-6">
            <Link
                href="/dashboard/patient/appointments"
                className="inline-block text-sm text-primary-600 hover:text-primary-700"
            >
                ← Back to appointments
            </Link>

            {/* Session info */}
            <Card>
                <CardHeader>
                    <CardTitle>Consultation Session</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        {session.provider && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    Dr. {session.provider.firstName} {session.provider.lastName}
                                </dd>
                            </div>
                        )}
                        {session.appointment?.startTime && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Scheduled</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {new Date(session.appointment.startTime).toLocaleString()}
                                </dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900">{statusLabel(session.status)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Consent</dt>
                            <dd className="mt-1">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${consentGranted
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {consentGranted ? 'Granted' : 'Pending'}
                                </span>
                            </dd>
                        </div>
                    </dl>

                    {/* Join Video Call button */}
                    {session.appointment?.meetLink && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <a
                                href={session.appointment.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Join Video Call
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Consent section */}
            {!consentGranted ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">🎙️</div>
                            <h2 className="text-lg font-bold text-gray-900">Recording Consent Required</h2>
                            <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                                Your provider would like to record this consultation for medical
                                documentation purposes. The recording will be used to generate
                                clinical notes only.
                            </p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                What happens with the recording:
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">✓</span>
                                    Audio is securely stored and encrypted
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">✓</span>
                                    Used to generate clinical documentation
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">✓</span>
                                    Provider reviews and approves all notes
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">✓</span>
                                    You&apos;ll only see approved summaries
                                </li>
                            </ul>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <AppButton
                            onClick={handleConsent}
                            disabled={consenting}
                            className="w-full"
                        >
                            {consenting ? 'Processing…' : 'I Consent to Recording'}
                        </AppButton>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-green-900 mb-2">Consent Granted</h2>
                        <p className="text-gray-600 text-sm">
                            You&apos;ve consented to recording. Your provider can now begin the consultation recording.
                        </p>

                        {session.status === 'RECORDING' && (
                            <div className="mt-6 px-4 py-3 bg-red-50 rounded-xl flex items-center justify-center gap-3">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-sm font-semibold text-red-800">Recording in Progress</span>
                            </div>
                        )}

                        {session.status === 'ENDED' && (
                            <div className="mt-6 px-4 py-3 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-700 font-medium">
                                    Session has ended. Thank you for your participation.
                                </p>
                            </div>
                        )}

                        {(session.status === 'PROCESSING' || session.status === 'TRANSCRIPT_READY') && (
                            <div className="mt-6 px-4 py-3 bg-indigo-50 rounded-xl">
                                <p className="text-sm text-indigo-700 font-medium">
                                    Your provider is processing the consultation notes. You&apos;ll see your summary once it&apos;s approved.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

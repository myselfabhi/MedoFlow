'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Types (minimal — patient only sees sanitized data)
// ---------------------------------------------------------------------------

interface PatientSession {
    id: string;
    status: string;
    recordingStatus: string;
    consentStatus: string;
    consentGrantedAt: string | null;
    joinToken: string;
    createdAt: string;
    appointment?: {
        id: string;
        startTime: string;
        endTime: string;
    };
    provider?: {
        firstName: string;
        lastName: string;
    };
    patient?: {
        id: string;
        name: string;
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const publicApi = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
});

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
        PENDING: 'Pending',
        GRANTED: 'Granted',
    };
    return map[status] || status;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PatientJoinPage() {
    const params = useParams();
    const token = params.token as string;

    const [session, setSession] = useState<PatientSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [consenting, setConsenting] = useState(false);
    const [consentGranted, setConsentGranted] = useState(false);

    // ----- Load session by token -----
    const loadSession = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await publicApi.get(`/consultations/join/${token}`);
            const s = data.data?.session ?? data.data;
            setSession(s);
            setConsentGranted(s.consentStatus === 'GRANTED');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ?? 'This consultation link is invalid or has expired.'
                );
            } else {
                setError('This consultation link is invalid or has expired.');
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    // ----- Poll session status -----
    useEffect(() => {
        if (!session) return;
        const poll = setInterval(async () => {
            try {
                const { data } = await publicApi.get(`/consultations/join/${token}`);
                const s = data.data?.session ?? data.data;
                setSession(s);
                setConsentGranted(s.consentStatus === 'GRANTED');
            } catch {
                // ignore
            }
        }, 5000);
        return () => clearInterval(poll);
    }, [session, token]);

    // ----- Grant consent -----
    const handleConsent = async () => {
        if (!session) return;
        try {
            setConsenting(true);
            setError(null);
            // Patient needs to be authenticated for consent
            // If auth token is available, use it
            const authToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            const headers: Record<string, string> = {};
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

            await axios.post(
                `${baseURL}/api/v1/consultations/${session.id}/consent`,
                {},
                { headers }
            );
            setConsentGranted(true);
            setSession((prev) => prev ? { ...prev, consentStatus: 'GRANTED' } : prev);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError('Please log in to your Medoflow account to grant consent.');
            } else {
                const msg = err instanceof Error ? err.message : 'Failed to grant consent';
                setError(msg);
            }
        } finally {
            setConsenting(false);
        }
    };

    // ----- Render -----

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading consultation...</p>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-5xl mb-4">🔗</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full space-y-6">
                {/* Header card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Medoflow Consultation</h1>
                        <p className="text-gray-500 text-sm mt-1">You&apos;ve been invited to a consultation session</p>
                    </div>

                    {/* Session info */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {session.provider && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Provider</span>
                                <span className="text-gray-900 font-medium">
                                    Dr. {session.provider.firstName} {session.provider.lastName}
                                </span>
                            </div>
                        )}
                        {session.appointment?.startTime && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Scheduled</span>
                                <span className="text-gray-900 font-medium">
                                    {new Date(session.appointment.startTime).toLocaleString()}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className="text-gray-900 font-medium">{statusLabel(session.status)}</span>
                        </div>
                    </div>
                </div>

                {/* Consent Card */}
                {!consentGranted && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">🎙️</div>
                            <h2 className="text-lg font-bold text-gray-900">Recording Consent Required</h2>
                            <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                                Your provider would like to record this consultation for medical documentation purposes.
                                The recording will be used to generate clinical notes only.
                            </p>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens with the recording:</h3>
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

                        <button
                            onClick={handleConsent}
                            disabled={consenting}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition text-sm"
                        >
                            {consenting ? 'Processing…' : 'I Consent to Recording'}
                        </button>
                    </div>
                )}

                {/* Consent granted state */}
                {consentGranted && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-green-900 mb-2">Consent Granted</h2>
                        <p className="text-gray-600 text-sm">
                            You&apos;ve consented to recording. Your provider can now begin the consultation recording.
                        </p>

                        {/* Recording indicator */}
                        {session.status === 'RECORDING' && (
                            <div className="mt-6 px-4 py-3 bg-red-50 rounded-xl flex items-center justify-center gap-3">
                                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-sm font-semibold text-red-800">Recording in Progress</span>
                            </div>
                        )}

                        {session.status === 'ENDED' && (
                            <div className="mt-6 px-4 py-3 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-700 font-medium">Session has ended. Thank you for your participation.</p>
                            </div>
                        )}

                        {(session.status === 'PROCESSING' || session.status === 'TRANSCRIPT_READY') && (
                            <div className="mt-6 px-4 py-3 bg-indigo-50 rounded-xl">
                                <p className="text-sm text-indigo-700 font-medium">
                                    Your provider is processing the consultation notes. You&apos;ll see your summary once it&apos;s approved and published.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-gray-400">
                    Powered by Medoflow · Your data is encrypted and secure
                </p>
            </div>
        </div>
    );
}

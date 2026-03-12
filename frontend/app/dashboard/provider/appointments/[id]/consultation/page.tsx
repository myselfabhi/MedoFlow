'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as consultationApi from '@/lib/consultationApi';
import * as aiScribeApi from '@/lib/aiScribeApi';
import { startConsultationRecordingFlow } from '@/lib/consultationRecordingFlow';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function statusLabel(status: string): string {
    const map: Record<string, string> = {
        NOT_STARTED: 'Not Started',
        READY: 'Ready',
        LIVE: 'Live',
        RECORDING: 'Recording',
        ENDED: 'Ended',
        PROCESSING: 'Processing',
        TRANSCRIPT_READY: 'Transcript Ready',
        FAILED: 'Failed',
        STOPPED: 'Stopped',
        UPLOADING: 'Uploading…',
        STORED: 'Stored',
        PENDING: 'Pending',
        GRANTED: 'Granted',
        DECLINED: 'Declined',
        TRANSCRIBING: 'Transcribing…',
        DRAFT_GENERATED: 'Draft Ready',
        EDITED: 'Edited',
        APPROVED: 'Approved',
    };
    return map[status] || status;
}

function statusColor(status: string): string {
    const colors: Record<string, string> = {
        READY: 'bg-blue-100 text-blue-800',
        LIVE: 'bg-green-100 text-green-800',
        RECORDING: 'bg-red-100 text-red-800',
        ENDED: 'bg-gray-100 text-gray-800',
        PROCESSING: 'bg-yellow-100 text-yellow-800',
        TRANSCRIPT_READY: 'bg-emerald-100 text-emerald-800',
        FAILED: 'bg-red-100 text-red-800',
        GRANTED: 'bg-green-100 text-green-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        STORED: 'bg-emerald-100 text-emerald-800',
        DRAFT_GENERATED: 'bg-indigo-100 text-indigo-800',
        APPROVED: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConsultationRoomPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.id as string;

    const [session, setSession] = useState<consultationApi.ConsultationSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [transcript, setTranscript] = useState<consultationApi.TranscriptResult | null>(null);
    const [aiScribeSession, setAiScribeSession] = useState<aiScribeApi.AIScribeSession | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftForm, setDraftForm] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    });
    const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);
    const initialized = useRef(false); // Add ref to prevent double initialization

    const recorder = useAudioRecorder();

    // ----- Load or create session -----
    const initSession = useCallback(async () => {
        if (initialized.current) return;
        try {
            initialized.current = true;
            setLoading(true);
            setError(null);
            const s = await consultationApi.startConsultation(appointmentId);
            setSession(s);
        } catch (err: unknown) {
            initialized.current = false; // Allow retry on failure
            const msg = err instanceof Error ? err.message : 'Failed to start consultation';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [appointmentId]);

    useEffect(() => {
        initSession();
    }, [initSession]);

    // ----- Refresh session -----
    const refreshSession = useCallback(async () => {
        if (!session) return;
        try {
            const s = await consultationApi.getSession(session.id);
            setSession(s);
        } catch {
            // ignore
        }
    }, [session?.id]); // Note: changed dependency to session?.id to avoid stale closures

    // ----- Poll for session status (like consent) -----
    useEffect(() => {
        if (!session || session.consentStatus === 'GRANTED') return;

        const poll = setInterval(() => {
            refreshSession();
        }, 3000);

        return () => clearInterval(poll);
    }, [session?.id, session?.consentStatus, refreshSession]);

    // ----- Poll AI scribe status while processing -----
    useEffect(() => {
        if (!session?.aiScribeSessionId) return;
        const aiSessionId = session.aiScribeSessionId;

        const poll = setInterval(async () => {
            try {
                const status = await aiScribeApi.getSessionStatus(aiSessionId);
                if (status.status === 'DRAFT_GENERATED' || status.status === 'FAILED') {
                    clearInterval(poll);
                    const transcriptData = await consultationApi.getTranscript(session.id);
                    setTranscript(transcriptData);
                    await refreshSession();
                    setTranscribing(false);
                }
            } catch {
                // ignore
            }
        }, 3000);

        setPollInterval(poll);
        return () => clearInterval(poll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.aiScribeSessionId]);

    // ----- Recording controls -----
    const handleStartRecording = async () => {
        if (!session) return;
        try {
            setError(null);
            const updated = await startConsultationRecordingFlow({
                startBrowserCapture: () => recorder.startRecording(),
                markRecordingStarted: () => consultationApi.startRecording(session.id),
                rollbackBrowserCapture: async () => {
                    recorder.cancelRecording();
                },
            });
            setSession(updated);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to start recording';
            setError(msg);
        }
    };

    const handleStopRecording = async () => {
        if (!session) return;
        try {
            setError(null);
            recorder.stopRecording();
            await consultationApi.stopRecording(session.id);
            setSession((prev) => prev ? { ...prev, status: 'ENDED', recordingStatus: 'STOPPED' } : prev);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to stop recording';
            setError(msg);
        }
    };

    // ----- Upload + Transcribe -----
    const handleUploadAndTranscribe = async () => {
        if (!session || !recorder.audioBlob) return;
        try {
            setError(null);
            setUploading(true);
            const updated = await consultationApi.uploadRecording(session.id, recorder.audioBlob);
            setSession(updated);
            setUploading(false);

            setTranscribing(true);
            const result = await consultationApi.startTranscription(session.id);
            setSession(result.session);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to upload/transcribe';
            setError(msg);
            setUploading(false);
            setTranscribing(false);
        }
    };

    // ----- Convert to template -----
    const handleConvertToTemplate = async () => {
        if (!session) return;
        try {
            setError(null);
            const result = await consultationApi.convertToTemplate(session.id);
            if (result.aiScribeSessionId) {
                const aiSession = await aiScribeApi.getSession(result.aiScribeSessionId);
                setAiScribeSession(aiSession);

                // Prepopulate the editable modal state
                const draft = aiSession.aiDraft as Record<string, string> | null;
                setDraftForm({
                    subjective: draft?.subjective || '',
                    objective: draft?.objective || '',
                    assessment: draft?.assessment || '',
                    plan: draft?.plan || ''
                });

                setShowDraftModal(true);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to convert to template';
            setError(msg);
        }
    };

    // ----- Load transcript -----
    const handleLoadTranscript = async () => {
        if (!session) return;
        try {
            const data = await consultationApi.getTranscript(session.id);
            setTranscript(data);
        } catch {
            // ignore
        }
    };

    // ----- Draft editing -----
    const handleApproveDraft = async () => {
        if (!aiScribeSession) return;
        try {
            // First update the draft to save manual user edits
            await aiScribeApi.updateDraft(aiScribeSession.id, draftForm);

            // Then approve the session
            const approved = await aiScribeApi.approveSession(aiScribeSession.id);
            setAiScribeSession(approved);
            setShowDraftModal(false);
            await refreshSession();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to approve draft';
            setError(msg);
        }
    };

    // ----- Render -----

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Session Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Consultation Room</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Patient: <span className="font-medium text-gray-700">{session.patient?.name ?? 'Unknown'}</span>
                            {session.provider && (
                                <> · Provider: <span className="font-medium text-gray-700">{session.provider.firstName} {session.provider.lastName}</span></>
                            )}
                        </p>
                        {session.appointment && (
                            <p className="text-sm text-gray-400 mt-0.5">
                                Appointment: {new Date(session.appointment.startTime).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {session.appointment?.meetLink && (
                            <a
                                href={session.appointment.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                </svg>
                                Join Video Call
                            </a>
                        )}
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(session.status)}`}>
                        Session: {statusLabel(session.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(session.recordingStatus)}`}>
                        Recording: {statusLabel(session.recordingStatus)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(session.consentStatus)}`}>
                        Consent: {statusLabel(session.consentStatus)}
                    </span>
                    {session.transcriptStatus && session.transcriptStatus !== 'NOT_STARTED' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(session.transcriptStatus)}`}>
                            Transcript: {statusLabel(session.transcriptStatus)}
                        </span>
                    )}
                </div>

            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-red-500 text-lg">⚠</span>
                    <div>
                        <p className="text-sm text-red-800">{error}</p>
                        <button onClick={() => setError(null)} className="text-xs text-red-500 underline mt-1">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Recorder error */}
            {recorder.error && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">{recorder.error}</p>
                </div>
            )}

            {/* Consent notice */}
            {session.consentStatus === 'PENDING' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <div className="text-3xl mb-3">🔒</div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Waiting for Patient Consent</h3>
                    <p className="text-sm text-amber-700 max-w-md mx-auto">
                        Recording cannot start until the patient grants consent using the join link above.
                        Share the link with the patient so they can join and consent to recording.
                    </p>
                </div>
            )}

            {/* Recording Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recording Controls</h2>

                <div className="flex items-center gap-4">
                    {/* Start recording */}
                    {!recorder.isRecording && session.recordingStatus !== 'STOPPED' && session.recordingStatus !== 'STORED' && (
                        <div className="flex flex-col items-start gap-2">
                            <button
                                onClick={handleStartRecording}
                                disabled={session.consentStatus !== 'GRANTED'}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                            >
                                <span className="w-3 h-3 bg-white rounded-full" />
                                Start AI Scribe (Share Meeting Tab)
                            </button>
                            <p className="text-xs text-gray-500 max-w-sm">
                                <b>Important:</b> To capture the patient's voice, please select the Google Meet tab and ensure <b>"Share tab audio"</b> is checked.
                            </p>
                        </div>
                    )}

                    {/* Stop recording */}
                    {recorder.isRecording && (
                        <button
                            onClick={handleStopRecording}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
                        >
                            <span className="w-3 h-3 bg-red-500 rounded-sm" />
                            Stop Recording
                        </button>
                    )}

                    {/* Duration */}
                    {recorder.isRecording && (
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-lg font-mono font-bold text-gray-900">
                                {formatDuration(recorder.duration)}
                            </span>
                        </div>
                    )}

                    {/* Upload */}
                    {recorder.audioBlob && !uploading && !transcribing && session.recordingStatus !== 'STORED' && (
                        <button
                            onClick={handleUploadAndTranscribe}
                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            Upload & Transcribe
                        </button>
                    )}

                    {/* Upload progress */}
                    {uploading && (
                        <div className="flex items-center gap-2 text-indigo-600">
                            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            <span className="text-sm font-medium">Uploading…</span>
                        </div>
                    )}

                    {/* Transcription progress */}
                    {transcribing && (
                        <div className="flex items-center gap-2 text-amber-600">
                            <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
                            <span className="text-sm font-medium">Transcribing & analyzing…</span>
                        </div>
                    )}
                </div>

                {/* Recording info */}
                {recorder.audioBlob && !recorder.isRecording && (
                    <p className="text-sm text-gray-500 mt-3">
                        Recording complete · {formatDuration(recorder.duration)} · {(recorder.audioBlob.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                )}
            </div>

            {/* Transcript Panel */}
            {(transcript || session.aiScribeSessionId) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                        <button
                            onClick={handleLoadTranscript}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Refresh
                        </button>
                    </div>

                    {transcript?.transcript ? (
                        <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {transcript.transcript}
                            </p>
                        </div>
                    ) : transcript ? (
                        <p className="text-sm text-gray-500 italic">
                            {transcript.transcriptStatus === 'PROCESSING' ? 'Transcription in progress…' : 'No transcript available yet.'}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Loading transcript status…</p>
                    )}

                    {/* AI Scribe status */}
                    {transcript?.aiScribeStatus && (
                        <div className="mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(transcript.aiScribeStatus)}`}>
                                AI Status: {statusLabel(transcript.aiScribeStatus)}
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {transcript?.errorMessage && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-sm text-red-700">{transcript.errorMessage}</p>
                        </div>
                    )}

                    {/* Convert to template button */}
                    {transcript?.aiScribeStatus === 'DRAFT_GENERATED' && (
                        <div className="mt-4">
                            <button
                                onClick={handleConvertToTemplate}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                            >
                                Convert to Doctor Template
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Manual documentation fallback */}
            {session.status === 'FAILED' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Processing Issue</h3>
                    <p className="text-sm text-amber-700 mb-4">
                        There was an issue with the transcript. You can still document notes manually using the standard visit record.
                    </p>
                    <button
                        onClick={() => router.push(`/dashboard/provider/visits`)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                        Go to Visit Records
                    </button>
                </div>
            )}

            {/* Draft Modal */}
            {showDraftModal && aiScribeSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Doctor Template — Draft</h2>
                                <button
                                    onClick={() => setShowDraftModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-amber-600 mt-1 font-medium">
                                ⚠ This is a draft. Review and approve before it becomes the final note.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {['subjective', 'objective', 'assessment', 'plan'].map((field) => {
                                const value = draftForm[field as keyof typeof draftForm] || '';
                                return (
                                    <div key={field}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                                            {field}
                                        </label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                                            value={value}
                                            onChange={(e) => setDraftForm(prev => ({ ...prev, [field]: e.target.value }))}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDraftModal(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveDraft}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                            >
                                Approve & Finalize
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

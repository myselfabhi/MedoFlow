'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as consultationApi from '@/lib/consultationApi';
import * as aiScribeApi from '@/lib/aiScribeApi';
import { startConsultationRecordingFlow } from '@/lib/consultationRecordingFlow';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAppToast } from '@/hooks/useAppToast';
import { JitsiVideoCall } from '@/components/consultation/JitsiVideoCall';

// UI System Components
import { PageContainer } from '@/components/layout/PageContainer';
import { AppCard, AppCardHeader, AppCardTitle, AppCardContent } from '@/components/ui-system/AppCard';
import { AppModal } from '@/components/ui-system/AppModal';
import { AppFormField } from '@/components/ui-system/AppFormField';
import { AppButton } from '@/components/ui-system/AppButton';
import { Textarea } from '@/components/ui/textarea';

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
        LIVE: 'bg-emerald-100 text-emerald-800',
        RECORDING: 'bg-red-100 text-red-800',
        ENDED: 'bg-slate-100 text-slate-800',
        PROCESSING: 'bg-amber-100 text-amber-800',
        TRANSCRIPT_READY: 'bg-emerald-100 text-emerald-800',
        FAILED: 'bg-red-100 text-red-800',
        GRANTED: 'bg-emerald-100 text-emerald-800',
        PENDING: 'bg-amber-100 text-amber-800',
        STORED: 'bg-emerald-100 text-emerald-800',
        DRAFT_GENERATED: 'bg-blue-100 text-blue-800',
        APPROVED: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
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
    const initialized = useRef(false);

    // ----- Video call state -----
    const [videoRoom, setVideoRoom] = useState<consultationApi.VideoRoomResult | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoActive, setVideoActive] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

    const recorder = useAudioRecorder();
    const toast = useAppToast();

    const handleSimulateClinicalConversation = async () => {
        if (!aiScribeSession || !session) return;
        try {
            setTranscribing(true);
            const updated = await aiScribeApi.simulateSession(aiScribeSession.id);
            setAiScribeSession(updated);
            setTranscript({
                sessionId: session.id,
                transcript: updated.transcript || '',
                transcriptStatus: 'COMPLETED',
                aiScribeStatus: 'DRAFT_GENERATED',
                aiDraft: updated.aiDraft,
                timeline: updated.timeline,
                errorMessage: null
            });
            toast.success('Clinical conversation simulated!');
        } catch (err) {
            toast.error('Failed to simulate conversation');
        } finally {
            setTranscribing(false);
        }
    };

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
            initialized.current = false;
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
    }, [session?.id]);

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

    // ----- Video Call Controls -----
    const handleStartVideoCall = async () => {
        if (!session) return;
        try {
            setVideoLoading(true);
            setError(null);
            const room = await consultationApi.createVideoRoom(session.id);
            setVideoRoom(room);
            setVideoActive(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create video room';
            setError(msg);
        } finally {
            setVideoLoading(false);
        }
    };

    const handleCallEnded = () => {
        setVideoActive(false);
        toast.success('Video call ended');
    };

    const handleRecordingData = (blob: Blob) => {
        setRecordingBlob(blob);
        toast.success('Audio captured from video call');
    };

    // ----- Upload recording from Daily.co -----
    const handleUploadDailyRecording = async () => {
        if (!session || !recordingBlob) return;
        try {
            setError(null);
            setUploading(true);
            const updated = await consultationApi.uploadRecording(session.id, recordingBlob);
            setSession(updated);
            setUploading(false);

            setTranscribing(true);
            const result = await consultationApi.startTranscription(session.id);
            setSession(result.session);
            setRecordingBlob(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to upload/transcribe';
            setError(msg);
            setUploading(false);
            setTranscribing(false);
        }
    };

    // ----- Recording controls (fallback manual recording) -----
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

    // ----- Upload + Transcribe (manual recording) -----
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
            await aiScribeApi.updateDraft(aiScribeSession.id, draftForm);
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
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error && !session) {
        return (
            <PageContainer>
                <AppCard className="max-w-2xl mx-auto border-red-200">
                    <AppCardContent className="p-8 text-center bg-red-50/50">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <p className="text-red-700 mb-6">{error}</p>
                        <AppButton variant="danger" onClick={() => router.back()}>
                            Go Back
                        </AppButton>
                    </AppCardContent>
                </AppCard>
            </PageContainer>
        );
    }

    if (!session) return null;

    const hasVideoRoom = videoActive && videoRoom;

    return (
        <PageContainer>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Consultation Room</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Secure AI-assisted clinical documentation
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AppButton variant="outline" onClick={() => router.back()}>
                        ← Back
                    </AppButton>
                    {!videoActive && (
                        <AppButton
                            variant="primary"
                            onClick={handleStartVideoCall}
                            disabled={videoLoading}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#1C8B81] to-[#223C58] hover:opacity-90"
                        >
                            {videoLoading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Start Video Call
                                </>
                            )}
                        </AppButton>
                    )}
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                    <span className="text-red-500 text-lg">⚠</span>
                    <div>
                        <p className="text-sm text-red-800">{error}</p>
                        <button onClick={() => setError(null)} className="text-xs text-red-500 hover:text-red-700 underline mt-1">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Recorder error */}
            {recorder.error && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800">{recorder.error}</p>
                </div>
            )}

            {/* Main Layout — Video + Scribe side-by-side when video is active */}
            <div className={`grid gap-8 ${hasVideoRoom ? 'grid-cols-1 xl:grid-cols-5' : 'grid-cols-1 lg:grid-cols-3'}`}>

                {/* Left Column — Video + Recording Controls */}
                <div className={hasVideoRoom ? 'xl:col-span-3 space-y-6' : 'lg:col-span-2 space-y-6'}>

                    {/* Jitsi Video Call */}
                    {hasVideoRoom && (
                        <JitsiVideoCall
                            roomName={videoRoom.roomName}
                            userName="Provider"
                            onCallEnded={handleCallEnded}
                            className="w-full"
                        />
                    )}

                    {/* Consent Notice */}
                    {session.consentStatus === 'PENDING' && (
                        <AppCard className="border-amber-200 bg-amber-50/50">
                            <AppCardContent className="text-center py-8">
                                <div className="text-3xl mb-3">🔒</div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-2">Waiting for Patient Consent</h3>
                                <p className="text-sm text-amber-700 max-w-md mx-auto">
                                    Recording cannot start until the patient grants consent using the join link. Share the link with the patient so they can join and consent to recording.
                                </p>
                                {session.joinToken && (
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                                        <p className="text-xs text-slate-500 mb-1">Patient Join Link:</p>
                                        <code className="text-xs text-slate-700 break-all select-all">
                                            {typeof window !== 'undefined' ? `${window.location.origin}/dashboard/patient/consultation/${session.joinToken}` : ''}
                                        </code>
                                    </div>
                                )}
                            </AppCardContent>
                        </AppCard>
                    )}

                    {/* AI Scribe Controls */}
                    <AppCard>
                        <AppCardHeader>
                            <AppCardTitle>AI Scribe Controls</AppCardTitle>
                        </AppCardHeader>
                        <AppCardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Daily.co recording upload */}
                                    {recordingBlob && !uploading && !transcribing && (
                                        <AppButton onClick={handleUploadDailyRecording} variant="primary" className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload & Transcribe Call Audio
                                        </AppButton>
                                    )}

                                    {/* Manual start recording (fallback when no video call) */}
                                    {!hasVideoRoom && !recorder.isRecording && session.recordingStatus !== 'STOPPED' && session.recordingStatus !== 'STORED' && !recordingBlob && (
                                        <AppButton
                                            onClick={handleStartRecording}
                                            disabled={session.consentStatus !== 'GRANTED'}
                                            variant="danger"
                                            className="flex items-center gap-2"
                                        >
                                            <span className="w-2.5 h-2.5 bg-white rounded-full" />
                                            Start AI Scribe (Manual Recording)
                                        </AppButton>
                                    )}

                                    {/* Stop recording */}
                                    {recorder.isRecording && (
                                        <AppButton
                                            onClick={handleStopRecording}
                                            variant="secondary"
                                            className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900"
                                        >
                                            <span className="w-3 h-3 bg-red-500 rounded-sm" />
                                            Stop Recording
                                        </AppButton>
                                    )}

                                    {/* Duration */}
                                    {recorder.isRecording && (
                                        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100">
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-mono font-bold">
                                                {formatDuration(recorder.duration)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Upload manual recording */}
                                    {recorder.audioBlob && !uploading && !transcribing && session.recordingStatus !== 'STORED' && (
                                        <AppButton onClick={handleUploadAndTranscribe} variant="primary">
                                            Upload & Transcribe
                                        </AppButton>
                                    )}

                                    {/* Demo Simulator */}
                                    {!recorder.isRecording && !uploading && !transcribing && aiScribeSession?.status === 'RECORDING' && (
                                        <AppButton
                                            onClick={handleSimulateClinicalConversation}
                                            variant="outline"
                                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold"
                                        >
                                            Demo: Simulate Conversation
                                        </AppButton>
                                    )}

                                    {/* Upload progress */}
                                    {uploading && (
                                        <div className="flex items-center gap-2 text-blue-600 px-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                            <span className="text-sm font-medium">Uploading…</span>
                                        </div>
                                    )}

                                    {/* Transcription progress */}
                                    {transcribing && (
                                        <div className="flex items-center gap-2 text-amber-600 px-2">
                                            <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
                                            <span className="text-sm font-medium">Transcribing & analyzing…</span>
                                        </div>
                                    )}
                                </div>

                                {/* Hint for video call recording */}
                                {hasVideoRoom && !recordingBlob && (
                                    <p className="text-xs text-slate-500 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <strong className="text-emerald-700">Tip:</strong> Click the{' '}
                                        <span className="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 font-medium">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            AI Scribe
                                        </span>{' '}
                                        button in the video controls to record audio for transcription.
                                    </p>
                                )}

                                {/* Manual recording hint */}
                                {!hasVideoRoom && !recorder.isRecording && session.recordingStatus !== 'STOPPED' && session.recordingStatus !== 'STORED' && !recordingBlob && (
                                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <strong className="text-slate-700">Tip:</strong> Start a video call above for the best experience, or use manual recording to capture audio from your browser.
                                    </p>
                                )}

                                {/* Recording info */}
                                {recorder.audioBlob && !recorder.isRecording && (
                                    <p className="text-sm text-slate-500">
                                        Recording complete · {formatDuration(recorder.duration)} · {(recorder.audioBlob.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                )}

                                {/* Daily recording info */}
                                {recordingBlob && (
                                    <p className="text-sm text-emerald-600 font-medium">
                                        Video call audio captured · {(recordingBlob.size / (1024 * 1024)).toFixed(1)} MB — Ready to transcribe
                                    </p>
                                )}
                            </div>
                        </AppCardContent>
                    </AppCard>

                    {/* Transcript Panel */}
                    {(transcript || session.aiScribeSessionId) && (
                        <AppCard>
                            <AppCardHeader className="flex flex-row items-center justify-between pb-4">
                                <AppCardTitle>Consultation Transcript</AppCardTitle>
                                <AppButton variant="ghost" size="sm" onClick={handleLoadTranscript} className="text-blue-600">
                                    Refresh
                                </AppButton>
                            </AppCardHeader>
                            <AppCardContent className="pt-0">
                                {transcript?.transcript ? (
                                    <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-100">
                                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-serif">
                                            {transcript.transcript}
                                        </p>
                                    </div>
                                ) : transcript ? (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        {transcript.transcriptStatus === 'PROCESSING' ? 'Transcription in progress…' : 'No transcript available yet.'}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        Loading transcript status…
                                    </p>
                                )}

                                {/* Convert to template button */}
                                {transcript?.aiScribeStatus === 'DRAFT_GENERATED' && (
                                    <div className="mt-6">
                                        <AppButton onClick={handleConvertToTemplate} variant="primary" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white">
                                            Generate SOAP Note Draft
                                        </AppButton>
                                    </div>
                                )}

                                {/* Error */}
                                {transcript?.errorMessage && (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <p className="text-sm text-red-700">{transcript.errorMessage}</p>
                                    </div>
                                )}
                            </AppCardContent>
                        </AppCard>
                    )}

                    {/* Manual documentation fallback */}
                    {session.status === 'FAILED' && (
                        <AppCard className="border-amber-200 bg-amber-50">
                            <AppCardContent className="text-center py-6">
                                <h3 className="text-lg font-semibold text-amber-900 mb-2">Processing Issue</h3>
                                <p className="text-sm text-amber-700 mb-4">
                                    There was an issue with the transcript. You can still document notes manually using the standard visit record.
                                </p>
                                <AppButton variant="primary" onClick={() => router.push(`/dashboard/provider/visits`)}>
                                    Go to Visit Records
                                </AppButton>
                            </AppCardContent>
                        </AppCard>
                    )}

                </div>

                {/* Right Rail — Patient Context & Status */}
                <div className={hasVideoRoom ? 'xl:col-span-2 space-y-6' : 'space-y-6'}>
                    <AppCard>
                        <AppCardHeader>
                            <AppCardTitle>Patient Context</AppCardTitle>
                        </AppCardHeader>
                        <AppCardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</label>
                                <p className="text-slate-900 font-medium">{session.patient?.name ?? 'Unknown'}</p>
                            </div>
                            {session.provider && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</label>
                                    <p className="text-slate-900">{session.provider.firstName} {session.provider.lastName}</p>
                                </div>
                            )}
                            {session.appointment && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Time</label>
                                    <p className="text-slate-900">{new Date(session.appointment.startTime).toLocaleString()}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Session Status</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Consultation</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor(session.status)}`}>
                                            {statusLabel(session.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Recording</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor(session.recordingStatus)}`}>
                                            {statusLabel(session.recordingStatus)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">Consent</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor(session.consentStatus)}`}>
                                            {statusLabel(session.consentStatus)}
                                        </span>
                                    </div>
                                    {videoActive && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Video Call</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                Active
                                            </span>
                                        </div>
                                    )}
                                    {session.transcriptStatus && session.transcriptStatus !== 'NOT_STARTED' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">Transcript</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor(session.transcriptStatus)}`}>
                                                {statusLabel(session.transcriptStatus)}
                                            </span>
                                        </div>
                                    )}
                                    {transcript?.aiScribeStatus && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">AI Scribe</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusColor(transcript.aiScribeStatus)}`}>
                                                {statusLabel(transcript.aiScribeStatus)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AppCardContent>
                    </AppCard>

                    {/* Join Token */}
                    {session.joinToken && (
                        <AppCard>
                            <AppCardHeader>
                                <AppCardTitle>Patient Join Link</AppCardTitle>
                            </AppCardHeader>
                            <AppCardContent>
                                <p className="text-xs text-slate-500 mb-2">Share this link with the patient to join the consultation:</p>
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <code className="text-xs text-slate-700 break-all select-all">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/dashboard/patient/consultation/${session.joinToken}` : ''}
                                    </code>
                                </div>
                                <AppButton
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={() => {
                                        const link = `${window.location.origin}/dashboard/patient/consultation/${session.joinToken}`;
                                        navigator.clipboard.writeText(link);
                                        toast.success('Link copied to clipboard');
                                    }}
                                >
                                    Copy Link
                                </AppButton>
                            </AppCardContent>
                        </AppCard>
                    )}

                    {/* Placeholder for future Vitals / History */}
                    <AppCard>
                        <AppCardHeader>
                            <AppCardTitle>Recent Vitals</AppCardTitle>
                        </AppCardHeader>
                        <AppCardContent>
                            <p className="text-sm text-slate-500 italic">No recent vitals recorded for this patient.</p>
                        </AppCardContent>
                    </AppCard>
                </div>

            </div>

            {/* Draft Modal */}
            <AppModal
                open={showDraftModal && aiScribeSession !== null}
                onOpenChange={setShowDraftModal}
                title="SOAP Note Draft"
                description="This draft was generated by the AI Scribe. Please review and make any necessary edits before finalizing."
                primaryAction={{ label: 'Approve & Finalize', onClick: handleApproveDraft }}
                secondaryAction={{ label: 'Cancel', onClick: () => setShowDraftModal(false) }}
                className="max-w-2xl"
                content={
                    <div className="space-y-5 mt-2">
                        {['subjective', 'objective', 'assessment', 'plan'].map((field) => (
                            <AppFormField
                                key={field}
                                label={field.charAt(0).toUpperCase() + field.slice(1)}
                            >
                                <Textarea
                                    value={draftForm[field as keyof typeof draftForm] || ''}
                                    onChange={(e) => setDraftForm(prev => ({ ...prev, [field]: e.target.value }))}
                                    className="min-h-[100px] resize-y font-serif text-sm"
                                    placeholder={`Enter ${field} notes...`}
                                />
                            </AppFormField>
                        ))}
                    </div>
                }
            />
        </PageContainer>
    );
}

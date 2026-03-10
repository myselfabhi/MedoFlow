'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mic,
  MicOff,
  Upload,
  RotateCcw,
  Save,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import {
  getSessionByVisitRecord,
  startSession,
  uploadAudio,
  getSession,
  processSession,
  updateDraft,
  regenerateDraft,
  approveSession,
  type AIScribeSession,
  type SoapDraft,
} from '@/lib/aiScribeApi';
import {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardContent,
  AppButton,
  AppBadge,
  AppPageHeader,
} from '@/components/ui-system';
import { ClinicalTimelineCard } from '@/components/aiScribe/ClinicalTimelineCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppToast } from '@/hooks/useAppToast';
import { useAuth } from '@/contexts/AuthContext';

const SYMPTOM_PATTERN =
  /\b(pain|swelling|fever|headache|nausea|fatigue|dizziness|cough|soreness|stiffness)\b/gi;
const BODY_PART_PATTERN =
  /\b(knee|back|shoulder|neck|arm|leg|wrist|ankle|hip|chest|abdomen|head)\b/gi;
const DURATION_PATTERN = /\b(\d+\s*(?:days?|weeks?|months?|years?))\b/gi;

function highlightTranscript(text: string): React.ReactNode {
  if (!text) return null;
  const parts: {
    type: 'symptom' | 'body' | 'duration' | 'plain';
    text: string;
  }[] = [];
  let lastIndex = 0;

  const allMatches: {
    index: number;
    length: number;
    type: 'symptom' | 'body' | 'duration';
  }[] = [];
  let m;
  const symptomRegex = new RegExp(SYMPTOM_PATTERN.source, 'gi');
  while ((m = symptomRegex.exec(text)) !== null) {
    allMatches.push({ index: m.index, length: m[0].length, type: 'symptom' });
  }
  const bodyRegex = new RegExp(BODY_PART_PATTERN.source, 'gi');
  while ((m = bodyRegex.exec(text)) !== null) {
    allMatches.push({ index: m.index, length: m[0].length, type: 'body' });
  }
  const durationRegex = new RegExp(DURATION_PATTERN.source, 'gi');
  while ((m = durationRegex.exec(text)) !== null) {
    allMatches.push({ index: m.index, length: m[0].length, type: 'duration' });
  }

  allMatches.sort((a, b) => a.index - b.index);
  const nonOverlapping: typeof allMatches = [];
  for (const m of allMatches) {
    if (
      nonOverlapping.length &&
      m.index <
        nonOverlapping[nonOverlapping.length - 1].index +
          nonOverlapping[nonOverlapping.length - 1].length
    )
      continue;
    nonOverlapping.push(m);
  }

  for (const match of nonOverlapping) {
    if (match.index > lastIndex) {
      parts.push({ type: 'plain', text: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: match.type,
      text: text.slice(match.index, match.index + match.length),
    });
    lastIndex = match.index + match.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'plain', text: text.slice(lastIndex) });
  }

  if (parts.length === 0) return text;

  const merged: { type: string; text: string }[] = [];
  for (const p of parts) {
    if (merged.length && merged[merged.length - 1].type === p.type) {
      merged[merged.length - 1].text += p.text;
    } else {
      merged.push({ ...p });
    }
  }

  return merged.map((p, i) => {
    if (p.type === 'plain') return p.text;
    const cls =
      p.type === 'symptom'
        ? 'bg-amber-100/80 text-amber-800 rounded px-0.5'
        : p.type === 'body'
          ? 'bg-accent/10 text-accent rounded px-0.5'
          : 'bg-slate-200/80 text-slate-700 rounded px-0.5';
    return (
      <span key={i} className={cls}>
        {p.text}
      </span>
    );
  });
}

const STATUS_BADGES: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'danger' | 'outline';
    className?: string;
  }
> = {
  RECORDING: { label: 'Recording', variant: 'danger' },
  TRANSCRIBING: {
    label: 'Processing',
    variant: 'secondary',
    className: 'bg-amber-100/80 text-amber-800 border-amber-200',
  },
  DRAFT_GENERATED: {
    label: 'Draft Ready',
    variant: 'default',
    className: 'bg-accent/10 text-accent border-accent/20',
  },
  EDITED: {
    label: 'Edited',
    variant: 'outline',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  APPROVED: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-success/10 text-success border-success/20',
  },
  FAILED: {
    label: 'Failed',
    variant: 'danger',
    className: 'bg-danger/10 text-danger border-danger/20',
  },
};

function SoapEditor({
  draft,
  onChange,
  onSave,
  onRegenerate,
  onApprove,
  isSaving,
  isRegenerating,
  isApproving,
  canEdit,
}: {
  draft: SoapDraft;
  onChange: (draft: SoapDraft) => void;
  onSave: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  isSaving: boolean;
  isRegenerating: boolean;
  isApproving: boolean;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {(['subjective', 'objective', 'assessment', 'plan'] as const).map(
          (field) => (
            <div key={field}>
              <label className="text-sm font-medium capitalize text-slate-700">
                {field}
              </label>
              <Textarea
                className="mt-1 min-h-[100px] rounded-xl border-slate-200"
                value={draft[field] || ''}
                onChange={(e) =>
                  onChange({ ...draft, [field]: e.target.value })
                }
                placeholder={`Enter ${field}...`}
                disabled={!canEdit}
              />
            </div>
          )
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <AppButton
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Regenerate
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </AppButton>
          </>
        )}
        <AppButton
          size="sm"
          onClick={onApprove}
          disabled={isApproving || !canEdit}
        >
          {isApproving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Approve Note
        </AppButton>
      </div>
    </div>
  );
}

export default function ProviderAIScribePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const visitRecordId = params.id as string;
  const appointmentId = searchParams.get('appointmentId');
  const toast = useAppToast();

  if (user?.role !== 'PROVIDER') {
    return (
      <div className="space-y-6">
        <AppCard>
          <AppCardContent>
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="font-medium text-amber-800">Access restricted</p>
              <p className="mt-1 text-sm text-amber-700">
                AI Scribe is only available to providers. Please contact a
                provider to document the consultation.
              </p>
            </div>
        <Link
          href={
            appointmentId
              ? `/dashboard/provider/appointments/${appointmentId}`
              : '/dashboard'
          }
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          ← Back
        </Link>
          </AppCardContent>
        </AppCard>
      </div>
    );
  }

  const queryClient = useQueryClient();
  const [localDraft, setLocalDraft] = useState<SoapDraft | null>(null);
  const [audioInputRef, setAudioInputRef] = useState<HTMLInputElement | null>(
    null
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['ai-scribe', 'session', visitRecordId],
    queryFn: () => getSessionByVisitRecord(visitRecordId),
    enabled: !!visitRecordId,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const s = query.state.data as AIScribeSession | undefined;
      if (s?.status === 'TRANSCRIBING') return 3000;
      return false;
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: () => startSession(visitRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      toast.success('Session started');
    },
    onError: () => toast.error('Failed to start session'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      uploadAudio(sessionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      toast.success('Audio uploaded, processing started');
    },
    onError: () => toast.error('Failed to upload audio'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({
      sessionId,
      draft,
    }: {
      sessionId: string;
      draft: SoapDraft;
    }) => updateDraft(sessionId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      toast.success('Draft saved');
    },
    onError: () => toast.error('Failed to save draft'),
  });

  const regenerateMutation = useMutation({
    mutationFn: (sessionId: string) => regenerateDraft(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      toast.success('Regenerating draft...');
    },
    onError: () => toast.error('Failed to regenerate'),
  });

  const retryMutation = useMutation({
    mutationFn: (sessionId: string) => processSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      toast.success('Retrying processing...');
    },
    onError: () => toast.error('Failed to retry processing'),
  });

  const approveMutation = useMutation({
    mutationFn: (sessionId: string) => approveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-scribe', 'session', visitRecordId],
      });
      queryClient.invalidateQueries({ queryKey: ['visit', visitRecordId] });
      toast.success('Note approved and finalized');
    },
    onError: () => toast.error('Failed to approve'),
  });

  const handleStartRecording = useCallback(async () => {
    if (!session) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        uploadMutation.mutate({ sessionId: session.id, file });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      toast.error('Microphone access denied');
    }
  }, [session, uploadMutation, toast]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const handleUploadClick = () => audioInputRef?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && session) {
      uploadMutation.mutate({ sessionId: session.id, file });
    }
    e.target.value = '';
  };

  const draft =
    localDraft ??
    session?.aiDraft ?? {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };

  const canEdit =
    session?.status === 'DRAFT_GENERATED' || session?.status === 'EDITED';
  const isProcessing = session?.status === 'TRANSCRIBING';
  const isFailed = session?.status === 'FAILED';

  React.useEffect(() => {
    if (session?.aiDraft) {
      setLocalDraft(session.aiDraft);
    }
  }, [session?.aiDraft]);

  if (sessionLoading && !session) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={
          appointmentId ||
          session?.visitRecord?.appointmentId
            ? `/dashboard/provider/appointments/${appointmentId || session?.visitRecord?.appointmentId}`
            : '/dashboard/provider/calendar'
        }
        className="inline-block text-sm text-accent hover:underline"
      >
        ← Back to appointment
      </Link>

      <AppPageHeader
        title="AI Scribe"
        description="Record or upload consultation audio for automated documentation"
        actions={
          session && (
            <AppBadge
              variant={STATUS_BADGES[session.status]?.variant ?? 'secondary'}
              className={STATUS_BADGES[session.status]?.className}
            >
              {STATUS_BADGES[session.status]?.label ?? session.status}
            </AppBadge>
          )
        }
      />

      {!session ? (
        <AppCard>
          <AppCardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-sm text-slate-600">
              Start an AI Scribe session to record or upload consultation audio.
            </p>
            <AppButton
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending}
            >
              {startSessionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Start Recording
            </AppButton>
          </AppCardContent>
        </AppCard>
      ) : (
        <>
          {isFailed && (
            <AppCard>
              <AppCardContent>
                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                  <p className="font-medium text-danger">AI processing failed.</p>
                  <p className="mt-1 text-sm text-danger/90">
                    {session.errorMessage ||
                      'An error occurred during processing.'}{' '}
                    Please try regenerating the draft.
                  </p>
                  {session.audioUrl && (
                    <AppButton
                      variant="outline"
                      size="sm"
                      className="mt-3 border-danger/30 text-danger hover:bg-danger/10"
                      onClick={() => retryMutation.mutate(session.id)}
                      disabled={retryMutation.isPending}
                    >
                      {retryMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Retry Processing
                    </AppButton>
                  )}
                </div>
              </AppCardContent>
            </AppCard>
          )}

          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Actions</AppCardTitle>
            </AppCardHeader>
            <AppCardContent>
              <div className="flex flex-wrap gap-2">
                {session.status === 'RECORDING' && (
                  <>
                    <AppButton
                      variant="destructive"
                      size="sm"
                      onClick={handleStartRecording}
                      disabled={uploadMutation.isPending}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </AppButton>
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={handleStopRecording}
                      disabled={!mediaRecorderRef.current}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Recording
                    </AppButton>
                  </>
                )}
                {(session.status === 'RECORDING' ||
                  session.status === 'TRANSCRIBING' ||
                  isFailed) && (
                  <>
                    <input
                      ref={setAudioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={handleUploadClick}
                      disabled={
                        uploadMutation.isPending || isProcessing
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Audio
                    </AppButton>
                  </>
                )}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transcribing and generating draft...
                  </div>
                )}
              </div>
            </AppCardContent>
          </AppCard>

          {session.transcript && (
            <AppCard>
              <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle>Transcript</AppCardTitle>
                <AppBadge variant="outline" className="text-xs">
                  AI Confidence:{' '}
                  {session.transcript.length > 1000
                    ? 'High'
                    : session.transcript.length >= 400
                      ? 'Medium'
                      : 'Low'}
                </AppBadge>
              </AppCardHeader>
              <AppCardContent>
                <ScrollArea className="h-[180px] w-full rounded-xl border border-slate-200/80 p-4">
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {highlightTranscript(session.transcript)}
                  </p>
                </ScrollArea>
              </AppCardContent>
            </AppCard>
          )}

          {session.timeline && (
            <ClinicalTimelineCard timeline={session.timeline} />
          )}

          {(session.status === 'DRAFT_GENERATED' ||
            session.status === 'EDITED' ||
            session.status === 'APPROVED') && (
            <AppCard>
              <AppCardHeader>
                <AppCardTitle>SOAP Editor</AppCardTitle>
              </AppCardHeader>
              <AppCardContent>
                <SoapEditor
                  draft={draft}
                  onChange={setLocalDraft}
                  onSave={() =>
                    saveDraftMutation.mutate({
                      sessionId: session.id,
                      draft,
                    })
                  }
                  onRegenerate={() =>
                    regenerateMutation.mutate(session.id)
                  }
                  onApprove={() => approveMutation.mutate(session.id)}
                  isSaving={saveDraftMutation.isPending}
                  isRegenerating={regenerateMutation.isPending}
                  isApproving={approveMutation.isPending}
                  canEdit={
                    canEdit && !session.visitRecord?.isFinalized
                  }
                />
              </AppCardContent>
            </AppCard>
          )}
        </>
      )}
    </div>
  );
}

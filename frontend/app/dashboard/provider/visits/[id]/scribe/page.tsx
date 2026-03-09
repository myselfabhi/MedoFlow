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
import { getVisitByAppointment } from '@/lib/patientApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppToast } from '@/hooks/useAppToast';

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  RECORDING: { label: 'Recording', variant: 'destructive' },
  TRANSCRIBING: { label: 'Processing', variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  DRAFT_GENERATED: { label: 'Draft Ready', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  EDITED: { label: 'Edited', variant: 'outline', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  APPROVED: { label: 'Approved', variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
  FAILED: { label: 'Failed', variant: 'destructive' },
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
              <label className="text-sm font-medium capitalize text-gray-700">
                {field}
              </label>
              <Textarea
                className="mt-1 min-h-[100px]"
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
            <Button
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
            </Button>
            <Button
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
            </Button>
          </>
        )}
        <Button
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
        </Button>
      </div>
    </div>
  );
}

export default function ProviderAIScribePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const visitRecordId = params.id as string;
  const appointmentId = searchParams.get('appointmentId');
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [localDraft, setLocalDraft] = useState<SoapDraft | null>(null);
  const [audioInputRef, setAudioInputRef] = useState<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['ai-scribe', 'session', visitRecordId],
    queryFn: () => getSessionByVisitRecord(visitRecordId),
    enabled: !!visitRecordId,
    refetchInterval: (query) => {
      const s = query.state.data as AIScribeSession | undefined;
      if (s?.status === 'TRANSCRIBING') return 3000;
      return false;
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: () => startSession(visitRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
      toast.success('Session started');
    },
    onError: () => toast.error('Failed to start session'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      uploadAudio(sessionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
      toast.success('Audio uploaded, processing started');
    },
    onError: () => toast.error('Failed to upload audio'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ sessionId, draft }: { sessionId: string; draft: SoapDraft }) =>
      updateDraft(sessionId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
      toast.success('Draft saved');
    },
    onError: () => toast.error('Failed to save draft'),
  });

  const regenerateMutation = useMutation({
    mutationFn: (sessionId: string) => regenerateDraft(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
      toast.success('Regenerating draft...');
    },
    onError: () => toast.error('Failed to regenerate'),
  });

  const retryMutation = useMutation({
    mutationFn: (sessionId: string) => processSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
      toast.success('Retrying processing...');
    },
    onError: () => toast.error('Failed to retry processing'),
  });

  const approveMutation = useMutation({
    mutationFn: (sessionId: string) => approveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-scribe', 'session', visitRecordId] });
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
    } catch (err) {
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

  const draft = localDraft ?? session?.aiDraft ?? {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  };

  const canEdit =
    session?.status === 'DRAFT_GENERATED' ||
    session?.status === 'EDITED';
  const isProcessing = session?.status === 'TRANSCRIBING';
  const isFailed = session?.status === 'FAILED';

  React.useEffect(() => {
    if (session?.aiDraft && !localDraft) {
      setLocalDraft(session.aiDraft);
    }
  }, [session?.aiDraft, localDraft]);

  if (sessionLoading && !session) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={
          appointmentId ||
          session?.visitRecord?.appointmentId
            ? `/dashboard/provider/appointments/${appointmentId || session?.visitRecord?.appointmentId}`
            : '/dashboard/provider/calendar'
        }
        className="inline-block text-sm text-primary-600 hover:text-primary-700"
      >
        ← Back to appointment
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>AI Scribe</CardTitle>
            {session && (
              <Badge
                variant={STATUS_BADGES[session.status]?.variant ?? 'secondary'}
                className={STATUS_BADGES[session.status]?.className}
              >
                {STATUS_BADGES[session.status]?.label ?? session.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-gray-500">
                Start an AI Scribe session to record or upload consultation audio.
              </p>
              <Button
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
              >
                {startSessionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Start Recording
              </Button>
            </div>
          ) : (
            <>
              {isFailed && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                  <p className="font-medium">AI processing failed.</p>
                  <p className="mt-1 text-sm">
                    {session.errorMessage || 'An error occurred during processing.'} Please try regenerating the draft.
                  </p>
                  {session.audioUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                      onClick={() => retryMutation.mutate(session.id)}
                      disabled={retryMutation.isPending}
                    >
                      {retryMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Retry Processing
                    </Button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {session.status === 'RECORDING' && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStartRecording}
                      disabled={uploadMutation.isPending}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopRecording}
                      disabled={!mediaRecorderRef.current}
                    >
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  </>
                )}
                {(session.status === 'RECORDING' || session.status === 'TRANSCRIBING' || isFailed) && (
                  <>
                    <input
                      ref={setAudioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadClick}
                      disabled={uploadMutation.isPending || isProcessing}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Audio
                    </Button>
                  </>
                )}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transcribing and generating draft...
                  </div>
                )}
              </div>

              {(session.status === 'DRAFT_GENERATED' ||
                session.status === 'EDITED' ||
                session.status === 'APPROVED') && (
                <SoapEditor
                  draft={draft}
                  onChange={setLocalDraft}
                  onSave={() =>
                    saveDraftMutation.mutate({ sessionId: session.id, draft })
                  }
                  onRegenerate={() => regenerateMutation.mutate(session.id)}
                  onApprove={() => approveMutation.mutate(session.id)}
                  isSaving={saveDraftMutation.isPending}
                  isRegenerating={regenerateMutation.isPending}
                  isApproving={approveMutation.isPending}
                  canEdit={canEdit && !session.visitRecord?.isFinalized}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

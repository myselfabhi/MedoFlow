import api from './api'

export type VoicePersona = 'WARM' | 'PROFESSIONAL' | 'UPBEAT'

export type VoiceCallStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TRANSFERRED' | 'ABANDONED'

export type VoiceCallOutcome =
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'MESSAGE_TAKEN'
  | 'REFILL_REQUESTED'
  | 'INFO_PROVIDED'
  | 'TRANSFERRED_TO_HUMAN'
  | 'NO_ACTION'

export type RealtimeVoice =
  | 'alloy'
  | 'ash'
  | 'ballad'
  | 'coral'
  | 'echo'
  | 'sage'
  | 'shimmer'
  | 'verse'

export interface VoiceAgentConfig {
  id: string
  clinicId: string
  enabled: boolean
  greeting: string
  persona: VoicePersona
  voice: RealtimeVoice
  businessHours: Record<string, { open: string; close: string }> | null
  afterHoursMessage: string
  escalationPhone: string | null
  capabilities: Record<string, boolean>
  systemPromptExtra: string | null
}

export interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface VoiceCall {
  id: string
  clinicId: string
  channel: 'BROWSER' | 'PHONE'
  status: VoiceCallStatus
  outcome: VoiceCallOutcome | null
  callerName: string | null
  callerPhone: string | null
  patientId: string | null
  startedAt: string
  endedAt: string | null
  durationSec: number
  transcript: TranscriptEntry[]
  summary: string | null
  events?: VoiceCallEvent[]
}

export interface VoiceCallEvent {
  id: string
  callId: string
  type: string
  toolName: string | null
  argsJson: unknown
  resultJson: unknown
  errorMessage: string | null
  ts: string
}

export interface RealtimeSession {
  sessionId: string
  clientSecret: string
  expiresAt: number
  model: string
  voice: string
  tools: unknown[]
  systemPrompt: string
}

const unwrap = <T>(p: Promise<{ data: { data: T } }>): Promise<T> => p.then((r) => r.data.data)

export const voiceAgentApi = {
  getConfig: () => unwrap<VoiceAgentConfig>(api.get('/voice-agent/config')),

  updateConfig: (patch: Partial<VoiceAgentConfig>) =>
    unwrap<VoiceAgentConfig>(api.put('/voice-agent/config', patch)),

  createSession: () => unwrap<RealtimeSession>(api.post('/voice-agent/session')),

  startCall: () => unwrap<VoiceCall>(api.post('/voice-agent/calls')),

  endCall: (
    id: string,
    patch: {
      status?: VoiceCallStatus
      outcome?: VoiceCallOutcome
      transcript?: TranscriptEntry[]
      durationSec?: number
      callerName?: string
      patientId?: string
    }
  ) => unwrap<VoiceCall>(api.patch(`/voice-agent/calls/${id}`, patch)),

  listCalls: (limit = 30) =>
    unwrap<VoiceCall[]>(api.get('/voice-agent/calls', { params: { limit } })),

  getCall: (id: string) => unwrap<VoiceCall>(api.get(`/voice-agent/calls/${id}`)),

  summarizeCall: (id: string) => unwrap<VoiceCall>(api.post(`/voice-agent/calls/${id}/summarize`)),

  executeTool: (callId: string, toolName: string, args: Record<string, unknown>) =>
    unwrap<{ result: unknown }>(api.post('/voice-agent/tools/execute', { callId, toolName, args })),

  getGreeting: () =>
    unwrap<{
      greeting: string
      audioBase64?: string
      audioMime?: string
      ttsError?: string
    }>(api.get('/voice-agent/greeting')),

  speak: (text: string) =>
    unwrap<{ audioBase64: string; audioMime: string }>(api.post('/voice-agent/speak', { text })),

  runTurn: (callId: string, audio: Blob, mimeType: string) => {
    const form = new FormData()
    form.append('callId', callId)
    form.append('audio', audio, `turn.${mimeType.includes('webm') ? 'webm' : 'wav'}`)
    return unwrap<{
      userText: string
      assistantText: string
      toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }>
      transcript: TranscriptEntry[]
      audioBase64?: string
      audioMime?: string
      ttsError?: string
    }>(
      api.post('/voice-agent/turn', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
}

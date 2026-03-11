/**
 * AI Provider Service — Self-hosted AI backend
 *
 * Transcription: whisper.cpp via nodejs-whisper (local, no API key)
 * LLM (SOAP notes, patient summaries): Ollama REST API (local, no API key)
 *
 * No external API dependencies. No billing. No quota limits.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { nodewhisper } from 'nodejs-whisper';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const WHISPER_MODEL_SIZE = process.env.WHISPER_MODEL_SIZE || 'small.en';

// ---------------------------------------------------------------------------
// Transcription — whisper.cpp via nodejs-whisper
// ---------------------------------------------------------------------------

export async function transcribeAudio(
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    const ext = mimeType.includes('webm')
        ? 'webm'
        : mimeType.includes('mp3')
            ? 'mp3'
            : mimeType.includes('wav')
                ? 'wav'
                : mimeType.includes('m4a')
                    ? 'm4a'
                    : 'webm';

    const tmpPath = path.join(os.tmpdir(), `whisper-${Date.now()}.${ext}`);
    fs.writeFileSync(tmpPath, buffer);

    const originalCwd = process.cwd();
    try {
        const result = await nodewhisper(tmpPath, {
            modelName: WHISPER_MODEL_SIZE,
            autoDownloadModelName: WHISPER_MODEL_SIZE,
            removeWavFileAfterTranscription: true,
            withCuda: false,
            whisperOptions: {
                outputInText: true,
                outputInSrt: false,
                outputInVtt: false,
                outputInCsv: false,
                translateToEnglish: false,
                wordTimestamps: false,
                timestamps_length: 60,
            },
        });

        // nodejs-whisper returns the transcript as a string or array
        const output: unknown = result;
        if (typeof output === 'string') {
            return output.trim();
        }
        if (Array.isArray(output)) {
            return (output as Array<{ speech?: string; text?: string }>)
                .map((segment) => segment.speech || segment.text || '')
                .join(' ')
                .trim();
        }
        return String(output).trim();
    } finally {
        try {
            process.chdir(originalCwd);
        } catch {
            // ignore
        }
        try {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        } catch {
            // ignore cleanup errors
        }
    }
}

// ---------------------------------------------------------------------------
// LLM Chat Completion — Ollama REST API
// ---------------------------------------------------------------------------

export interface ChatCompletionOptions {
    systemPrompt: string;
    userMessage: string;
    jsonMode?: boolean;
    temperature?: number;
}

export async function chatCompletion(
    options: ChatCompletionOptions
): Promise<string> {
    const { systemPrompt, userMessage, jsonMode = false, temperature = 0.3 } = options;

    const body = {
        model: OLLAMA_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        stream: false,
        options: {
            temperature,
        },
        ...(jsonMode ? { format: 'json' } : {}),
    };

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
            `Ollama request failed (${response.status}): ${errorText}. ` +
            `Is Ollama running at ${OLLAMA_URL}? Try: ollama serve`
        );
    }

    const data = await response.json() as {
        message?: { content?: string };
    };

    const content = data.message?.content;
    if (!content) {
        throw new Error('No response from Ollama');
    }

    return content.trim();
}

// ---------------------------------------------------------------------------
// Health check — verify Ollama is reachable
// ---------------------------------------------------------------------------

export async function checkOllamaHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Model info
// ---------------------------------------------------------------------------

export function getConfig() {
    return {
        provider: 'self-hosted',
        ollamaUrl: OLLAMA_URL,
        ollamaModel: OLLAMA_MODEL,
        whisperModelSize: WHISPER_MODEL_SIZE,
    };
}

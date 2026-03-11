'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number; // seconds
    error: string | null;
    audioBlob: Blob | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
}

/**
 * React hook wrapping browser MediaRecorder API for consultation audio capture.
 * - Requests microphone permission
 * - Records audio as webm/opus (or fallback)
 * - Tracks recording duration
 * - Returns blob on stop
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const getMimeType = (): string => {
        const preferred = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ];
        for (const mime of preferred) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
                return mime;
            }
        }
        return 'audio/webm'; // fallback
    };

    const startRecording = useCallback(async () => {
        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];

        // Check support
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            setError('Audio recording is not supported in this browser');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });
            streamRef.current = stream;

            const mimeType = getMimeType();
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setIsRecording(false);
                setIsPaused(false);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((t) => t.stop());
                    streamRef.current = null;
                }

                // Stop timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };

            recorder.onerror = () => {
                setError('Recording error occurred');
                setIsRecording(false);
            };

            // Request data every second for reliable chunking
            recorder.start(1000);
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Duration timer
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } catch (err) {
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('Microphone permission denied. Please allow access to your microphone.');
                } else if (err.name === 'NotFoundError') {
                    setError('No microphone found. Please connect a microphone.');
                } else {
                    setError(`Microphone error: ${err.message}`);
                }
            } else {
                setError('Failed to start recording');
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        setAudioBlob(null);
        setDuration(0);
        setError(null);
        chunksRef.current = [];
    }, []);

    return {
        isRecording,
        isPaused,
        duration,
        error,
        audioBlob,
        startRecording,
        stopRecording,
        resetRecording,
    };
}

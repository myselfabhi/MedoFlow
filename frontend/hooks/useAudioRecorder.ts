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
        const fail = (message: string): never => {
            setError(message);
            throw new Error(message);
        };

        setError(null);
        setAudioBlob(null);
        chunksRef.current = [];

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices?.getDisplayMedia) {
            fail('Screen and audio recording are not fully supported in this browser');
        }

        try {
            // 1. Get Provider Microphone
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            // 2. Get Tab/System Audio (Patient Voice via Meet)
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'browser' }, // Required by some browsers to prompt for tab
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            // If the user didn't check "Share tab audio", the audio track will be missing
            const displayAudioTracks = displayStream.getAudioTracks();
            if (displayAudioTracks.length === 0) {
                // Stop everything and throw clear error
                micStream.getTracks().forEach(t => t.stop());
                displayStream.getTracks().forEach(t => t.stop());
                fail('You must check the "Share tab audio" box when selecting the Google Meet tab.');
            }

            // 3. Mix the two audio streams using Web Audio API
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();

            const micSource = audioContext.createMediaStreamSource(micStream);
            const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks));

            const destination = audioContext.createMediaStreamDestination();

            micSource.connect(destination);
            displaySource.connect(destination);

            // Create a custom mixed stream
            const mixedStream = destination.stream;
            streamRef.current = mixedStream;

            const mimeType = getMimeType();
            const recorder = new MediaRecorder(mixedStream, { mimeType });
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

                micStream.getTracks().forEach(t => t.stop());
                displayStream.getTracks().forEach(t => t.stop());
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                    streamRef.current = null;
                }

                audioContext.close().catch(console.error);

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };

            recorder.onerror = () => {
                setError('Recording error occurred');
                setIsRecording(false);
            };

            recorder.start(1000);
            setIsRecording(true);
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            // Handle user clicking "Stop sharing" natively in browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording(); // Trigger our internal stop
            };

        } catch (err) {
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    fail('Permission denied. Please allow microphone and screen recording access.');
                } else if (err.name === 'NotFoundError') {
                    fail('Required hardware not found.');
                } else {
                    fail(`Recording error: ${err.message}`);
                }
            } else {
                if (err instanceof Error) {
                    throw err;
                }
                fail('Failed to start recording');
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

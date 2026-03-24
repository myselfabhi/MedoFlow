'use client';

import React, { useEffect, useRef, useState } from 'react';

interface JitsiVideoCallProps {
    roomName: string;
    userName?: string;
    onCallEnded?: () => void;
    className?: string;
}

declare global {
    interface Window {
        JitsiMeetExternalAPI: new (domain: string, options: object) => {
            dispose: () => void;
            addEventListener: (event: string, handler: (data?: any) => void) => void;
            executeCommand: (command: string, ...args: any[]) => void;
        };
    }
}

// ---------------------------------------------------------------------------
// Module-level script loader — loads external_api.js exactly once across
// React StrictMode double-invocations and multiple component mounts.
// ---------------------------------------------------------------------------
type ReadyCallback = () => void;

let scriptState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
const pendingCallbacks: ReadyCallback[] = [];

function loadJitsiScript(onReady: ReadyCallback, onError: () => void): () => void {
    if (scriptState === 'ready') {
        // Already loaded — call synchronously on next tick to keep effect flow clean
        const t = setTimeout(onReady, 0);
        return () => clearTimeout(t);
    }
    if (scriptState === 'error') {
        const t = setTimeout(onError, 0);
        return () => clearTimeout(t);
    }

    // Register our callback so it can be cancelled by cleanup
    pendingCallbacks.push(onReady);
    const removeCallback = () => {
        const i = pendingCallbacks.indexOf(onReady);
        if (i !== -1) pendingCallbacks.splice(i, 1);
    };

    if (scriptState === 'idle') {
        scriptState = 'loading';
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            scriptState = 'ready';
            const cbs = pendingCallbacks.splice(0);
            cbs.forEach(cb => cb());
        };
        script.onerror = () => {
            scriptState = 'error';
            pendingCallbacks.splice(0);
            onError();
        };
        document.head.appendChild(script);
    }
    // If 'loading' — already added to pendingCallbacks above, done

    return removeCallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JitsiVideoCall({
    roomName,
    userName,
    onCallEnded,
    className = '',
}: JitsiVideoCallProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const onCallEndedRef = useRef(onCallEnded);
    const [scriptError, setScriptError] = useState(false);

    useEffect(() => { onCallEndedRef.current = onCallEnded; }, [onCallEnded]);

    useEffect(() => {
        if (!roomName) return;

        let cancelled = false;
        let unregisterScript: (() => void) | null = null;

        const createApi = () => {
            if (cancelled || !containerRef.current) return;

            try {
                const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
                    roomName,
                    parentNode: containerRef.current,
                    userInfo: { displayName: userName || 'Participant' },
                    width: '100%',
                    height: '100%',
                    configOverwrite: {
                        // Let Jitsi handle media itself — don't force start states
                        // which cause fatal errors when permissions are blocked
                        prejoinPageEnabled: true,   // show lobby so user can choose devices
                        disableDeepLinking: true,
                        enableWelcomePage: false,
                        disableInviteFunctions: true,
                        toolbarButtons: [
                            'microphone', 'camera', 'hangup',
                            'chat', 'tileview', 'fullscreen', 'settings',
                        ],
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_POWERED_BY: false,
                        HIDE_INVITE_MORE_HEADER: true,
                        MOBILE_APP_PROMO: false,
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                    },
                });

                // Disposed before constructor returned (StrictMode teardown)
                if (cancelled) {
                    try { api.dispose(); } catch {}
                    return;
                }

                apiRef.current = api;

                api.addEventListener('readyToClose', () => {
                    onCallEndedRef.current?.();
                });

                // Only log non-fatal errors to console — don't surface them to UI.
                // Jitsi shows its own error messages inside the iframe for all
                // recoverable issues (permissions, ICE, etc.).
                api.addEventListener('errorOccurred', (evt: any) => {
                    const isFatal = evt?.error?.isFatal ?? false;
                    const name = evt?.error?.name ?? 'unknown';
                    const msg = evt?.error?.message ?? '';
                    if (isFatal) {
                        console.error('[Jitsi] Fatal error:', name, msg);
                    } else {
                        console.warn('[Jitsi] Non-fatal error (handled internally):', name, msg);
                    }
                    // We intentionally do NOT show a UI overlay here.
                    // Jitsi handles all errors (fatal or not) with its own in-frame UI.
                });

            } catch (err: any) {
                console.error('[Jitsi] Failed to instantiate API:', err);
            }
        };

        if (typeof window !== 'undefined') {
            if (window.JitsiMeetExternalAPI) {
                createApi();
            } else {
                unregisterScript = loadJitsiScript(createApi, () => {
                    if (!cancelled) setScriptError(true);
                });
            }
        }

        return () => {
            cancelled = true;
            unregisterScript?.();
            if (apiRef.current) {
                try { apiRef.current.dispose(); } catch {}
                apiRef.current = null;
            }
        };
    }, [roomName, userName]);

    if (scriptError) {
        return (
            <div
                className={`flex items-center justify-center rounded-2xl bg-slate-900 ${className}`}
                style={{ minHeight: '520px' }}
            >
                <div className="text-center p-6">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-white/80 text-sm mb-2">
                        Could not load video call.<br />
                        <span className="text-white/50 text-xs">Check your internet connection and try refreshing.</span>
                    </p>
                    <button
                        onClick={() => { setScriptError(false); scriptState = 'idle'; }}
                        className="mt-3 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 ${className}`}
            style={{ minHeight: '520px' }}
        >
            {/* Jitsi renders its full UI here — lobby, conference, error messages all inside the iframe */}
            <div ref={containerRef} className="w-full h-full" style={{ minHeight: '520px' }} />
        </div>
    );
}

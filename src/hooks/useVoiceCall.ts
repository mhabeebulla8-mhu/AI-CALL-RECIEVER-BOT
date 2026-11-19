// ==========================================================================
// useVoiceCall — Hands-free VAD + Barge-in + TTS Hook (v6 — Root-Cause Fixed)
// Fixes:
//   • Process ONLY FINAL speech results (Root Cause 5)
//   • Drop identical transcript within 4 seconds (Root Cause 5)
//   • Busy flag: ignores new turns while current turn is processing (Root Cause 5)
//   • StrictMode double-mount protection & clean up on unmount (Root Cause 5)
// ==========================================================================

import { useState, useRef, useEffect, useCallback } from 'react';

const SPEECH_RATE = 1.0;
const SPEECH_PITCH = 1.0;
const SILENCE_TIMEOUT_MS = 8000;
const POST_SPEAK_COOLDOWN = 350;

export type VoiceState = 'listening' | 'thinking' | 'speaking';
export type CallState  = 'idle' | 'connecting' | 'active' | 'ended';

interface UseVoiceCallOptions {
  onUserMessage: (transcript: string) => Promise<string | string[]> | string | string[] | void;
  greetingText:  string;
  onCallEnd?:    (summary: { duration: number }) => void;
}

const MALE_PATTERNS = ['david', 'mark', 'george', 'richard', 'ravi', 'male', 'espeak', 'kyoko', 'albert'];

function findBestNaturalVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const eligible = voices.filter(v => {
    const n = v.name.toLowerCase();
    return !MALE_PATTERNS.some(p => n.includes(p));
  });
  const pool = eligible.length > 0 ? eligible : voices;

  const t1 = pool.find(v =>
    /jenny|sonia|aria|libby|neerja|zira/i.test(v.name) &&
    /natural|online/i.test(v.name)
  );
  if (t1) return t1;

  const t2 = pool.find(v =>
    v.name === 'Google UK English Female' ||
    v.name === 'Google US English'
  );
  if (t2) return t2;

  const t3 = pool.find(v =>
    v.lang.startsWith('en') &&
    /natural|online/i.test(v.name) &&
    !/male/i.test(v.name)
  );
  if (t3) return t3;

  const t4 = pool.find(v =>
    v.lang.startsWith('en') &&
    /samantha|victoria|karen|moira|fiona|veena/i.test(v.name)
  );
  if (t4) return t4;

  const t5 = pool.find(v =>
    v.lang.startsWith('en') &&
    /female|woman/i.test(v.name.toLowerCase())
  );
  if (t5) return t5;

  return pool.find(v => v.lang.startsWith('en')) || pool[0] || null;
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[•\-_#*~`]/g, ' ')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/₹\s*(\d+)/g, '$1 rupees')
    .replace(/[()[\]{}]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text: string): string[] {
  const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
  return chunks.map(c => c.trim()).filter(c => c.length > 0);
}

export function useVoiceCall({ onUserMessage, greetingText, onCallEnd }: UseVoiceCallOptions) {
  const [callState,       setCallState]       = useState<CallState>('idle');
  const [voiceState,      setVoiceState]      = useState<VoiceState>('listening');
  const [isMuted,         setIsMuted]         = useState(false);
  const [duration,        setDuration]        = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micVolume,       setMicVolume]       = useState(0);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('Neural Voice');

  const callStateRef        = useRef<CallState>('idle');
  const isMutedRef          = useRef(false);
  const isSpeakingRef       = useRef(false);
  const isBusyRef           = useRef(false); // Busy flag (Root Cause 5)
  const postSpeakCooldown   = useRef(false);
  const selectedVoiceRef    = useRef<SpeechSynthesisVoice | null>(null);
  const ttsQueueRef         = useRef<string[]>([]);
  const ttsPlayingRef       = useRef(false);

  const lastTranscriptRef   = useRef('');
  const lastTranscriptTimeRef = useRef(0);

  const durationTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepaliveTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef      = useRef<any>(null);
  const audioContextRef     = useRef<AudioContext | null>(null);
  const mediaStreamRef      = useRef<MediaStream | null>(null);
  const animFrameRef        = useRef<number | null>(null);
  const silenceTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const silencePromptCount  = useRef(0);
  const durationRef         = useRef(0);

  callStateRef.current = callState;
  isMutedRef.current   = isMuted;

  // Voice selection on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const pick = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      const best = findBestNaturalVoice(v);
      if (best) {
        selectedVoiceRef.current = best;
        setActiveVoiceName(best.name);
      }
    };

    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    const poll = setInterval(pick, 200);
    const done = setTimeout(() => clearInterval(poll), 3000);
    return () => { clearInterval(poll); clearTimeout(done); };
  }, []);

  // StrictMode cleanup on unmount (Root Cause 5)
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopAudioProcessing();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  };

  const playSentence = useCallback((sentence: string, onDone: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onDone(); return; }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(sentence);
    utter.rate  = SPEECH_RATE;
    utter.pitch = SPEECH_PITCH;

    if (!selectedVoiceRef.current) {
      selectedVoiceRef.current = findBestNaturalVoice(window.speechSynthesis.getVoices());
    }
    if (selectedVoiceRef.current) utter.voice = selectedVoiceRef.current;

    (window as any).__ttsUtterance = utter;

    utter.onstart = () => {
      isSpeakingRef.current = true;
      setVoiceState('speaking');
      clearSilenceTimer();
    };

    utter.onend = () => {
      (window as any).__ttsUtterance = null;
      onDone();
    };

    utter.onerror = () => {
      (window as any).__ttsUtterance = null;
      onDone();
    };

    window.speechSynthesis.speak(utter);
  }, []);

  const drainQueue = useCallback(() => {
    if (ttsQueueRef.current.length === 0) {
      ttsPlayingRef.current  = false;
      isSpeakingRef.current  = false;
      postSpeakCooldown.current = true;
      setVoiceState('listening');

      setTimeout(() => {
        postSpeakCooldown.current = false;
        if (callStateRef.current === 'active') {
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            if (callStateRef.current !== 'active' || isSpeakingRef.current) return;
            if (silencePromptCount.current === 0) {
              silencePromptCount.current = 1;
              speakText('Are you still there?');
            } else {
              speakText("It seems we've been disconnected. Thank you for calling, goodbye!", () => endCall());
            }
          }, SILENCE_TIMEOUT_MS);
        }
      }, POST_SPEAK_COOLDOWN);

      return;
    }

    const sentence = ttsQueueRef.current.shift()!;
    ttsPlayingRef.current = true;
    playSentence(sentence, drainQueue);
  }, [playSentence]);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { onEnd?.(); return; }

    window.speechSynthesis.cancel();
    ttsQueueRef.current = [];
    ttsPlayingRef.current = false;
    (window as any).__ttsUtterance = null;

    const cleaned = cleanForSpeech(text);
    if (!cleaned) { onEnd?.(); return; }

    const sentences = splitIntoSentences(cleaned);
    ttsQueueRef.current = [...sentences];

    if (onEnd) {
      const wrappedDrain = () => {
        if (ttsQueueRef.current.length === 0) {
          ttsPlayingRef.current  = false;
          isSpeakingRef.current  = false;
          postSpeakCooldown.current = true;
          setVoiceState('listening');
          setTimeout(() => { postSpeakCooldown.current = false; }, POST_SPEAK_COOLDOWN);
          onEnd();
        } else {
          const s = ttsQueueRef.current.shift()!;
          ttsPlayingRef.current = true;
          playSentence(s, wrappedDrain);
        }
      };
      const first = ttsQueueRef.current.shift()!;
      ttsPlayingRef.current = true;
      playSentence(first, wrappedDrain);
    } else {
      drainQueue();
    }
  }, [drainQueue, playSentence]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    ttsQueueRef.current   = [];
    ttsPlayingRef.current = false;
    isSpeakingRef.current = false;
    postSpeakCooldown.current = false;
    (window as any).__ttsUtterance = null;
  }, []);

  // Send FINAL speech result to AI (Root Cause 5)
  const handleFinalUtterance = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || callStateRef.current !== 'active') return;

    // Busy flag: ignore new turns while processing
    if (isBusyRef.current) return;

    // Drop identical transcript within 4 seconds (Root Cause 5)
    const now = Date.now();
    if (clean.toLowerCase() === lastTranscriptRef.current.toLowerCase() && now - lastTranscriptTimeRef.current < 4000) {
      return;
    }

    lastTranscriptRef.current = clean;
    lastTranscriptTimeRef.current = now;
    isBusyRef.current = true;

    clearSilenceTimer();
    silencePromptCount.current = 0;
    setVoiceState('thinking');
    setInterimTranscript('');

    try {
      const response = await onUserMessage(clean);
      if (callStateRef.current !== 'active') return;

      if (response) {
        const toSpeak = Array.isArray(response) ? response.join(' ') : response as string;
        speakText(toSpeak);
      } else {
        setVoiceState('listening');
      }
    } catch {
      setVoiceState('listening');
    } finally {
      isBusyRef.current = false;
    }
  }, [onUserMessage, speakText]);

  // SpeechRecognition: process ONLY FINAL speech results (Root Cause 5)
  const startRecognition = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Voice recognition is not supported. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // Ensure only ONE instance exists (Root Cause 5)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const rec = new SpeechRec();
    recognitionRef.current = rec;

    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      if (isMutedRef.current || postSpeakCooldown.current || isBusyRef.current) return;

      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const transcript = item[0].transcript;
        // Process ONLY FINAL speech results
        if (item.isFinal) {
          finalChunk += ' ' + transcript;
        } else {
          interim += ' ' + transcript;
        }
      }

      // Barge-in: if user clearly speaking while AI is talking, cancel TTS
      if (isSpeakingRef.current) {
        const userSpeech = (finalChunk + interim).trim();
        if (userSpeech.length >= 10) {
          stopSpeaking();
          setVoiceState('listening');
        } else {
          return;
        }
      }

      if (interim.trim()) {
        setInterimTranscript(interim.trim());
        clearSilenceTimer();
      }

      // Only dispatch when we have a FINAL speech result (Root Cause 5)
      if (finalChunk.trim()) {
        handleFinalUtterance(finalChunk.trim());
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn('[STT] error:', e.error);
    };

    rec.onend = () => {
      if (callStateRef.current === 'active' && !isMutedRef.current) {
        try { rec.start(); } catch {}
      }
    };

    try { rec.start(); } catch (e) { console.warn('[STT] start failed:', e); }
  }, [handleFinalUtterance, stopSpeaking]);

  const setupAudioProcessing = async (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize               = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
        setMicVolume(Math.round(avg));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn('[AudioCtx] metering unavailable:', e);
    }
  };

  const stopAudioProcessing = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setMicVolume(0);
  };

  const startCall = async () => {
    setCallState('connecting');
    callStateRef.current = 'connecting';
    setDuration(0);
    durationRef.current = 0;
    silencePromptCount.current  = 0;
    ttsQueueRef.current         = [];
    postSpeakCooldown.current   = false;
    isBusyRef.current           = false;
    lastTranscriptRef.current   = '';
    lastTranscriptTimeRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      await setupAudioProcessing(stream);
      startRecognition();

      setCallState('active');
      callStateRef.current = 'active';

      durationTimerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(d => d + 1);
      }, 1000);

      keepaliveTimerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      if (greetingText) {
        speakText(greetingText);
      }
    } catch (err) {
      console.error('[Call] Mic access denied:', err);
      alert('Microphone permission is required. Please allow microphone access in your browser settings and try again.');
      setCallState('idle');
      callStateRef.current = 'idle';
    }
  };

  const endCall = useCallback(() => {
    clearSilenceTimer();
    stopSpeaking();
    stopAudioProcessing();

    if (durationTimerRef.current) { clearInterval(durationTimerRef.current);  durationTimerRef.current = null; }
    if (keepaliveTimerRef.current){ clearInterval(keepaliveTimerRef.current); keepaliveTimerRef.current = null; }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    setCallState('ended');
    callStateRef.current = 'ended';
    setVoiceState('listening');
    setInterimTranscript('');
    isBusyRef.current = false;

    onCallEnd?.({ duration: durationRef.current });
  }, [onCallEnd, stopSpeaking]);

  const resetCall = () => {
    clearSilenceTimer();
    stopSpeaking();
    stopAudioProcessing();
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current);  durationTimerRef.current = null; }
    if (keepaliveTimerRef.current){ clearInterval(keepaliveTimerRef.current); keepaliveTimerRef.current = null; }
    if (recognitionRef.current)   { try { recognitionRef.current.abort(); } catch {} recognitionRef.current = null; }
    setCallState('idle');
    callStateRef.current = 'idle';
    setVoiceState('listening');
    setDuration(0);
    durationRef.current = 0;
    setInterimTranscript('');
    silencePromptCount.current = 0;
    isBusyRef.current = false;
    lastTranscriptRef.current = '';
    lastTranscriptTimeRef.current = 0;
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        try { recognitionRef.current?.stop(); } catch {}
      } else {
        try { recognitionRef.current?.start(); } catch {}
      }
      return next;
    });
  };

  return {
    callState,
    voiceState,
    isMuted,
    duration,
    interimTranscript,
    micVolume,
    activeVoiceName,
    startCall,
    endCall,
    resetCall,
    toggleMute,
    speak: speakText,
  };
}

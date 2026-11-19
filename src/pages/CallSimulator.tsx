// ============================================
// Call Simulator Page — Hands-Free Voice Receptionist
// Natural conversational AI with barge-in & automatic booking
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Calendar,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CallOrb } from '../components/CallOrb';
import { Badge } from '../components/Badge';
import { useVoiceCall } from '../hooks/useVoiceCall';
import {
  processUserMessage,
  getGreeting,
  resetConversation,
  getCurrentCallData,
} from '../bot-engine';
import { store } from '../data';
import type { ChatMessage } from '../types';

export default function CallSimulator() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callSummary, setCallSummary] = useState<{
    duration: number;
    intent?: string;
    details?: string;
    appointmentBooked?: boolean;
    messageTaken?: boolean;
  } | null>(null);

  const chatScrollRef = useRef<any>(null);
  const greetingRef = useRef(getGreeting());

  const handleUserMessage = async (userText: string) => {
    // 1. Process through conversational receptionist engine
    const botReplies = await processUserMessage(userText);

    // If duplicate was dropped or empty response
    if (botReplies.length === 0) {
      return '';
    }

    // 2. Add caller message to state
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    // 3. Add user message and bot replies to transcript
    setMessages(prev => [...prev, userMsg, ...botReplies]);

    // 4. If end_call action, end the call after bot finishes speaking
    if (botReplies.some(r => r.action?.type === 'end_call')) {
      setTimeout(() => {
        endCall();
      }, 3000);
    }

    // 5. Return text for the voice synthesizer to speak
    const speechLines = botReplies.map(r => r.content);
    return speechLines.join(' ');
  };

  const {
    callState,
    voiceState,
    isMuted,
    duration,
    interimTranscript,
    activeVoiceName,
    startCall: initVoiceCall,
    endCall,
    resetCall,
    toggleMute,
  } = useVoiceCall({
    greetingText: greetingRef.current.content,
    onUserMessage: handleUserMessage,
    onCallEnd: ({ duration: finalDuration }) => {
      const callData = getCurrentCallData();

      const isApt =
        callData.intent === 'booking' ||
        messages.some(m => m.content.toLowerCase().includes('confirmed'));
      const isMsg =
        callData.intent === 'message' ||
        messages.some(m => m.content.toLowerCase().includes('saved your message'));

      setCallSummary({
        duration: finalDuration,
        intent: callData.intent || 'Appointment Booking',
        details: isApt
          ? `Appointment booked for ${callData.callerName || 'Client'} (${callData.service || 'Service'}) on ${callData.preferredDate || 'Tomorrow'} at ${callData.preferredTime || '2:00 PM'}`
          : isMsg
          ? `Message saved for ${callData.recipient || 'Staff'}`
          : 'Call resolved with AI assistant',
        appointmentBooked: isApt,
        messageTaken: isMsg,
      });

      // Automatically record in Call Logs
      store.addCall({
        businessId: 'biz_001',
        callerNumber: callData.callerPhone || '+91 98860 11223',
        callerName: callData.callerName || 'Voice Caller',
        startedAt: new Date(Date.now() - finalDuration * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        duration: finalDuration,
        intent: (callData.intent as any) || (isApt ? 'booking' : 'faq'),
        outcome: isApt ? 'booked' : isMsg ? 'message_taken' : 'resolved',
        summary: isApt
          ? `Booked ${callData.service || 'Haircut & Styling'} for ${callData.callerName || 'Client'} on ${callData.preferredDate || 'Tomorrow'} at ${callData.preferredTime || '2:00 PM'}`
          : `Customer conversation via live call simulator`,
        transcript: messages.map(m => ({
          speaker: m.role === 'bot' ? 'bot' : 'caller',
          text: m.content,
          timestamp: '00:00',
        })),
        transferred: false,
        followUpNeeded: false,
        sentiment: 'positive',
      });
    },
  });

  const handleStartCall = () => {
    resetConversation();
    greetingRef.current = getGreeting();
    setMessages([greetingRef.current]);
    setCallSummary(null);
    initVoiceCall();
  };

  const handleNewCall = () => {
    resetCall();
    resetConversation();
    setMessages([]);
    setCallSummary(null);
  };

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayVoice = activeVoiceName.replace(/Microsoft |Google |Online \(Natural\)|Desktop/gi, '').trim() || 'Natural Neural Voice';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Call Simulator</h2>
          <p>
            Hands-free natural conversation with your AI receptionist. Speak continuously without clicking buttons.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Idle Screen */}
        {callState === 'idle' && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Phone size={28} strokeWidth={2} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Ready to Test Hands-Free Receptionist?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.55 }}>
              Click <strong>Start Call</strong>. Your mic stays open continuously with Voice Activity Detection (VAD) and instant barge-in cancellation when you speak.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
              <Badge variant="purple" size="sm">
                <Sparkles size={12} style={{ marginRight: 4 }} />
                Voice: {displayVoice} (1.0x Natural Speed)
              </Badge>
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={handleStartCall}
                style={{ padding: '10px 24px', fontSize: 14 }}
                id="btn-start-call"
              >
                <Phone size={16} />
                <span>Start Call</span>
              </button>
            </div>
          </div>
        )}

        {/* Connecting Screen */}
        {callState === 'connecting' && (
          <div className="card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <CallOrb state="thinking" statusText="Connecting live call line…" />
          </div>
        )}

        {/* Active Call Screen */}
        {callState === 'active' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Call Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--card-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="status-dot-pulse" aria-hidden="true" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Live Call · Glow & Grace Salon
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {formatTimer(duration)}
                </span>
                <Badge variant={isMuted ? 'warning' : 'success'} size="sm">
                  {isMuted ? 'Muted' : 'Mic Active'}
                </Badge>
              </div>
            </div>

            <div style={{ padding: '24px 20px' }}>
              {/* Animated Voice Orb with dynamic states */}
              <CallOrb state={voiceState} />

              {/* Live Transcript Area */}
              <div
                ref={chatScrollRef}
                className="call-chat-scroll"
                style={{
                  marginTop: 20,
                  marginBottom: 20,
                  maxHeight: 280,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '8px 4px',
                }}
              >
                {messages.map(m => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-app)',
                      color: m.role === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    {m.content}
                  </div>
                ))}
                {interimTranscript && (
                  <div
                    style={{
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      lineHeight: 1.4,
                      background: 'rgba(79, 70, 229, 0.12)',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}
                  >
                    {interimTranscript}…
                  </div>
                )}
              </div>

              {/* Call Controls: Minimal Mute & End */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                <button
                  className={`btn ${isMuted ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  style={{ minWidth: 100 }}
                >
                  {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
                </button>

                <button
                  className="btn btn-danger"
                  onClick={endCall}
                  style={{ minWidth: 120 }}
                  id="btn-end-call"
                >
                  <PhoneOff size={15} />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-Call Summary Card */}
        {callState === 'ended' && callSummary && (
          <div className="card" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Call Completed & Logged
                </h3>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                  Duration: {formatTimer(callSummary.duration)} · Automatically saved to Call Logs
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-color)',
                marginBottom: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>Call Intent</span>
                <Badge variant="purple" size="sm">{callSummary.intent || 'Appointment Booking'}</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>Outcome Summary</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {callSummary.details}
                </span>
              </div>

              {callSummary.appointmentBooked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-success-text)', fontSize: 13, fontWeight: 500 }}>
                  <Calendar size={15} />
                  <span>Appointment successfully booked in system calendar</span>
                </div>
              )}

              {callSummary.messageTaken && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-warning-text)', fontSize: 13, fontWeight: 500 }}>
                  <MessageSquare size={15} />
                  <span>Callback message recorded for staff</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <button className="btn btn-secondary" onClick={handleNewCall}>
                <RotateCcw size={14} />
                <span>Start Another Call</span>
              </button>

              <button className="btn btn-primary" onClick={() => navigate('/calls')}>
                <span>View in Call Logs</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

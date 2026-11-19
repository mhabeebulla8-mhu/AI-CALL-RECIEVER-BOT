// ==========================================================================
// CallFlow AI — Receptionist Engine (Root-Cause Fixed State Machine)
//
// Key architectural fixes:
//   1. Explicit state machine: 'idle' | 'service' | 'datetime' | 'name' | 'phone' | 'confirm' | 'done'
//   2. Real date/time parsing with chrono-node (forwardDate: true) -> YYYY-MM-DD & HH:MM
//   3. Phone step: validates 10 digits before confirm
//   4. Confirm step: idempotent, writes to SQLite BEFORE saying "confirmed"
//   5. Done step: sets step='done', clears pendingBooking -> completedBookings
//   6. "No / thank you / that's all" in DONE ends call immediately, never re-confirms
//   7. Duplicate user message: drops identical text within 4s, busy flag protection
//   8. Anti-repetition: never sends same bot reply twice in a row (clarifying question -> callback)
//   9. Full debug logging on every turn
// ==========================================================================

import * as chrono from 'chrono-node';
import { format } from 'date-fns';
import { store } from './data.ts';
import { insertAppointment, isSlotTaken, getFreeSlots, to12Hour, to24Hour } from './db.ts';
import type { ChatMessage, CallData, BotAction, Appointment } from './types.ts';

const uid = () => Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();

export type BookingStep = 'idle' | 'service' | 'datetime' | 'name' | 'phone' | 'confirm' | 'done';

export interface SessionBooking {
  bookingId?: string;
  service?: string;
  dateStr?: string;       // YYYY-MM-DD
  timeStr?: string;       // HH:mm (24hr)
  formattedDate?: string; // e.g. "Thursday, 19 November"
  formattedTime?: string; // e.g. "2:00 PM"
  callerName?: string;
  callerPhone?: string;
}

export interface Session {
  step: BookingStep;
  pendingBooking: SessionBooking | null;
  completedBookings: Array<SessionBooking & { bookingId: string }>;
  lastBotReply: string;
  repeatCount: number;
  lastUserText: string;
  lastUserTime: number;
  isProcessing: boolean;
  history: Array<{ role: 'user' | 'bot'; text: string }>;
}

let session: Session = createInitialSession();

function createInitialSession(): Session {
  return {
    step: 'idle',
    pendingBooking: null,
    completedBookings: [],
    lastBotReply: '',
    repeatCount: 0,
    lastUserText: '',
    lastUserTime: 0,
    isProcessing: false,
    history: [],
  };
}

export function resetConversation() {
  session = createInitialSession();
}

export function getSession(): Readonly<Session> {
  return session;
}

export function getCurrentCallData(): Partial<CallData> {
  const lastBooking = session.completedBookings[session.completedBookings.length - 1] || session.pendingBooking;
  return {
    intent: 'booking',
    callerName: lastBooking?.callerName || 'Client',
    callerPhone: lastBooking?.callerPhone || '+91 98765 43210',
    service: lastBooking?.service || 'Haircut & Styling',
    preferredDate: lastBooking?.formattedDate || 'Tomorrow',
    preferredTime: lastBooking?.formattedTime || '2:00 PM',
  };
}

export function getGreeting(): ChatMessage {
  const biz = store.getBusiness();
  const text = biz.greeting || `Hello! Thank you for calling ${biz.name}. I'm your AI assistant. How can I help you today?`;
  session.history.push({ role: 'bot', text });
  session.lastBotReply = text;
  return { id: uid(), role: 'bot', content: text, timestamp: nowIso() };
}

// ── Extraction Helpers ───────────────────────────────────────────────────────

function extractService(text: string, services: Array<{ name: string }>): string | null {
  const l = text.toLowerCase();
  if (/hair\s*colo?u?r/i.test(l) || /colo?u?ring|dye|highlights|balayage/i.test(l)) return 'Hair Coloring';
  if (/hair\s*cut|cut\s*my\s*hair|trim|style|styling|blow\s*dry/i.test(l)) return 'Haircut & Styling';
  if (/facial|skin\s*care|glow|cleanup|clean\s*up/i.test(l)) return 'Facial Treatment';
  if (/mani|pedi|manicure|pedicure|nails/i.test(l)) return 'Manicure & Pedicure';
  if (/bridal|wedding|makeup/i.test(l)) return 'Bridal Package';
  if (/beard|shave/i.test(l)) return 'Beard Trim';

  for (const s of services) {
    if (l.includes(s.name.toLowerCase())) return s.name;
    for (const w of s.name.toLowerCase().split(/[\s&]+/)) {
      if (w.length > 3 && l.includes(w)) return s.name;
    }
  }
  return null;
}

interface ParsedDateTime {
  dateStr?: string;       // YYYY-MM-DD
  formattedDate?: string; // "Thursday, 19 November"
  timeStr?: string;       // "14:00"
  formattedTime?: string; // "2:00 PM"
}

export function parseDateTime(text: string): ParsedDateTime {
  const result: ParsedDateTime = {};
  const refDate = new Date();
  const parsed = chrono.parse(text, refDate, { forwardDate: true });

  if (parsed.length > 0) {
    const first = parsed[0];
    const comp = first.start;

    // Date extraction
    if (comp.isCertain('day') || comp.isCertain('weekday') || comp.isCertain('month')) {
      const d = first.date();
      result.dateStr = format(d, 'yyyy-MM-dd');
      result.formattedDate = format(d, 'EEEE, d MMMM');
    }

    // Time extraction
    if (comp.isCertain('hour')) {
      const d = first.date();
      result.timeStr = format(d, 'HH:mm');
      result.formattedTime = format(d, 'h:mm a');
    }
  }

  // Regex fallbacks for time
  if (!result.timeStr) {
    const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|o'?clock)?\b/i);
    if (timeMatch) {
      let hr = parseInt(timeMatch[1], 10);
      const min = timeMatch[2] || '00';
      const rawAp = timeMatch[3]?.toLowerCase().replace(/\./g, '') || '';
      const isPm = rawAp.includes('pm') || (hr >= 1 && hr <= 6 && !rawAp.includes('am'));

      if (isPm && hr < 12) hr += 12;
      if (rawAp.includes('am') && hr === 12) hr = 0;

      const formatted24 = `${hr.toString().padStart(2, '0')}:${min}`;
      result.timeStr = formatted24;
      result.formattedTime = to12Hour(formatted24);
    }
  }

  // Natural language daytime words
  if (!result.timeStr) {
    if (/\bmorning\b/i.test(text)) {
      result.timeStr = '10:30';
      result.formattedTime = '10:30 AM';
    } else if (/\bafternoon\b/i.test(text)) {
      result.timeStr = '14:00';
      result.formattedTime = '2:00 PM';
    } else if (/\bevening\b/i.test(text)) {
      result.timeStr = '16:30';
      result.formattedTime = '4:30 PM';
    }
  }

  return result;
}

export function extractPhone(text: string): string | null {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
}

export function extractName(text: string): string | null {
  const introMatch = text.match(/(?:my name is|i am|i'm|this is|call me|name['']?s?|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  if (introMatch && introMatch[1]) {
    const cand = introMatch[1].trim();
    if (!['an', 'a', 'the', 'booking', 'appointment', 'haircut', 'tomorrow', 'today'].includes(cand.toLowerCase())) {
      return capitalise(cand);
    }
  }

  const clean = text.replace(/^(yes|yeah|sure|okay|hi|hello|it['']?s|its|um|uh)\s*/i, '').replace(/[.,!?]/g, '').trim();
  const words = clean.split(/\s+/);
  if (words.length >= 1 && words.length <= 3 && words.every(w => /^[a-zA-Z]{2,20}$/.test(w))) {
    const stopWords = ['yes', 'no', 'sure', 'okay', 'thanks', 'tomorrow', 'today', 'confirm', 'book', 'haircut', 'facial', 'service', 'please', 'morning', 'evening', 'afternoon'];
    if (!stopWords.includes(clean.toLowerCase())) {
      return capitalise(clean);
    }
  }
  return null;
}

function capitalise(str: string): string {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function isAffirmative(text: string): boolean {
  return /\b(yes|yeah|yep|yup|sure|confirm|please|go ahead|book it|book that|do it|okay|ok|sounds good|perfect|correct|right|fine|absolutely|that'?s right)\b/i.test(text);
}

function isNegative(text: string): boolean {
  return /\b(no|nope|cancel|don't|don't book|stop|never mind|nevermind|wait|hold on|that'?s all|nothing else)\b/i.test(text);
}

function isGoodBye(text: string): boolean {
  return /\b(no|that'?s all|thank you|thanks|no that'?s all|no just confirm|nothing else|bye|goodbye|all good|done)\b/i.test(text);
}

function isHumanTransferRequest(text: string): boolean {
  return /\b(speak to (a )?human|talk to (a )?human|speak to (a )?person|talk to (a )?person|real person|manager|speak to staff|talk to staff|connect me with|transfer me|complaint)\b/i.test(text);
}

function getClarifyingQuestion(step: BookingStep, pending: SessionBooking | null): string {
  switch (step) {
    case 'service':
      return "Which salon service would you like to book, such as a haircut, hair coloring, or facial?";
    case 'datetime':
      return pending?.formattedDate
        ? `We have openings on ${pending.formattedDate} at 10:30 AM, 2:00 PM, and 4:30 PM. Which time works best?`
        : "What day and time work best for your appointment?";
    case 'name':
      return "Could you please tell me your first and last name for the booking?";
    case 'phone':
      return "Could you please provide your 10-digit mobile phone number for confirmation?";
    case 'confirm':
      return "Shall I go ahead and confirm this appointment for you?";
    case 'done':
      return "Is there anything else I can help you with today?";
    default:
      return "Could you please clarify how I can assist you today?";
  }
}

// ── Out of context handler ───────────────────────────────────────────────────

function handleOutOfContext(text: string): string | null {
  const l = text.toLowerCase();
  const math = l.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/]|plus|minus|times|multiplied by|divided by)\s*(\d+(?:\.\d+)?)/i);
  if (math) {
    const a = parseFloat(math[1]), op = math[2].toLowerCase(), b = parseFloat(math[3]);
    let res = 0;
    if (op === '+' || op === 'plus') res = a + b;
    else if (op === '-' || op === 'minus') res = a - b;
    else if (op === '*' || op === 'times' || op === 'multiplied by') res = a * b;
    else if (op === '/' || op === 'divided by') res = b !== 0 ? a / b : 0;
    return `That would be ${res}. How can I help you with your booking?`;
  }
  if (/joke|funny|laugh/i.test(l)) {
    return "Why did the hair cross the road? Because it was curling away! Now, how can I assist with your appointment?";
  }
  if (/capital of (\w+)/i.test(l)) {
    const match = l.match(/capital of (\w+)/i);
    const country = match ? match[1].toLowerCase() : '';
    if (country === 'france') return "The capital of France is Paris! Can I help you schedule a visit?";
    if (country === 'japan') return "The capital of Japan is Tokyo! Would you like to book a salon service?";
  }
  return null;
}

// ── Main Process Message ─────────────────────────────────────────────────────

export async function processUserMessage(userText: string): Promise<ChatMessage[]> {
  const text = userText.trim();
  if (!text) return [];

  // 1. Busy flag check (Root Cause 5)
  if (session.isProcessing) {
    console.log('[DEBUG TURN] Dropping message: bot is currently busy processing.');
    return [];
  }

  // 2. Duplicate text check within 4 seconds (Root Cause 5)
  const nowMs = Date.now();
  if (text.toLowerCase() === session.lastUserText.toLowerCase() && nowMs - session.lastUserTime < 4000) {
    console.log('[DEBUG TURN] Dropping duplicate user message within 4 seconds:', text);
    return [];
  }

  session.lastUserText = text;
  session.lastUserTime = nowMs;
  session.isProcessing = true;

  const stepBefore = session.step;
  session.history.push({ role: 'user', text });

  const makeMsg = (content: string, action?: BotAction): ChatMessage => {
    let finalContent = content;

    // Root Cause 6: Never send the exact same bot sentence twice in a row
    if (finalContent === session.lastBotReply) {
      session.repeatCount++;
      if (session.repeatCount >= 2) {
        finalContent = "I'm having a little trouble understanding. A member of our front desk team will call you right back to assist.";
      } else {
        finalContent = getClarifyingQuestion(session.step, session.pendingBooking);
      }
    } else {
      session.repeatCount = 0;
    }

    session.lastBotReply = finalContent;
    session.history.push({ role: 'bot', text: finalContent });

    console.log('[DEBUG TURN]', {
      stepBefore,
      userText: text,
      stepAfter: session.step,
      botReply: finalContent,
      pendingBooking: session.pendingBooking,
    });

    return {
      id: uid(),
      role: 'bot',
      content: finalContent,
      timestamp: nowIso(),
      action,
    };
  };

  try {
    const lower = text.toLowerCase();
    const biz = store.getBusiness();

    // ── Human transfer request ──────────────────────────────────────────────
    if (isHumanTransferRequest(lower)) {
      return [makeMsg(
        `I am connecting you directly with our front desk team at ${biz.phone || '+91 80 4567 8900'}. Please hold one moment.`,
        { type: 'transfer_call', data: { reason: 'caller_requested' } }
      )];
    }

    // ── STEP ROUTING (Strict code-driven state machine) ──────────────────────

    // --- STEP: DONE ---
    if (session.step === 'done') {
      // User wants another booking
      if (/book another|another appointment|book again|another booking/i.test(lower)) {
        session.step = 'name';
        session.pendingBooking = {};
        return [makeMsg("May I have your name for the new booking?")];
      }

      // User says no / goodbye / that's all
      if (isGoodBye(lower) || isNegative(lower)) {
        return [makeMsg(
          "Thank you for calling Glow & Grace Salon. Have a great day!",
          { type: 'end_call' }
        )];
      }

      // User says yes or asks a question -> NEVER re-confirm
      if (isAffirmative(lower)) {
        return [makeMsg("How else may I help you today?")];
      }

      const ooc = handleOutOfContext(text);
      if (ooc) return [makeMsg(ooc)];

      return [makeMsg("Is there anything else I can help you with today?")];
    }

    // --- STEP: CONFIRM ---
    if (session.step === 'confirm') {
      const pending = session.pendingBooking;

      // Idempotency: if already confirmed or no pending booking (Root Cause 3)
      if (!pending || pending.bookingId) {
        return [makeMsg("How else may I help you today?")];
      }

      if (isAffirmative(lower)) {
        // Save to SQLite BEFORE saying "confirmed" (Root Cause 9)
        const bookingId = `apt_${uid()}`;
        const newApt: Appointment = {
          id: bookingId,
          businessId: biz.id,
          callerName: pending.callerName || 'Client',
          callerPhone: pending.callerPhone || '+91 98765 43210',
          service: pending.service || 'Haircut & Styling',
          date: pending.dateStr || format(new Date(), 'yyyy-MM-dd'),
          time: to24Hour(pending.timeStr || '14:00'),
          duration: 45,
          status: 'confirmed',
          notes: 'Booked via CallFlow AI',
          createdAt: nowIso(),
          createdBy: 'bot',
        };

        const saveRes = await insertAppointment(newApt);

        if (!saveRes.success) {
          // Slot conflict
          const freeSlots = await getFreeSlots(newApt.date);
          session.step = 'datetime';
          return [makeMsg(
            `I'm sorry, that slot is already taken. We have openings at ${freeSlots.join(', ')}. Which time works best for you?`
          )];
        }

        // Add to store for UI view
        store.addAppointment(newApt);

        // Advance to DONE and clear pending booking (Root Causes 1 & 2)
        pending.bookingId = bookingId;
        session.step = 'done';
        session.completedBookings.push(pending as any);
        session.pendingBooking = null;

        return [makeMsg(
          `Your ${newApt.service} is confirmed for ${pending.formattedDate || newApt.date} at ${pending.formattedTime || to12Hour(newApt.time)}! Is there anything else I can help with?`,
          { type: 'book_appointment', data: { ...newApt } }
        )];
      }

      if (isNegative(lower)) {
        session.step = 'datetime';
        return [makeMsg("No problem. What day and time would you prefer instead?")];
      }

      return [makeMsg("Shall I confirm that for you?")];
    }

    // --- STEP: PHONE ---
    if (session.step === 'phone') {
      const phone = extractPhone(text);
      if (phone) {
        if (!session.pendingBooking) session.pendingBooking = {};
        session.pendingBooking.callerPhone = phone;
        session.step = 'confirm';

        // Read-back must include name, service, date, time, and phone (Root Cause 7)
        const p = session.pendingBooking;
        return [makeMsg(
          `Let me confirm: ${p.service} for ${p.callerName} on ${p.formattedDate} at ${p.formattedTime}, phone ${p.callerPhone}. Shall I confirm that for you?`
        )];
      }

      return [makeMsg("And your phone number for confirmation?")];
    }

    // --- STEP: NAME ---
    if (session.step === 'name') {
      const name = extractName(text);
      if (name) {
        if (!session.pendingBooking) session.pendingBooking = {};
        session.pendingBooking.callerName = name;
        session.step = 'phone';
        return [makeMsg("And your phone number for confirmation?")];
      }

      return [makeMsg("May I have your name for the booking?")];
    }

    // --- STEP: DATETIME ---
    if (session.step === 'datetime') {
      if (!session.pendingBooking) session.pendingBooking = {};
      const parsed = parseDateTime(text);

      if (parsed.dateStr) {
        session.pendingBooking.dateStr = parsed.dateStr;
        session.pendingBooking.formattedDate = parsed.formattedDate;
      }
      if (parsed.timeStr) {
        session.pendingBooking.timeStr = parsed.timeStr;
        session.pendingBooking.formattedTime = parsed.formattedTime;
      }

      // Have date, need time
      if (session.pendingBooking.dateStr && !session.pendingBooking.timeStr) {
        const freeSlots = await getFreeSlots(session.pendingBooking.dateStr);
        return [makeMsg(
          `We have openings on ${session.pendingBooking.formattedDate} at ${freeSlots.slice(0, 3).join(', ')}. Which time works best for you?`
        )];
      }

      // Have date and time -> verify availability and move to name
      if (session.pendingBooking.dateStr && session.pendingBooking.timeStr) {
        const taken = await isSlotTaken(session.pendingBooking.dateStr, session.pendingBooking.timeStr);
        if (taken) {
          const freeSlots = await getFreeSlots(session.pendingBooking.dateStr);
          session.pendingBooking.timeStr = undefined;
          session.pendingBooking.formattedTime = undefined;
          return [makeMsg(
            `That slot at ${parsed.formattedTime} is already booked. We have openings at ${freeSlots.join(', ')}. Which works for you?`
          )];
        }

        session.step = 'name';
        return [makeMsg("May I have your name for the booking?")];
      }

      return [makeMsg(`What day were you thinking for your ${session.pendingBooking.service || 'appointment'}?`)];
    }

    // --- STEP: SERVICE ---
    if (session.step === 'service') {
      const svc = extractService(text, biz.services);
      if (svc) {
        if (!session.pendingBooking) session.pendingBooking = {};
        session.pendingBooking.service = svc;

        // Check if date was also mentioned in same sentence
        const parsed = parseDateTime(text);
        if (parsed.dateStr) {
          session.pendingBooking.dateStr = parsed.dateStr;
          session.pendingBooking.formattedDate = parsed.formattedDate;
        }
        if (parsed.timeStr) {
          session.pendingBooking.timeStr = parsed.timeStr;
          session.pendingBooking.formattedTime = parsed.formattedTime;
        }

        if (session.pendingBooking.dateStr && session.pendingBooking.timeStr) {
          session.step = 'name';
          return [makeMsg("May I have your name for the booking?")];
        }

        session.step = 'datetime';
        return [makeMsg(`What day were you thinking for your ${svc}?`)];
      }

      return [makeMsg("Which salon service would you like? We offer Haircut & Styling, Hair Coloring, Facial Treatment, and more.")];
    }

    // --- STEP: IDLE ---
    if (session.step === 'idle') {
      const isBookingIntent = /\b(book|appointment|schedule|reserve|slot|openings)\b/i.test(lower);
      const svc = extractService(text, biz.services);

      if (isBookingIntent || svc) {
        session.pendingBooking = {};
        if (svc) {
          session.pendingBooking.service = svc;
          const parsed = parseDateTime(text);
          if (parsed.dateStr) {
            session.pendingBooking.dateStr = parsed.dateStr;
            session.pendingBooking.formattedDate = parsed.formattedDate;
          }
          if (parsed.timeStr) {
            session.pendingBooking.timeStr = parsed.timeStr;
            session.pendingBooking.formattedTime = parsed.formattedTime;
          }

          if (session.pendingBooking.dateStr && session.pendingBooking.timeStr) {
            session.step = 'name';
            return [makeMsg("May I have your name for the booking?")];
          }

          session.step = 'datetime';
          return [makeMsg(`What day were you thinking for your ${svc}?`)];
        }

        session.step = 'service';
        return [makeMsg("I'd love to help you book! Which service were you interested in?")];
      }

      // Check Out of Context
      const ooc = handleOutOfContext(text);
      if (ooc) return [makeMsg(ooc)];

      return [makeMsg("Hello! How can I assist you with your salon visit today?")];
    }

    return [makeMsg("How can I help you today?")];
  } finally {
    session.isProcessing = false;
  }
}

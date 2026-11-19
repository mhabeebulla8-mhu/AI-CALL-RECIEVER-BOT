// ============================================
// Core Types for CallFlow AI
// ============================================

export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: BusinessHours;
  services: Service[];
  greeting: string;
  transferNumber: string;
  faqs: FAQ[];
  botVoice: 'professional' | 'friendly' | 'calm';
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
  description: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Call {
  id: string;
  businessId: string;
  callerNumber: string;
  callerName: string;
  startedAt: string;
  endedAt: string;
  duration: number; // seconds
  intent: CallIntent;
  outcome: CallOutcome;
  summary: string;
  transcript: TranscriptLine[];
  recordingUrl?: string;
  transferred: boolean;
  followUpNeeded: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export type CallIntent = 'faq' | 'booking' | 'message' | 'complaint' | 'transfer' | 'other';
export type CallOutcome = 'resolved' | 'booked' | 'message_taken' | 'transferred' | 'abandoned' | 'ended';

export interface TranscriptLine {
  speaker: 'bot' | 'caller';
  text: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  callerName: string;
  callerPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  notes: string;
  createdAt: string;
  createdBy: 'bot' | 'manual';
}

export interface Message {
  id: string;
  businessId: string;
  callerName: string;
  callerPhone: string;
  recipient: string;
  body: string;
  status: 'new' | 'read' | 'called_back' | 'archived';
  priority: 'normal' | 'urgent';
  createdAt: string;
  callId?: string;
}

// Chat simulator types
export interface ChatMessage {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  timestamp: string;
  action?: BotAction;
}

export interface BotAction {
  type: 'book_appointment' | 'take_message' | 'transfer_call' | 'check_availability' | 'end_call';
  data?: Record<string, unknown>;
}

export interface CallSimulatorState {
  status: 'idle' | 'ringing' | 'active' | 'ended';
  messages: ChatMessage[];
  duration: number;
  callData: Partial<CallData>;
}

export interface CallData {
  callerName: string;
  callerPhone: string;
  intent: CallIntent;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  recipient: string;
}

// Dashboard stats
export interface DashboardStats {
  totalCalls: number;
  callsToday: number;
  resolvedRate: number;
  avgDuration: number;
  pendingAppointments: number;
  newMessages: number;
  transferRate: number;
  missedCalls: number;
}

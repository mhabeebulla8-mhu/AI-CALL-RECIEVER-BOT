// ============================================
// Mock Data Store — Simulates the backend
// ============================================

import type {
  Business,
  Call,
  Appointment,
  Message,
  DashboardStats,
  TranscriptLine,
} from './types';

// Helper
const id = () => Math.random().toString(36).slice(2, 10);
const now = new Date();
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const hoursAgo = (n: number) => {
  const d = new Date(now);
  d.setHours(d.getHours() - n);
  return d.toISOString();
};
const minutesAgo = (n: number) => {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() - n);
  return d.toISOString();
};

// =====================
// Business configuration
// =====================
export const defaultBusiness: Business = {
  id: 'biz_001',
  name: 'Glow & Grace Salon',
  address: '42 MG Road, Indiranagar, Bangalore 560038',
  phone: '+91 80 4567 8900',
  email: 'hello@glowandgrace.in',
  hours: {
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '21:00', closed: false },
    saturday: { open: '10:00', close: '21:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false },
  },
  services: [
    { id: 'svc_1', name: 'Haircut & Styling', duration: 45, price: 800, description: 'Professional haircut with wash and styling' },
    { id: 'svc_2', name: 'Hair Coloring', duration: 90, price: 2500, description: 'Full hair color with premium products' },
    { id: 'svc_3', name: 'Facial Treatment', duration: 60, price: 1500, description: 'Deep cleansing facial with massage' },
    { id: 'svc_4', name: 'Manicure & Pedicure', duration: 75, price: 1200, description: 'Complete nail care with polish' },
    { id: 'svc_5', name: 'Bridal Package', duration: 180, price: 8000, description: 'Complete bridal makeup, hair, and skincare' },
    { id: 'svc_6', name: 'Beard Trim', duration: 20, price: 300, description: 'Professional beard trim and shaping' },
  ],
  greeting: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?",
  transferNumber: '+91 98765 43210',
  faqs: [
    { id: 'faq_1', question: 'Where are you located?', answer: "We're at 42 MG Road, Indiranagar, Bangalore. Near the Indiranagar Metro Station." },
    { id: 'faq_2', question: 'Do you take walk-ins?', answer: 'Yes, we accept walk-ins based on availability, but we recommend booking in advance to ensure your preferred time slot.' },
    { id: 'faq_3', question: 'What are your prices?', answer: 'Our prices start at ₹300 for a beard trim and go up to ₹8,000 for our bridal package. Would you like to know the price for a specific service?' },
    { id: 'faq_4', question: 'Do you have parking?', answer: 'Yes, we have complimentary parking for customers in the building basement. Just validate your ticket at the reception.' },
    { id: 'faq_5', question: 'Can I cancel my appointment?', answer: 'Yes, you can cancel up to 2 hours before your appointment at no charge. Late cancellations may incur a 50% fee.' },
  ],
  botVoice: 'friendly',
};

// =====================
// Calls data
// =====================
const sampleTranscript1: TranscriptLine[] = [
  { speaker: 'bot', text: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?", timestamp: '00:00' },
  { speaker: 'caller', text: "Hi, I'd like to book a haircut for tomorrow.", timestamp: '00:04' },
  { speaker: 'bot', text: "I'd be happy to help you book a haircut! Let me check availability for tomorrow. Could I have your name, please?", timestamp: '00:06' },
  { speaker: 'caller', text: 'Sure, my name is Priya Sharma.', timestamp: '00:10' },
  { speaker: 'bot', text: "Thank you, Priya! We have slots available at 10:00 AM, 2:00 PM, and 4:30 PM tomorrow. Which time works best for you?", timestamp: '00:13' },
  { speaker: 'caller', text: '2 PM would be great.', timestamp: '00:17' },
  { speaker: 'bot', text: "Perfect! And could I get your phone number for the booking?", timestamp: '00:19' },
  { speaker: 'caller', text: "It's 98765 12345.", timestamp: '00:22' },
  { speaker: 'bot', text: "Great! Let me confirm: Haircut & Styling for Priya Sharma, tomorrow at 2:00 PM. The service takes about 45 minutes and costs ₹800. Shall I go ahead and book this?", timestamp: '00:25' },
  { speaker: 'caller', text: 'Yes, please!', timestamp: '00:30' },
  { speaker: 'bot', text: "Done! Your appointment is confirmed. You'll receive a confirmation shortly. Is there anything else I can help with?", timestamp: '00:32' },
  { speaker: 'caller', text: "No, that's all. Thank you!", timestamp: '00:35' },
  { speaker: 'bot', text: "You're welcome, Priya! We look forward to seeing you tomorrow. Have a great day!", timestamp: '00:37' },
];

const sampleTranscript2: TranscriptLine[] = [
  { speaker: 'bot', text: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?", timestamp: '00:00' },
  { speaker: 'caller', text: 'What time do you close today?', timestamp: '00:04' },
  { speaker: 'bot', text: "We're open today until 8:00 PM. Is there anything else you'd like to know?", timestamp: '00:06' },
  { speaker: 'caller', text: 'Do you have parking?', timestamp: '00:09' },
  { speaker: 'bot', text: "Yes, we have complimentary parking for customers in the building basement. Just validate your ticket at the reception. Anything else?", timestamp: '00:11' },
  { speaker: 'caller', text: "No, thanks. I'll come by later.", timestamp: '00:15' },
  { speaker: 'bot', text: "Wonderful! We'll be here. Have a great day!", timestamp: '00:17' },
];

const sampleTranscript3: TranscriptLine[] = [
  { speaker: 'bot', text: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?", timestamp: '00:00' },
  { speaker: 'caller', text: "I need to speak to the manager. I had a terrible experience last time.", timestamp: '00:04' },
  { speaker: 'bot', text: "I'm sorry to hear about your experience. I completely understand your frustration. Let me transfer you to our manager right away.", timestamp: '00:07' },
  { speaker: 'caller', text: 'Yes, please do that.', timestamp: '00:11' },
  { speaker: 'bot', text: "I'm transferring you now. Before I do, I've noted your concern so the manager will have context. Please hold for a moment.", timestamp: '00:13' },
];

const sampleTranscript4: TranscriptLine[] = [
  { speaker: 'bot', text: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?", timestamp: '00:00' },
  { speaker: 'caller', text: "Hi, I wanted to leave a message for Anita. Can you let her know that Ravi called?", timestamp: '00:04' },
  { speaker: 'bot', text: "Of course! I'll make sure Anita gets your message. Could you give me your phone number so she can reach you back?", timestamp: '00:08' },
  { speaker: 'caller', text: "Sure, it's 99887 76655. Tell her it's about the bridal trial we discussed.", timestamp: '00:12' },
  { speaker: 'bot', text: "Got it! Let me read that back: Message for Anita from Ravi at 99887 76655, regarding the bridal trial discussion. Is that correct?", timestamp: '00:16' },
  { speaker: 'caller', text: 'Yes, perfect.', timestamp: '00:20' },
  { speaker: 'bot', text: "I've saved the message and Anita will be notified. Is there anything else?", timestamp: '00:22' },
  { speaker: 'caller', text: "No, that's it. Thanks!", timestamp: '00:25' },
  { speaker: 'bot', text: "You're welcome, Ravi! Have a great day!", timestamp: '00:27' },
];

export const mockCalls: Call[] = [
  {
    id: 'call_001',
    businessId: 'biz_001',
    callerNumber: '+91 98765 12345',
    callerName: 'Priya Sharma',
    startedAt: minutesAgo(25),
    endedAt: minutesAgo(22),
    duration: 185,
    intent: 'booking',
    outcome: 'booked',
    summary: 'Caller booked a Haircut & Styling appointment for tomorrow at 2:00 PM.',
    transcript: sampleTranscript1,
    transferred: false,
    followUpNeeded: false,
    sentiment: 'positive',
  },
  {
    id: 'call_002',
    businessId: 'biz_001',
    callerNumber: '+91 87654 32100',
    callerName: 'Unknown',
    startedAt: hoursAgo(2),
    endedAt: hoursAgo(2),
    duration: 68,
    intent: 'faq',
    outcome: 'resolved',
    summary: 'Caller asked about closing time and parking availability. Both answered successfully.',
    transcript: sampleTranscript2,
    transferred: false,
    followUpNeeded: false,
    sentiment: 'neutral',
  },
  {
    id: 'call_003',
    businessId: 'biz_001',
    callerNumber: '+91 77889 90011',
    callerName: 'Meena Reddy',
    startedAt: hoursAgo(4),
    endedAt: hoursAgo(4),
    duration: 92,
    intent: 'complaint',
    outcome: 'transferred',
    summary: 'Caller had a complaint about a previous visit. Transferred to manager.',
    transcript: sampleTranscript3,
    transferred: true,
    followUpNeeded: true,
    sentiment: 'negative',
  },
  {
    id: 'call_004',
    businessId: 'biz_001',
    callerNumber: '+91 99887 76655',
    callerName: 'Ravi Kumar',
    startedAt: hoursAgo(6),
    endedAt: hoursAgo(6),
    duration: 110,
    intent: 'message',
    outcome: 'message_taken',
    summary: 'Message for Anita from Ravi regarding a bridal trial discussion.',
    transcript: sampleTranscript4,
    transferred: false,
    followUpNeeded: false,
    sentiment: 'positive',
  },
  {
    id: 'call_005',
    businessId: 'biz_001',
    callerNumber: '+91 88990 01122',
    callerName: 'Deepa Nair',
    startedAt: daysAgo(1),
    endedAt: daysAgo(1),
    duration: 145,
    intent: 'booking',
    outcome: 'booked',
    summary: 'Booked Facial Treatment for Saturday 11:00 AM.',
    transcript: sampleTranscript1,
    transferred: false,
    followUpNeeded: false,
    sentiment: 'positive',
  },
  {
    id: 'call_006',
    businessId: 'biz_001',
    callerNumber: '+91 70012 34567',
    callerName: 'Arjun Mehta',
    startedAt: daysAgo(1),
    endedAt: daysAgo(1),
    duration: 55,
    intent: 'faq',
    outcome: 'resolved',
    summary: 'Asked about service prices and availability. Resolved.',
    transcript: sampleTranscript2,
    transferred: false,
    followUpNeeded: false,
    sentiment: 'neutral',
  },
  {
    id: 'call_007',
    businessId: 'biz_001',
    callerNumber: '+91 91234 56789',
    callerName: 'Sujata Iyer',
    startedAt: daysAgo(2),
    endedAt: daysAgo(2),
    duration: 200,
    intent: 'booking',
    outcome: 'booked',
    summary: 'Booked Bridal Package for next Saturday 9:00 AM. Needs consultation.',
    transcript: sampleTranscript1,
    transferred: false,
    followUpNeeded: true,
    sentiment: 'positive',
  },
  {
    id: 'call_008',
    businessId: 'biz_001',
    callerNumber: '+91 82345 67890',
    callerName: 'Unknown',
    startedAt: daysAgo(3),
    endedAt: daysAgo(3),
    duration: 30,
    intent: 'other',
    outcome: 'abandoned',
    summary: 'Caller hung up after 30 seconds. Could not determine intent.',
    transcript: [
      { speaker: 'bot', text: "Hello! Thank you for calling Glow & Grace Salon. I'm your AI assistant. How can I help you today?", timestamp: '00:00' },
      { speaker: 'caller', text: 'Hello?', timestamp: '00:05' },
      { speaker: 'bot', text: "Hi there! How can I assist you today?", timestamp: '00:07' },
    ],
    transferred: false,
    followUpNeeded: false,
    sentiment: 'neutral',
  },
];

// =====================
// Appointments data
// =====================
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(now);
dayAfter.setDate(dayAfter.getDate() + 2);
const nextWeek = new Date(now);
nextWeek.setDate(nextWeek.getDate() + 5);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_001',
    businessId: 'biz_001',
    callerName: 'Priya Sharma',
    callerPhone: '+91 98765 12345',
    service: 'Haircut & Styling',
    date: formatDate(tomorrow),
    time: '14:00',
    duration: 45,
    status: 'confirmed',
    notes: 'Booked via AI assistant',
    createdAt: minutesAgo(25),
    createdBy: 'bot',
  },
  {
    id: 'apt_002',
    businessId: 'biz_001',
    callerName: 'Deepa Nair',
    callerPhone: '+91 88990 01122',
    service: 'Facial Treatment',
    date: formatDate(dayAfter),
    time: '11:00',
    duration: 60,
    status: 'confirmed',
    notes: 'Booked via AI assistant',
    createdAt: daysAgo(1),
    createdBy: 'bot',
  },
  {
    id: 'apt_003',
    businessId: 'biz_001',
    callerName: 'Sujata Iyer',
    callerPhone: '+91 91234 56789',
    service: 'Bridal Package',
    date: formatDate(nextWeek),
    time: '09:00',
    duration: 180,
    status: 'pending',
    notes: 'Needs consultation call before the appointment. Booked via AI.',
    createdAt: daysAgo(2),
    createdBy: 'bot',
  },
  {
    id: 'apt_004',
    businessId: 'biz_001',
    callerName: 'Kavitha Rao',
    callerPhone: '+91 78901 23456',
    service: 'Manicure & Pedicure',
    date: formatDate(tomorrow),
    time: '16:00',
    duration: 75,
    status: 'confirmed',
    notes: '',
    createdAt: daysAgo(3),
    createdBy: 'manual',
  },
  {
    id: 'apt_005',
    businessId: 'biz_001',
    callerName: 'Raj Patel',
    callerPhone: '+91 80123 45678',
    service: 'Hair Coloring',
    date: formatDate(now),
    time: '10:00',
    duration: 90,
    status: 'completed',
    notes: '',
    createdAt: daysAgo(5),
    createdBy: 'bot',
  },
];

// =====================
// Messages data
// =====================
export const mockMessages: Message[] = [
  {
    id: 'msg_001',
    businessId: 'biz_001',
    callerName: 'Ravi Kumar',
    callerPhone: '+91 99887 76655',
    recipient: 'Anita',
    body: 'Regarding the bridal trial we discussed. Please call back at your earliest convenience.',
    status: 'new',
    priority: 'normal',
    createdAt: hoursAgo(6),
    callId: 'call_004',
  },
  {
    id: 'msg_002',
    businessId: 'biz_001',
    callerName: 'Sunita Verma',
    callerPhone: '+91 70098 76543',
    recipient: 'Manager',
    body: 'Wants to discuss a bulk booking for a corporate event. Needs 10+ slots for next month.',
    status: 'new',
    priority: 'urgent',
    createdAt: daysAgo(1),
  },
  {
    id: 'msg_003',
    businessId: 'biz_001',
    callerName: 'Amita Shah',
    callerPhone: '+91 90123 45678',
    recipient: 'Anita',
    body: 'Asking about hair treatment products used at the salon. Wants to buy some for home use.',
    status: 'read',
    priority: 'normal',
    createdAt: daysAgo(2),
  },
  {
    id: 'msg_004',
    businessId: 'biz_001',
    callerName: 'Vikram Singh',
    callerPhone: '+91 81234 56789',
    recipient: 'Owner',
    body: 'Partnership inquiry — owns a spa and wants to explore cross-promotion.',
    status: 'called_back',
    priority: 'normal',
    createdAt: daysAgo(4),
  },
];

// =====================
// Dashboard stats
// =====================
export const mockStats: DashboardStats = {
  totalCalls: 47,
  callsToday: 4,
  resolvedRate: 74,
  avgDuration: 112,
  pendingAppointments: 3,
  newMessages: 2,
  transferRate: 15,
  missedCalls: 0,
};

// =====================
// Data mutation helpers (simulate backend)
// =====================
let calls = [...mockCalls];
let appointments = [...mockAppointments];
let messages = [...mockMessages];
let business = { ...defaultBusiness };
let stats = { ...mockStats };

export const store = {
  // Calls
  getCalls: () => [...calls],
  getCall: (callId: string) => calls.find(c => c.id === callId),
  addCall: (call: Omit<Call, 'id'>) => {
    const newCall = { ...call, id: `call_${id()}` } as Call;
    calls = [newCall, ...calls];
    stats = { ...stats, totalCalls: stats.totalCalls + 1, callsToday: stats.callsToday + 1 };
    return newCall;
  },

  // Appointments
  getAppointments: () => [...appointments],
  addAppointment: (apt: Omit<Appointment, 'id' | 'createdAt'>) => {
    const newApt = { ...apt, id: `apt_${id()}`, createdAt: new Date().toISOString() } as Appointment;
    appointments = [newApt, ...appointments];
    stats = { ...stats, pendingAppointments: stats.pendingAppointments + 1 };
    return newApt;
  },
  updateAppointment: (aptId: string, updates: Partial<Appointment>) => {
    appointments = appointments.map(a => a.id === aptId ? { ...a, ...updates } : a);
  },
  cancelAppointment: (aptId: string) => {
    appointments = appointments.map(a => a.id === aptId ? { ...a, status: 'cancelled' as const } : a);
  },

  // Messages
  getMessages: () => [...messages],
  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => {
    const newMsg = { ...msg, id: `msg_${id()}`, createdAt: new Date().toISOString() } as Message;
    messages = [newMsg, ...messages];
    stats = { ...stats, newMessages: stats.newMessages + 1 };
    return newMsg;
  },
  updateMessageStatus: (msgId: string, status: Message['status']) => {
    messages = messages.map(m => m.id === msgId ? { ...m, status } : m);
    if (status !== 'new') {
      stats = { ...stats, newMessages: Math.max(0, stats.newMessages - 1) };
    }
  },

  // Business
  getBusiness: () => ({ ...business }),
  updateBusiness: (updates: Partial<Business>) => {
    business = { ...business, ...updates };
    return business;
  },

  // Stats
  getStats: () => ({ ...stats }),
};

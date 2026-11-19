// ============================================
// Settings Page — SaaS Business & AI Controls
// ============================================

import { useState } from 'react';
import {
  Building2,
  Clock,
  Bot,
  HelpCircle,
  Plus,
  Trash2,
  Phone,
  Moon,
  Sun,
  Palette,
  Check,
  Save,
} from 'lucide-react';
import { store } from '../data';
import type { Business, DayHours } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/Badge';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function Settings() {
  const [biz, setBiz] = useState<Business>(store.getBusiness());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'hours' | 'bot' | 'faqs' | 'appearance'>('business');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem('callflow_llm_provider') || 'gemini');
  const [llmKey, setLlmKey] = useState(() => localStorage.getItem('callflow_llm_key') || '');

  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    store.updateBusiness(biz);
    localStorage.setItem('callflow_llm_provider', llmProvider);
    localStorage.setItem('callflow_llm_key', llmKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateHours = (day: DayKey, field: keyof DayHours, value: string | boolean) => {
    setBiz(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value },
      },
    }));
  };

  const addFAQ = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newFaq = {
      id: `faq_${Date.now()}`,
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
    };
    setBiz(prev => ({ ...prev, faqs: [...prev.faqs, newFaq] }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  const removeFAQ = (id: string) => {
    setBiz(prev => ({ ...prev, faqs: prev.faqs.filter(f => f.id !== id) }));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure business details, operational hours, bot prompt, and UI theme</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} id="btn-save-settings">
          <Save size={15} />
          <span>{saved ? 'Changes Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="segmented-control" style={{ marginBottom: 24, maxWidth: 640 }}>
        {[
          { key: 'business', label: 'Business Profile', icon: Building2 },
          { key: 'hours', label: 'Operating Hours', icon: Clock },
          { key: 'bot', label: 'AI Voice Bot', icon: Bot },
          { key: 'faqs', label: 'Knowledge Base', icon: HelpCircle },
          { key: 'appearance', label: 'Appearance', icon: Palette },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`segmented-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key as typeof activeTab)}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Business Info Tab */}
      {activeTab === 'business' && (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Business Profile
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Used by the voice assistant when introducing your establishment to callers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Business Name</label>
              <input
                className="form-input"
                value={biz.name}
                onChange={e => setBiz(prev => ({ ...prev, name: e.target.value }))}
                id="setting-name"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Physical Address</label>
              <input
                className="form-input"
                value={biz.address}
                onChange={e => setBiz(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Main Business Phone</label>
              <input
                className="form-input"
                value={biz.phone}
                onChange={e => setBiz(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Email Notification Inbox</label>
              <input
                className="form-input"
                type="email"
                value={biz.email}
                onChange={e => setBiz(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={13} style={{ color: 'var(--accent)' }} />
                <span>Escalation / Transfer Phone Number</span>
              </label>
              <input
                className="form-input"
                value={biz.transferNumber}
                onChange={e => setBiz(prev => ({ ...prev, transferNumber: e.target.value }))}
                placeholder="+91 80 4567 8999"
              />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Calls requiring urgent human intervention or staff transfer will be routed to this line.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Operating Hours Tab */}
      {activeTab === 'hours' && (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Operating Schedule
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              The AI receptionist references these hours when taking appointment requests.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DAYS.map(day => (
              <div
                key={day}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 1fr 90px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: biz.hours[day].closed ? 'var(--bg-app)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {DAY_LABELS[day]}
                </span>
                <input
                  className="form-input"
                  type="time"
                  value={biz.hours[day].open}
                  disabled={biz.hours[day].closed}
                  onChange={e => updateHours(day, 'open', e.target.value)}
                  style={{ height: 34, fontSize: 13, opacity: biz.hours[day].closed ? 0.4 : 1 }}
                />
                <input
                  className="form-input"
                  type="time"
                  value={biz.hours[day].close}
                  disabled={biz.hours[day].closed}
                  onChange={e => updateHours(day, 'close', e.target.value)}
                  style={{ height: 34, fontSize: 13, opacity: biz.hours[day].closed ? 0.4 : 1 }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <input
                    type="checkbox"
                    checked={biz.hours[day].closed}
                    onChange={e => updateHours(day, 'closed', e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  Closed
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bot Config Tab */}
      {activeTab === 'bot' && (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Receptionist Behavior
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Fine-tune the initial spoken greeting and personality tone.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label">Opening Spoken Greeting</label>
              <textarea
                className="form-input"
                rows={3}
                value={biz.greeting}
                onChange={e => setBiz(prev => ({ ...prev, greeting: e.target.value }))}
                style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 13 }}
                id="setting-greeting"
              />
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                This is read aloud in a warm, friendly voice as soon as the customer's call connects.
              </p>
            </div>

            <div>
              <label className="form-label">Personality Tone</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {(['professional', 'friendly', 'calm'] as const).map(voice => {
                  const isSelected = biz.botVoice === voice;
                  return (
                    <button
                      key={voice}
                      type="button"
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setBiz(prev => ({ ...prev, botVoice: voice }))}
                      style={{ textTransform: 'capitalize', justifyContent: 'center', height: 40 }}
                    >
                      {voice === 'professional' ? '👔' : voice === 'friendly' ? '😊' : '🧘'}{' '}
                      <span style={{ marginLeft: 6 }}>{voice}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LLM Intelligence Config */}
            <div
              style={{
                padding: 18,
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    AI Intelligence Engine & Cloud LLM
                  </span>
                  <Badge variant="purple" size="sm">Real-Time LLM</Badge>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
                  Enables the AI receptionist to answer any question (jokes, math, science, chitchat, out-of-context topics) and book appointments.
                </p>
              </div>

              <div>
                <label className="form-label">Provider</label>
                <select
                  className="form-input form-select"
                  value={llmProvider}
                  onChange={e => setLlmProvider(e.target.value)}
                  style={{ height: 36, fontSize: 13 }}
                >
                  <option value="gemini">Google Gemini API (Recommended - gemini-1.5-flash)</option>
                  <option value="groq">Groq Cloud (Ultra-Fast 200ms - Llama 3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                </select>
              </div>

              <div>
                <label className="form-label">API Key (Optional)</label>
                <input
                  type="password"
                  className="form-input"
                  value={llmKey}
                  onChange={e => setLlmKey(e.target.value)}
                  placeholder="Paste your API key here (e.g. AIzaSy... or gsk_...)"
                  style={{ height: 36, fontSize: 13 }}
                />
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {llmKey ? 'Cloud LLM is ACTIVE. The bot will answer literally any question asked.' : 'No key entered: Using the built-in smart conversational engine with chitchat, jokes, math, and salon bookings.'}
                </p>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Badge variant="success" size="sm">Voice Engine Active</Badge>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                High-definition natural English voice (Rate: 1.0x, Pitch: 1.0). Equipped with continuous Voice Activity Detection (VAD) and auto-barge-in interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Knowledge Base Q&A
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              CallFlow AI answers caller questions automatically based on these verified facts.
            </p>
          </div>

          {biz.faqs.map((faq, i) => (
            <div key={faq.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Fact #{i + 1}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {faq.question}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {faq.answer}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => removeFAQ(faq.id)}
                  style={{ color: 'var(--status-danger-text)', flexShrink: 0 }}
                  title="Remove FAQ item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new FAQ */}
          <div className="card" style={{ padding: 20, borderStyle: 'dashed' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
              + Add New Business Fact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Question or Topic</label>
                <input
                  className="form-input"
                  value={newFaqQ}
                  onChange={e => setNewFaqQ(e.target.value)}
                  placeholder="e.g. What is your parking policy?"
                  id="new-faq-question"
                />
              </div>
              <div>
                <label className="form-label">Verified Answer</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={newFaqA}
                  onChange={e => setNewFaqA(e.target.value)}
                  placeholder="e.g. We have complimentary valet parking available at our front entrance."
                  style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 13 }}
                  id="new-faq-answer"
                />
              </div>
              <div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addFAQ}
                  disabled={!newFaqQ.trim() || !newFaqA.trim()}
                  id="btn-add-faq"
                >
                  <Plus size={14} />
                  <span>Add to Knowledge Base</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance & Theme Tab */}
      {activeTab === 'appearance' && (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Appearance & Theme
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Choose your interface appearance. Changes are preserved across sessions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {/* Light Mode Card */}
            <div
              className={`card card-hover ${theme === 'light' ? 'selected' : ''}`}
              style={{
                padding: 16,
                cursor: 'pointer',
                border: theme === 'light' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                background: theme === 'light' ? 'var(--accent-subtle)' : 'var(--card-bg)',
              }}
              onClick={() => setTheme('light')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sun size={18} style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Light Theme</span>
                </div>
                {theme === 'light' && <Check size={16} style={{ color: 'var(--accent)' }} />}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Default calm, modern aesthetic with high contrast off-white surfaces and subtle 1px gray borders.
              </p>
            </div>

            {/* Dark Mode Card */}
            <div
              className={`card card-hover ${theme === 'dark' ? 'selected' : ''}`}
              style={{
                padding: 16,
                cursor: 'pointer',
                border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                background: theme === 'dark' ? 'var(--accent-subtle)' : 'var(--card-bg)',
              }}
              onClick={() => setTheme('dark')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Moon size={18} style={{ color: theme === 'dark' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Dark Theme</span>
                </div>
                {theme === 'dark' && <Check size={16} style={{ color: 'var(--accent)' }} />}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Polished dark slate tones (#0E1015 / #151821) avoiding harsh pure blacks, optimized for low light.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Analytics Page — SaaS Performance Metrics
// ============================================

import {
  BarChart3,
  CheckCircle,
  Calendar,
  MessageSquare,
  Smile,
} from 'lucide-react';
import { store } from '../data';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export default function Analytics() {
  const calls = store.getCalls();
  const appointments = store.getAppointments();
  const messages = store.getMessages();
  const stats = store.getStats();

  const totalCalls = calls.length;

  // Intent breakdown
  const intentCounts = calls.reduce<Record<string, number>>((acc, c) => {
    acc[c.intent] = (acc[c.intent] || 0) + 1;
    return acc;
  }, {});

  // Outcome breakdown
  const outcomeCounts = calls.reduce<Record<string, number>>((acc, c) => {
    acc[c.outcome] = (acc[c.outcome] || 0) + 1;
    return acc;
  }, {});

  // Sentiment breakdown
  const sentimentCounts = calls.reduce<Record<string, number>>((acc, c) => {
    acc[c.sentiment] = (acc[c.sentiment] || 0) + 1;
    return acc;
  }, {});

  const intentLabels: Record<string, string> = {
    booking: 'Booking',
    faq: 'FAQ',
    message: 'Message',
    complaint: 'Complaint',
    transfer: 'Transfer',
    other: 'Other',
  };

  const outcomeLabels: Record<string, string> = {
    resolved: 'Resolved',
    booked: 'Booked',
    message_taken: 'Message Taken',
    transferred: 'Transferred',
    abandoned: 'Abandoned',
    ended: 'Ended',
  };

  const Bar = ({
    label,
    count,
    total,
    color,
  }: {
    key?: string;
    label: string;
    count: number;
    total: number;
    color: string;
  }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            {count} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({pct}%)</span>
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 'var(--radius-full)',
            background: 'var(--border-color)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: color,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>
    );
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Analytics & Intelligence</h2>
          <p>Real-time telemetry and resolution analytics across all conversation channels</p>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="stat-cards-row" style={{ marginBottom: 24 }}>
        <StatCard
          label="Total Inbound Calls"
          value={stats.totalCalls}
          trend={{ value: '+14% vs last week', direction: 'up' }}
          sparklineData={[18, 22, 28, 25, 34, 40, stats.totalCalls]}
          sparklineColor="var(--accent)"
        />
        <StatCard
          label="Autonomous Resolution Rate"
          value={`${stats.resolvedRate}%`}
          trend={{ value: '+3.2% trend', direction: 'up' }}
          sparklineData={[70, 74, 76, 78, 80, 81, stats.resolvedRate]}
          sparklineColor="var(--status-success-dot)"
        />
        <StatCard
          label="Average Call Duration"
          value={formatSecs(stats.avgDuration)}
          trend={{ value: '-12s latency', direction: 'down' }}
          sparklineData={[135, 128, 120, 115, 110, 105, stats.avgDuration]}
          sparklineColor="var(--accent)"
        />
        <StatCard
          label="Staff Escalation Rate"
          value={`${stats.transferRate}%`}
          trend={{ value: '-2.1% lower', direction: 'down' }}
          sparklineData={[16, 14, 12, 11, 10, 9, stats.transferRate]}
          sparklineColor="var(--status-warning-dot)"
        />
      </div>

      {/* Row 2: Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
            <span>Intent Distribution</span>
          </h3>
          {Object.entries(intentCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([intent, count]) => (
              <Bar
                key={intent}
                label={intentLabels[intent] || intent}
                count={count}
                total={totalCalls}
                color="var(--accent)"
              />
            ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} style={{ color: 'var(--status-success-dot)' }} />
            <span>Call Outcomes</span>
          </h3>
          {Object.entries(outcomeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([outcome, count]) => (
              <Bar
                key={outcome}
                label={outcomeLabels[outcome] || outcome}
                count={count}
                total={totalCalls}
                color={
                  outcome === 'resolved' || outcome === 'booked'
                    ? 'var(--status-success-dot)'
                    : outcome === 'transferred'
                    ? 'var(--status-warning-dot)'
                    : outcome === 'abandoned'
                    ? 'var(--status-danger-dot)'
                    : 'var(--text-tertiary)'
                }
              />
            ))}
        </div>
      </div>

      {/* Row 3: Sentiment & Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Sentiment */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smile size={16} style={{ color: 'var(--accent)' }} />
            <span>Sentiment Analysis</span>
          </h3>
          {[
            { key: 'positive', label: 'Positive Experience', color: 'var(--status-success-dot)' },
            { key: 'neutral', label: 'Neutral Inquiry', color: 'var(--accent)' },
            { key: 'negative', label: 'Negative / Frustrated', color: 'var(--status-danger-dot)' },
          ].map(({ key, label, color }) => (
            <Bar
              key={key}
              label={label}
              count={sentimentCounts[key] || 0}
              total={totalCalls}
              color={color}
            />
          ))}
        </div>

        {/* Appointments Summary */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: 'var(--accent)' }} />
            <span>Bookings Telemetry</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Bookings</span>
              <strong style={{ color: 'var(--text-primary)' }}>{appointments.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Confirmed</span>
              <Badge variant="success" size="sm">
                {appointments.filter(a => a.status === 'confirmed').length}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pending Review</span>
              <Badge variant="warning" size="sm">
                {appointments.filter(a => a.status === 'pending').length}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Booked autonomously by AI</span>
              <Badge variant="purple" size="sm">
                {appointments.filter(a => a.createdBy === 'bot').length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Message Summary */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
            <span>Messages Intake</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Recorded</span>
              <strong style={{ color: 'var(--text-primary)' }}>{messages.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>New & Unread</span>
              <Badge variant="danger" size="sm">
                {messages.filter(m => m.status === 'new').length}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Urgent Callback</span>
              <Badge variant="warning" size="sm">
                {messages.filter(m => m.priority === 'urgent').length}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Callbacks Completed</span>
              <Badge variant="success" size="sm">
                {messages.filter(m => m.status === 'called_back').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

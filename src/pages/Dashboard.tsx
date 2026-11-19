// ============================================
// Dashboard Page — Calm, Modern SaaS Layout
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  CalendarCheck2,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge, type BadgeVariant } from '../components/Badge';
import { Drawer } from '../components/Drawer';
import { store } from '../data';
import type { Call } from '../types';
import { format, formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = store.getStats();
  const allCalls = store.getCalls();
  const recentCalls = allCalls.slice(0, 5);
  const appointments = store
    .getAppointments()
    .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
    .slice(0, 4);

  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const outcomeVariants: Record<string, BadgeVariant> = {
    resolved: 'success',
    booked: 'info',
    message_taken: 'warning',
    transferred: 'danger',
    abandoned: 'neutral',
    ended: 'neutral',
  };

  const outcomeLabels: Record<string, string> = {
    resolved: 'Resolved',
    booked: 'Booked',
    message_taken: 'Message',
    transferred: 'Transferred',
    abandoned: 'Missed',
    ended: 'Completed',
  };

  // 7-day vs 30-day Chart Data
  const chartPoints7d = [
    { label: 'Mon', calls: 8 },
    { label: 'Tue', calls: 14 },
    { label: 'Wed', calls: 11 },
    { label: 'Thu', calls: 19 },
    { label: 'Fri', calls: 24 },
    { label: 'Sat', calls: 21 },
    { label: 'Sun', calls: 9 },
  ];

  const chartPoints30d = [
    { label: 'Week 1', calls: 62 },
    { label: 'Week 2', calls: 84 },
    { label: 'Week 3', calls: 98 },
    { label: 'Week 4', calls: 110 },
  ];

  const currentChart = timeRange === '7d' ? chartPoints7d : chartPoints30d;
  const maxCalls = Math.max(...currentChart.map(p => p.calls), 1);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subheading">
            Live overview of incoming phone inquiries, call resolutions, and booked clients.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/appointments')}>
            <CalendarCheck2 size={15} />
            <span>View Calendar</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/simulator')}>
            <span>Test Call Simulator</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Stat Cards */}
      <div className="stats-grid-4">
        <StatCard
          label="Total calls"
          value={stats.totalCalls}
          trend={{ value: '+12% this week', isUp: true }}
          sparklineData={[8, 12, 10, 16, 22, 19, 26]}
          sparklineColor="#4f46e5"
        />
        <StatCard
          label="Resolved by AI"
          value={`${stats.resolvedRate}%`}
          trend={{ value: '+4% vs avg', isUp: true }}
          sparklineData={[68, 70, 71, 74, 76, 75, 78]}
          sparklineColor="#10b981"
        />
        <StatCard
          label="Avg call duration"
          value={formatDuration(stats.avgDuration)}
          trend={{ value: '-6s faster', isUp: true }}
          sparklineData={[130, 124, 120, 118, 115, 112, 110]}
          sparklineColor="#6366f1"
        />
        <StatCard
          label="Escalation rate"
          value={`${stats.transferRate}%`}
          trend={{ value: '-2% reduction', isUp: false }}
          sparklineData={[18, 17, 16, 15, 16, 14, 13]}
          sparklineColor="#9ca3af"
        />
      </div>

      {/* Row 2: Main Area Chart & Call Outcomes */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Main Calls Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="card-title">Call Volume Activity</h3>
            </div>

            {/* Segmented Control */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-surface-hover)',
                padding: 3,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                className={`btn btn-sm ${timeRange === '7d' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: 12, borderRadius: 4 }}
                onClick={() => setTimeRange('7d')}
              >
                Last 7 days
              </button>
              <button
                className={`btn btn-sm ${timeRange === '30d' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: 12, borderRadius: 4 }}
                onClick={() => setTimeRange('30d')}
              >
                Last 30 days
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* SVG Area Chart */}
            <div style={{ width: '100%', height: 210, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="var(--border-color)" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="var(--border-color)" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="var(--border-color)" strokeDasharray="3 3" />

                {/* Closed Area */}
                <polygon
                  fill="url(#callGrad)"
                  points={`
                    0,180
                    ${currentChart
                      .map((p, idx) => {
                        const x = (idx / (currentChart.length - 1)) * 580 + 10;
                        const y = 170 - (p.calls / maxCalls) * 130;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    600,180
                  `}
                />

                {/* Stroke Line */}
                <polyline
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={currentChart
                    .map((p, idx) => {
                      const x = (idx / (currentChart.length - 1)) * 580 + 10;
                      const y = 170 - (p.calls / maxCalls) * 130;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Nodes */}
                {currentChart.map((p, idx) => {
                  const x = (idx / (currentChart.length - 1)) * 580 + 10;
                  const y = 170 - (p.calls / maxCalls) * 130;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="var(--bg-surface)"
                      stroke="#4f46e5"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* Labels below chart */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                }}
              >
                {currentChart.map(p => (
                  <span key={p.label}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call Outcomes Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Outcomes</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>47 calls</span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Resolved instantly', pct: 64, count: 30, color: 'var(--status-success-dot)' },
              { label: 'Appointments booked', pct: 21, count: 10, color: 'var(--accent-primary)' },
              { label: 'Messages taken', pct: 9, count: 4, color: 'var(--status-warning-dot)' },
              { label: 'Transferred to staff', pct: 6, count: 3, color: 'var(--status-danger-dot)' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.pct}%)</span>
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-surface-hover)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.pct}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Calls & Upcoming Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Recent Calls Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Inbound Calls</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calls')}>
              <span>View all</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Intent</th>
                  <th>Outcome</th>
                  <th>Duration</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCall(c)} title="Click to view transcript">
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                        {c.callerName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.callerNumber}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {c.intent}
                      </span>
                    </td>
                    <td>
                      <Badge variant={outcomeVariants[c.outcome] || 'neutral'}>
                        {outcomeLabels[c.outcome] || c.outcome}
                      </Badge>
                    </td>
                    <td style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(c.duration)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(c.startedAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Appointments List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Appointments</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/appointments')}>
              <span>View schedule</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div className="card-body" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appointments.map(apt => (
              <div
                key={apt.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {apt.callerName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apt.service}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {apt.time}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {format(new Date(apt.date), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right-Side Slide-Over Drawer for Call Details */}
      <Drawer
        isOpen={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
        title="Call Details & Transcript"
        subtitle={selectedCall ? `${selectedCall.callerName} · ${selectedCall.callerNumber}` : ''}
        footer={
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCall(null)}>
            Close
          </button>
        }
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick KPI Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Outcome</span>
                <Badge variant={outcomeVariants[selectedCall.outcome] || 'neutral'}>
                  {outcomeLabels[selectedCall.outcome]}
                </Badge>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Duration</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDuration(selectedCall.duration)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>Sentiment</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                  {selectedCall.sentiment}
                </span>
              </div>
            </div>

            {/* Summary Box */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                AI Summary
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-surface-hover)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                {selectedCall.summary}
              </p>
            </div>

            {/* Conversation Transcript */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                Full Audio Transcript
              </h4>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  maxHeight: 340,
                  overflowY: 'auto',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {selectedCall.transcript.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: line.speaker === 'bot' ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                      {line.speaker === 'bot' ? 'AI Receptionist' : 'Caller'} · {line.timestamp}
                    </span>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12.5,
                        lineHeight: 1.45,
                        maxWidth: '85%',
                        background: line.speaker === 'bot' ? 'var(--bg-surface)' : 'var(--accent-primary)',
                        color: line.speaker === 'bot' ? 'var(--text-primary)' : 'white',
                        border: line.speaker === 'bot' ? '1px solid var(--border-color)' : 'none',
                      }}
                    >
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

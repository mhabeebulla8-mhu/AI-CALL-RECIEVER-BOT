// ============================================
// Call Logs Page — Premium SaaS Table + Drawer
// ============================================

import { useState } from 'react';
import {
  Search,
  Clock,
  PhoneForwarded,
  AlertTriangle,
  ChevronRight,
  Phone,
  Calendar,
  Sparkles,
  Download,
} from 'lucide-react';
import { store } from '../data';
import { formatDistanceToNow } from 'date-fns';
import type { Call } from '../types';
import { Badge } from '../components/Badge';
import { Drawer } from '../components/Drawer';
import { EmptyState } from '../components/EmptyState';

export default function CallLogs() {
  const [calls] = useState(store.getCalls());
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');

  const filteredCalls = calls.filter(call => {
    const matchesSearch =
      call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.callerNumber.includes(searchQuery) ||
      call.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIntent = filterIntent === 'all' || call.intent === filterIntent;
    const matchesOutcome = filterOutcome === 'all' || call.outcome === filterOutcome;
    return matchesSearch && matchesIntent && matchesOutcome;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getIntentBadgeVariant = (intent: string) => {
    switch (intent) {
      case 'booking':
        return 'purple' as const;
      case 'faq':
        return 'info' as const;
      case 'message':
        return 'warning' as const;
      case 'complaint':
      case 'transfer':
        return 'danger' as const;
      default:
        return 'default' as const;
    }
  };

  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome) {
      case 'resolved':
      case 'booked':
        return 'success' as const;
      case 'message_taken':
        return 'info' as const;
      case 'transferred':
        return 'warning' as const;
      case 'abandoned':
        return 'danger' as const;
      default:
        return 'default' as const;
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Caller', 'Number', 'Intent', 'Outcome', 'Duration(s)', 'StartedAt', 'Summary'];
    const rows = filteredCalls.map(c => [
      c.id,
      `"${c.callerName.replace(/"/g, '""')}"`,
      `"${c.callerNumber}"`,
      c.intent,
      c.outcome,
      c.duration,
      c.startedAt,
      `"${c.summary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `call-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Call Logs</h2>
          <p>Complete historical log of all inbound and simulated calls</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by caller, phone, or summary..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
            />
          </div>

          {/* Intent Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-input form-select"
              value={filterIntent}
              onChange={e => setFilterIntent(e.target.value)}
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="all">All Intents</option>
              <option value="booking">Booking</option>
              <option value="faq">FAQ</option>
              <option value="message">Message</option>
              <option value="complaint">Complaint</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              className="form-input form-select"
              value={filterOutcome}
              onChange={e => setFilterOutcome(e.target.value)}
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="all">All Outcomes</option>
              <option value="resolved">Resolved</option>
              <option value="booked">Booked</option>
              <option value="message_taken">Message Taken</option>
              <option value="transferred">Transferred</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          {/* Clear filters button if active */}
          {(searchQuery || filterIntent !== 'all' || filterOutcome !== 'all') && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setFilterIntent('all');
                setFilterOutcome('all');
              }}
              style={{ fontSize: 12 }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Intent</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Sentiment</th>
                <th>Flags</th>
                <th>Time</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map(call => (
                <tr
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                      {call.callerName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {call.callerNumber}
                    </div>
                  </td>
                  <td>
                    <Badge variant={getIntentBadgeVariant(call.intent)} withDot size="sm">
                      {call.intent}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={getOutcomeBadgeVariant(call.outcome)} size="sm">
                      {call.outcome.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{formatDuration(call.duration)}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, textTransform: 'capitalize' }}>
                    <span style={{ color: call.sentiment === 'positive' ? 'var(--status-success-text)' : call.sentiment === 'negative' ? 'var(--status-danger-text)' : 'var(--text-secondary)' }}>
                      {call.sentiment}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {call.transferred && (
                        <Badge variant="warning" size="sm">
                          <PhoneForwarded size={11} style={{ marginRight: 3 }} />
                          Transferred
                        </Badge>
                      )}
                      {call.followUpNeeded && (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle size={11} style={{ marginRight: 3 }} />
                          Follow-up
                        </Badge>
                      )}
                      {!call.transferred && !call.followUpNeeded && (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 16 }}>
                    <ChevronRight size={15} style={{ color: 'var(--text-tertiary)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCalls.length === 0 && (
          <EmptyState
            icon={Phone}
            title="No call records found"
            description={
              searchQuery || filterIntent !== 'all' || filterOutcome !== 'all'
                ? 'Try adjusting your search query or reset filter settings.'
                : 'Calls placed through the Call Simulator or inbound phone number will appear here.'
            }
          />
        )}
      </div>

      {/* Right Slide-Over Drawer for Call Details */}
      <Drawer
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        title={selectedCall ? `Call with ${selectedCall.callerName}` : 'Call Record'}
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Metadata Pill Banner */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: 16,
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Phone Number
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedCall.callerNumber}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Duration
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDuration(selectedCall.duration)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Intent
                </div>
                <div>
                  <Badge variant={getIntentBadgeVariant(selectedCall.intent)} withDot size="sm">
                    {selectedCall.intent}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Outcome
                </div>
                <div>
                  <Badge variant={getOutcomeBadgeVariant(selectedCall.outcome)} size="sm">
                    {selectedCall.outcome.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* AI Summary Card */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Executive AI Summary
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  padding: 14,
                  background: 'var(--card-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {selectedCall.summary}
              </div>
            </div>

            {/* Transcript Area */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                Full Audio Transcript ({selectedCall.transcript.length} turns)
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  maxHeight: 380,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {selectedCall.transcript.map((line, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      lineHeight: 1.45,
                      background: line.speaker === 'bot' ? 'var(--bg-app)' : 'var(--accent-subtle)',
                      border: `1px solid ${line.speaker === 'bot' ? 'var(--border-color)' : 'rgba(79, 70, 229, 0.15)'}`,
                      alignSelf: line.speaker === 'bot' ? 'flex-start' : 'flex-end',
                      maxWidth: '90%',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: line.speaker === 'bot' ? 'var(--text-tertiary)' : 'var(--accent)',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                      }}
                    >
                      {line.speaker === 'bot' ? 'AI Assistant' : selectedCall.callerName}
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>{line.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer metadata */}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                borderTop: '1px solid var(--border-color)',
                paddingTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Calendar size={13} />
              <span>Initiated on {new Date(selectedCall.startedAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

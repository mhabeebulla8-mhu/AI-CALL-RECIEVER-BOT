// ============================================
// Messages Page — Clean Inbox + Slide Drawer
// ============================================

import { useState } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  MailOpen,
  Phone as PhoneIcon,
  Archive,
  AlertCircle,
  ChevronRight,
  Check,
  Copy,
} from 'lucide-react';
import { store } from '../data';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../types';
import { Badge } from '../components/Badge';
import { Drawer } from '../components/Drawer';
import { EmptyState } from '../components/EmptyState';

export default function Messages() {
  const [messages, setMessages] = useState(store.getMessages());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredMessages = messages.filter(msg => {
    const matchesSearch =
      msg.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.callerPhone.includes(searchQuery) ||
      msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || msg.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'danger' as const;
      case 'read':
        return 'info' as const;
      case 'called_back':
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  const handleMarkRead = (msgId: string) => {
    store.updateMessageStatus(msgId, 'read');
    setMessages(store.getMessages());
    if (selectedMsg?.id === msgId) {
      setSelectedMsg({ ...selectedMsg, status: 'read' });
    }
  };

  const handleMarkCalledBack = (msgId: string) => {
    store.updateMessageStatus(msgId, 'called_back');
    setMessages(store.getMessages());
    if (selectedMsg?.id === msgId) {
      setSelectedMsg({ ...selectedMsg, status: 'called_back' });
    }
  };

  const handleArchive = (msgId: string) => {
    store.updateMessageStatus(msgId, 'archived');
    setMessages(store.getMessages());
    setSelectedMsg(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Staff Messages</h2>
          <p>Caller inquiries and callback requests recorded by CallFlow AI</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
              placeholder="Search by caller, staff recipient, or message..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              className="form-input form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="all">All Messages</option>
              <option value="new">New ({messages.filter(m => m.status === 'new').length})</option>
              <option value="read">Read</option>
              <option value="called_back">Called Back</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredMessages.map(msg => {
          const isNew = msg.status === 'new';
          return (
            <div
              key={msg.id}
              className="card card-hover"
              style={{
                padding: '14px 18px',
                cursor: 'pointer',
                opacity: msg.status === 'archived' ? 0.65 : 1,
                borderLeft: isNew ? '3px solid var(--status-danger-dot)' : undefined,
              }}
              onClick={() => {
                setSelectedMsg(msg);
                if (isNew) handleMarkRead(msg.id);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Mail Icon Circle */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-full)',
                    background: isNew ? 'var(--status-danger-bg)' : 'var(--bg-app)',
                    border: `1px solid ${isNew ? 'var(--status-danger-border)' : 'var(--border-color)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isNew ? (
                    <Mail size={16} style={{ color: 'var(--status-danger-text)' }} />
                  ) : (
                    <MailOpen size={16} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {msg.callerName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      for <strong style={{ color: 'var(--text-secondary)' }}>{msg.recipient}</strong>
                    </span>
                    {msg.priority === 'urgent' && (
                      <Badge variant="warning" size="sm">
                        <AlertCircle size={10} style={{ marginRight: 3 }} />
                        Urgent
                      </Badge>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                      <Badge variant={getStatusBadgeVariant(msg.status)} withDot size="sm">
                        {msg.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: isNew ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isNew ? 500 : 400,
                      margin: '0 0 6px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    "{msg.body}"
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <PhoneIcon size={11} /> {msg.callerPhone}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {msg.status !== 'called_back' && msg.status !== 'archived' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkCalledBack(msg.id)}
                      title="Mark as called back"
                    >
                      <PhoneIcon size={12} />
                      <span className="hidden-mobile">Callback Done</span>
                    </button>
                  )}
                  {msg.status !== 'archived' && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleArchive(msg.id)}
                      title="Archive message"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                  <ChevronRight size={15} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No messages found"
            description={
              searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search query or reset filter settings.'
                : 'Messages taken by CallFlow AI during calls will appear in your inbox.'
            }
          />
        )}
      </div>

      {/* Message Detail Drawer */}
      <Drawer
        isOpen={!!selectedMsg}
        onClose={() => setSelectedMsg(null)}
        title={selectedMsg ? `Message from ${selectedMsg.callerName}` : 'Message Details'}
      >
        {selectedMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Caller & Status Bar */}
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
                  Status
                </div>
                <div>
                  <Badge variant={getStatusBadgeVariant(selectedMsg.status)} withDot size="sm">
                    {selectedMsg.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Priority
                </div>
                <div>
                  <Badge variant={selectedMsg.priority === 'urgent' ? 'warning' : 'default'} size="sm">
                    {selectedMsg.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Intended Recipient
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedMsg.recipient}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Received
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {formatDistanceToNow(new Date(selectedMsg.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Caller Contact Info */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                Caller Contact
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {selectedMsg.callerName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {selectedMsg.callerPhone}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyToClipboard(selectedMsg.callerPhone)}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Phone'}</span>
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                Transcript Message
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  padding: 16,
                  background: 'var(--bg-app)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontStyle: 'italic',
                }}
              >
                "{selectedMsg.body}"
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
              {selectedMsg.status !== 'called_back' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleMarkCalledBack(selectedMsg.id)}
                >
                  <PhoneIcon size={13} />
                  <span>Mark Called Back</span>
                </button>
              )}
              {selectedMsg.status !== 'archived' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleArchive(selectedMsg.id)}
                >
                  <Archive size={13} />
                  <span>Archive</span>
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedMsg(null)}
                style={{ marginLeft: 'auto' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

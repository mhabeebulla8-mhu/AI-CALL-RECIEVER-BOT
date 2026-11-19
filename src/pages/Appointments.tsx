// ============================================
// Appointments Page — SaaS List & Calendar View
// ============================================

import { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Clock,
  User,
  Phone as PhoneIcon,
  X,
  Check,
  Ban,
  List,
  CalendarDays,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { store } from '../data';
import { format } from 'date-fns';
import type { Appointment } from '../types';
import { Badge } from '../components/Badge';
import { Drawer } from '../components/Drawer';
import { EmptyState } from '../components/EmptyState';

export default function Appointments() {
  const [appointments, setAppointments] = useState(store.getAppointments());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  // New appointment form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formService, setFormService] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  const biz = store.getBusiness();

  const filteredApts = appointments.filter(apt => {
    const matchesSearch =
      apt.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.callerPhone.includes(searchQuery) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success' as const;
      case 'pending':
        return 'warning' as const;
      case 'cancelled':
        return 'danger' as const;
      case 'completed':
        return 'info' as const;
      default:
        return 'default' as const;
    }
  };

  const handleCancel = (aptId: string) => {
    store.cancelAppointment(aptId);
    setAppointments(store.getAppointments());
    if (selectedApt && selectedApt.id === aptId) {
      setSelectedApt({ ...selectedApt, status: 'cancelled' });
    }
  };

  const handleNewAppointment = () => {
    if (!formName || !formService || !formDate || !formTime) return;
    const svc = biz.services.find(s => s.name === formService);
    store.addAppointment({
      businessId: biz.id,
      callerName: formName,
      callerPhone: formPhone,
      service: formService,
      date: formDate,
      time: formTime,
      duration: svc?.duration || 45,
      status: 'confirmed',
      notes: 'Manually added by team',
      createdBy: 'manual',
    });
    setAppointments(store.getAppointments());
    setShowModal(false);
    setFormName('');
    setFormPhone('');
    setFormService('');
    setFormDate('');
    setFormTime('');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Appointments</h2>
          <p>Real-time booking management scheduled by CallFlow AI and staff</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          id="btn-new-appointment"
        >
          <Plus size={15} />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filter and View Switcher Bar */}
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
              placeholder="Search by client, phone, or service..."
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
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Segmented Control for List vs Calendar */}
          <div className="segmented-control" role="tablist">
            <button
              className={`segmented-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              role="tab"
              aria-selected={view === 'list'}
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              className={`segmented-btn ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
              role="tab"
              aria-selected={view === 'calendar'}
            >
              <CalendarDays size={14} />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Booked By</th>
                  <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApts.map(apt => (
                  <tr
                    key={apt.id}
                    onClick={() => setSelectedApt(apt)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {apt.callerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                            {apt.callerName}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {apt.callerPhone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{apt.service}</td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {format(new Date(apt.date), 'MMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        <span>{apt.time}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {apt.duration} min
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(apt.status)} withDot size="sm">
                        {apt.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={apt.createdBy === 'bot' ? 'purple' : 'default'} size="sm">
                        {apt.createdBy === 'bot' ? 'AI Bot' : 'Manual'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--status-danger-text)', padding: '4px 8px' }}
                            onClick={() => handleCancel(apt.id)}
                            title="Cancel appointment"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => setSelectedApt(apt)}
                          title="View details"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApts.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description={
                searchQuery || filterStatus !== 'all'
                  ? 'No bookings match your current filter settings.'
                  : 'Appointments booked by customers or added manually will appear here.'
              }
              action={
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                  <Plus size={14} />
                  <span>Book Appointment</span>
                </button>
              }
            />
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={18} style={{ color: 'var(--accent)' }} />
              <span>{format(new Date(), 'MMMM yyyy')}</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {appointments.filter(a => a.status === 'confirmed').length} active bookings this month
            </span>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-header-cell">{day}</div>
            ))}
            {generateCalendarDays().map((day, i) => {
              const dateStr = day ? format(day.date, 'yyyy-MM-dd') : '';
              const dayApts = day ? appointments.filter(a => a.date === dateStr && a.status !== 'cancelled') : [];
              const isToday = day ? format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;

              return (
                <div
                  key={i}
                  className={`calendar-cell ${isToday ? 'today' : ''} ${!day?.currentMonth ? 'other-month' : ''}`}
                >
                  {day && (
                    <>
                      <div className="calendar-date">{day.date.getDate()}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                        {dayApts.slice(0, 3).map(apt => (
                          <div
                            key={apt.id}
                            className={`calendar-event ${apt.status === 'confirmed' ? 'confirmed' : 'pending'}`}
                            onClick={() => setSelectedApt(apt)}
                            title={`${apt.time} - ${apt.callerName} (${apt.service})`}
                          >
                            <span style={{ fontWeight: 600 }}>{apt.time}</span> {apt.callerName.split(' ')[0]}
                          </div>
                        ))}
                        {dayApts.length > 3 && (
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', paddingLeft: 4 }}>
                            +{dayApts.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Detail Drawer */}
      <Drawer
        isOpen={!!selectedApt}
        onClose={() => setSelectedApt(null)}
        title={selectedApt ? `Appointment: ${selectedApt.callerName}` : 'Appointment Details'}
      >
        {selectedApt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status overview */}
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
                  <Badge variant={getStatusBadgeVariant(selectedApt.status)} withDot size="sm">
                    {selectedApt.status}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Origin
                </div>
                <div>
                  <Badge variant={selectedApt.createdBy === 'bot' ? 'purple' : 'default'} size="sm">
                    {selectedApt.createdBy === 'bot' ? 'AI Voice Agent' : 'Manual'}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Scheduled Date
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {format(new Date(selectedApt.date), 'EEEE, MMM d, yyyy')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  Time & Duration
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedApt.time} ({selectedApt.duration} mins)
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 12 }}>
                Client Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <User size={15} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedApt.callerName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <PhoneIcon size={15} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedApt.callerPhone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedApt.service}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedApt.notes && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Booking Notes
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                    padding: 12,
                    background: 'var(--card-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {selectedApt.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
              {selectedApt.status !== 'cancelled' && selectedApt.status !== 'completed' && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--status-danger-text)' }}
                  onClick={() => handleCancel(selectedApt.id)}
                >
                  <Ban size={14} />
                  <span>Cancel Appointment</span>
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedApt(null)} style={{ marginLeft: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Clean Modal for Creating Appointment */}
      {showModal && (
        <div className="drawer-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="card"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 480,
              zIndex: 60,
              boxShadow: 'var(--shadow-lg)',
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Schedule New Appointment</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Client Name *</label>
                <input
                  className="form-input"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="form-label">Service *</label>
                <select
                  className="form-input form-select"
                  value={formService}
                  onChange={e => setFormService(e.target.value)}
                >
                  <option value="">Select a service...</option>
                  {biz.services.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} — ₹{s.price} ({s.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Time *</label>
                  <input
                    className="form-input"
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNewAppointment}
                disabled={!formName || !formService || !formDate || !formTime}
                id="btn-save-appointment"
              >
                <Check size={14} />
                <span>Confirm Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Generate calendar days for current month view
function generateCalendarDays(): Array<{ date: Date; currentMonth: boolean } | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Array<{ date: Date; currentMonth: boolean } | null> = [];

  // Fill leading days
  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -(firstDay.getDay() - i - 1));
    days.push({ date: d, currentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }

  // Fill trailing days
  while (days.length < 42) {
    const d = days.length - (firstDay.getDay() + lastDay.getDate());
    days.push({ date: new Date(year, month + 1, d + 1), currentMonth: false });
  }

  return days;
}

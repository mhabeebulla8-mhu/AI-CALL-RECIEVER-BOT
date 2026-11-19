// ============================================
// Production API Client Layer
// Bridges the UI to real backend endpoints with fallback
// ============================================

import { store } from './data';
import type { Call, Appointment, Message, Business, DashboardStats } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = {
  // Calls
  async getCalls(): Promise<Call[]> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/calls`);
      if (res.ok) return res.json();
    }
    return store.getCalls();
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/appointments`);
      if (res.ok) return res.json();
    }
    return store.getAppointments();
  },

  async createAppointment(apt: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apt),
      });
      if (res.ok) return res.json();
    }
    return store.addAppointment(apt);
  },

  async cancelAppointment(id: string): Promise<void> {
    if (API_BASE) {
      await fetch(`${API_BASE}/api/appointments/${id}/cancel`, { method: 'POST' });
      return;
    }
    store.cancelAppointment(id);
  },

  // Messages
  async getMessages(): Promise<Message[]> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/messages`);
      if (res.ok) return res.json();
    }
    return store.getMessages();
  },

  async updateMessageStatus(id: string, status: Message['status']): Promise<void> {
    if (API_BASE) {
      await fetch(`${API_BASE}/api/messages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return;
    }
    store.updateMessageStatus(id, status);
  },

  // Business Info & Settings
  async getBusiness(): Promise<Business> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/business`);
      if (res.ok) return res.json();
    }
    return store.getBusiness();
  },

  async updateBusiness(updates: Partial<Business>): Promise<Business> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/business`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) return res.json();
    }
    return store.updateBusiness(updates);
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) return res.json();
    }
    return store.getStats();
  },
};


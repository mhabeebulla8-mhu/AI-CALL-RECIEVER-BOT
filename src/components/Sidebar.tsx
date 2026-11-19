import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Headphones,
  Phone,
  Calendar,
  MessageSquare,
  Settings,
  Bot,
  X,
} from 'lucide-react';
import { store } from '../data';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const stats = store.getStats();

  const navSections = [
    {
      group: 'Overview',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/simulator', label: 'Call Simulator', icon: Headphones },
      ],
    },
    {
      group: 'Records',
      items: [
        { path: '/calls', label: 'Call Logs', icon: Phone },
        { path: '/appointments', label: 'Appointments', icon: Calendar, badge: stats.pendingAppointments },
        { path: '/messages', label: 'Messages', icon: MessageSquare, badge: stats.newMessages },
      ],
    },
    {
      group: 'Manage',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} id="main-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon-wrap">
          <Bot size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="brand-title">CallFlow AI</span>
        </div>
        {onClose && (
          <button
            className="btn btn-ghost btn-icon btn-sm mobile-nav-toggle"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="sidebar-nav">
        {navSections.map(sec => (
          <div key={sec.group} className="nav-group">
            <div className="nav-group-label">{sec.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onClose?.()}
                    id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="nav-item-content">
                      <Icon size={18} strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="nav-badge-pill">{item.badge}</span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar" aria-hidden="true">
            HM
          </div>
          <div className="user-info">
            <span className="user-name">Habeeb M.</span>
            <span className="user-role">Business Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

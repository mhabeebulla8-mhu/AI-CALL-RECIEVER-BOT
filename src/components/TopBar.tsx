import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { store } from '../data';

interface TopBarProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onMobileMenuToggle,
}) => {
  const { theme, toggleTheme } = useTheme();
  const biz = store.getBusiness();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {onMobileMenuToggle && (
          <button
            className="btn btn-ghost btn-icon btn-sm mobile-nav-toggle"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <h2 className="topbar-title">{title || 'CallFlow AI'}</h2>
      </div>

      <div className="topbar-right">
        {/* Live Phone Number Status Pill */}
        <div className="status-pill" title="Live Telephony Inbound Routing Active">
          <span className="status-dot-pulse" aria-hidden="true" />
          <span>Live · {biz.phone || '+91 80 4567 8900'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
};


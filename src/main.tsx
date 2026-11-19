// ============================================
// App Entry Point — React + Router + Theme
// ============================================

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import Dashboard from './pages/Dashboard';
import CallSimulator from './pages/CallSimulator';
import CallLogs from './pages/CallLogs';
import Appointments from './pages/Appointments';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/simulator': 'Call Simulator',
  '/calls': 'Call Logs',
  '/appointments': 'Appointments',
  '/messages': 'Messages',
  '/analytics': 'Analytics & Reports',
  '/settings': 'Settings',
};

const AppShell = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || 'CallFlow AI';

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main app viewport */}
      <div className="app-main">
        <TopBar
          title={currentTitle}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="page-container" id="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/simulator" element={<CallSimulator />} />
            <Route path="/calls" element={<CallLogs />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

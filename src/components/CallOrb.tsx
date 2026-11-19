import React from 'react';
import { Mic, Loader2, Volume2, Phone } from 'lucide-react';

export type CallOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface CallOrbProps {
  state: CallOrbState;
  statusText?: string;
}

export const CallOrb: React.FC<CallOrbProps> = ({ state, statusText }) => {
  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic size={32} />;
      case 'thinking':
        return <Loader2 size={32} style={{ animation: 'orbRotate 2s linear infinite' }} />;
      case 'speaking':
        return <Volume2 size={32} />;
      case 'idle':
      default:
        return <Phone size={32} />;
    }
  };

  const getDefaultText = () => {
    switch (state) {
      case 'listening':
        return 'Listening to you…';
      case 'thinking':
        return 'Thinking…';
      case 'speaking':
        return 'AI speaking…';
      case 'idle':
      default:
        return 'Ready to connect';
    }
  };

  return (
    <div className="call-orb-container">
      <div className={`call-orb ${state}`} aria-label={`Call assistant state: ${state}`}>
        {getIcon()}
      </div>
      <div className="orb-status-text">
        {statusText || getDefaultText()}
      </div>
    </div>
  );
};


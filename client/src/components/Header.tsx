import React from 'react';
import { Search, Zap, Compass } from 'lucide-react';

interface HeaderProps {
  onOpenLookup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLookup }) => {
  return (
    <header className="navbar">
      <div className="logo-container">
        <div style={{
          background: 'linear-gradient(135deg, #0052cc, #00a3e0)',
          padding: '0.65rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 82, 204, 0.25)'
        }}>
          <Zap size={24} color="#ffffff" fill="#ffffff" />
        </div>
        <div>
          <div className="logo-brand-text">
            <span className="brand-cruise">Cruise</span>
            <span className="brand-fast">Fast</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Instant Voyage Booking
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onOpenLookup}>
          <Search size={16} color="var(--accent-blue)" />
          <span>Lookup Booking</span>
        </button>
      </div>
    </header>
  );
};

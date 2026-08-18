import React from 'react';
import { Compass, Search, Ship } from 'lucide-react';

interface HeaderProps {
  onOpenLookup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLookup }) => {
  return (
    <header className="navbar">
      <div className="logo-container">
        <Ship className="w-8 h-8 text-cyan-400" />
        <span>Odysseus Cruise Booking</span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onOpenLookup}>
          <Search size={18} />
          <span>Lookup Booking</span>
        </button>
      </div>
    </header>
  );
};

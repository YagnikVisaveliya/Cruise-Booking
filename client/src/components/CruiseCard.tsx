import React from 'react';
import { Cruise } from '../types';
import { Anchor, Calendar, ArrowRight } from 'lucide-react';

interface CruiseCardProps {
  cruise: Cruise;
  onSelect: (cruise: Cruise) => void;
}

export const CruiseCard: React.FC<CruiseCardProps> = ({ cruise, onSelect }) => {
  const adultFare = typeof cruise.adult_fare === 'number' ? cruise.adult_fare : 0;
  const capacityLeft = typeof cruise.capacity_left === 'number' ? cruise.capacity_left : 0;

  const getCapacityBadge = () => {
    if (capacityLeft === 0) {
      return <span className="badge badge-capacity-zero">Sold Out (0 Left)</span>;
    }
    if (capacityLeft <= 5) {
      return <span className="badge badge-capacity-low">Almost Full ({capacityLeft} Left)</span>;
    }
    return <span className="badge badge-capacity-good">{capacityLeft} Available</span>;
  };

  return (
    <div className="glass-panel cruise-card">
      <img
        src={cruise.image_url || 'https://images.unsplash.com/photo-1548574505-5e2386903f87?auto=format&fit=crop&w=800&q=80'}
        alt={cruise.ship_name || 'Cruise Ship'}
        className="cruise-image"
      />
      <div className="cruise-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
            {cruise.cruise_line}
          </span>
          {getCapacityBadge()}
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          {cruise.ship_name}
        </h3>

        <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Anchor size={16} className="text-cyan-400" />
            {cruise.destination}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} className="text-blue-400" />
            {cruise.nights} Nights
          </span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Starting Adult Fare</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              ${adultFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            className="btn btn-primary"
            disabled={capacityLeft === 0}
            onClick={() => onSelect(cruise)}
          >
            <span>Book Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

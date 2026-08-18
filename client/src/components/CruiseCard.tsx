import React from 'react';
import { Cruise } from '../types';
import { Anchor, Calendar, ArrowRight, Star } from 'lucide-react';

interface CruiseCardProps {
  cruise: Cruise;
  onSelect: (cruise: Cruise) => void;
}

export const CruiseCard: React.FC<CruiseCardProps> = ({ cruise, onSelect }) => {
  const adultFare = typeof cruise.adult_fare === 'number' ? cruise.adult_fare : 0;
  const capacityLeft = typeof cruise.capacity_left === 'number' ? cruise.capacity_left : 0;

  const getCapacityBadge = () => {
    if (capacityLeft === 0) {
      return <span className="badge badge-capacity-zero">Sold Out</span>;
    }
    if (capacityLeft <= 5) {
      return <span className="badge badge-capacity-low">Only {capacityLeft} Cabins Left</span>;
    }
    return <span className="badge badge-capacity-good">{capacityLeft} Cabins Left</span>;
  };

  return (
    <div className="glass-panel cruise-card">
      <div className="cruise-image-container">
        <img
          src={cruise.image_url || 'https://images.unsplash.com/photo-1548574505-5e2386903f87?auto=format&fit=crop&w=800&q=80'}
          alt={cruise.ship_name || 'Cruise Ship'}
          className="cruise-image"
        />
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          left: '0.85rem',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          fontSize: '0.78rem',
          fontWeight: 800,
          color: 'var(--accent-blue)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {cruise.cruise_line}
        </div>
      </div>

      <div className="cruise-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706', fontSize: '0.8rem', fontWeight: 700 }}>
            <Star size={14} fill="#d97706" />
            <span>Fast-Track Booking</span>
          </div>
          {getCapacityBadge()}
        </div>

        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--accent-navy)', letterSpacing: '-0.3px' }}>
          {cruise.ship_name}
        </h3>

        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 500 }}>
            <Anchor size={15} color="var(--accent-blue)" />
            {cruise.destination}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 500 }}>
            <Calendar size={15} color="var(--accent-blue)" />
            {cruise.nights} Nights
          </span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Starting Adult Fare
            </span>
            <span style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>
              ${adultFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}> / adult</span>
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

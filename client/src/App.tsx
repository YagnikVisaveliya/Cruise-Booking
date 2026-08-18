import React, { useState, useEffect } from 'react';
import { Cruise } from './types';
import { fetchCruises } from './services/api';
import { Header } from './components/Header';
import { CruiseCard } from './components/CruiseCard';
import { BookingWizardModal } from './components/BookingWizardModal';
import { BookingLookupModal } from './components/BookingLookupModal';
import { Tag, Sparkles, Filter, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCruise, setSelectedCruise] = useState<Cruise | null>(null);
  const [showLookupModal, setShowLookupModal] = useState<boolean>(false);
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');

  const loadCruises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCruises();
      setCruises(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cruises from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCruises();
  }, []);

  const destinations = ['ALL', ...Array.from(new Set(cruises.map(c => c.destination)))];

  const filteredCruises = destinationFilter === 'ALL'
    ? cruises
    : cruises.filter(c => c.destination === destinationFilter);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onOpenLookup={() => setShowLookupModal(true)} />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero-banner">
          <span className="badge badge-promo" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 10px rgba(0, 82, 204, 0.1)' }}>
            <Zap size={14} color="var(--accent-blue)" fill="var(--accent-blue)" /> Instant Cruise Booking Platform
          </span>
          <h1 className="hero-title">Discover Luxury Voyages & Fast Instant Quotes</h1>
          <p className="hero-subtitle">
            Dynamic pricing engine with child age discounts, group tier rates, live cabin capacity locking, and instant booking confirmation.
          </p>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', fontSize: '0.88rem', fontWeight: 600 }}>
              <Zap size={16} color="var(--accent-blue)" />
              <span>Real-Time Pricing Quotes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', fontSize: '0.88rem', fontWeight: 600 }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <span>Live Capacity Locking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', fontSize: '0.88rem', fontWeight: 600 }}>
              <Layers size={16} color="var(--accent-gold)" />
              <span>Promotional Discounts</span>
            </div>
          </div>

          {/* Seed Promos Banner */}
          <div className="seed-promos-banner">
            <Tag size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-navy)' }}>Active Promotional Codes:</span>
            <span className="promo-chip" title="10% off min spend $1,000">SUMMER10 (-10%)</span>
            <span className="promo-chip" title="$150 off min spend $2,000">FIRST150 (-$150)</span>
            <span className="promo-chip" title="25% off max 3 uses">CREW25 (-25%)</span>
            <span className="promo-chip" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Expired code">WINTER5 (Expired)</span>
          </div>
        </section>

        {/* Filter Controls Bar */}
        <div style={{ maxWidth: '1400px', margin: '0 auto 1.5rem', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Filter size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-navy)' }}>Filter Destination:</span>
            {destinations.map((dest, idx) => (
              <button
                key={idx}
                className={`btn ${destinationFilter === dest ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setDestinationFilter(dest)}
              >
                {dest}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }} onClick={loadCruises}>
            <RefreshCw size={14} color="var(--accent-blue)" /> Refresh Catalog
          </button>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading CruiseFast Voyage Catalog...</p>
          </div>
        ) : error ? (
          <div style={{ maxWidth: '600px', margin: '3rem auto', background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Server Connection Note</p>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={loadCruises}>
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="cruise-grid">
            {filteredCruises.map(cruise => (
              <CruiseCard
                key={cruise.id}
                cruise={cruise}
                onSelect={c => setSelectedCruise(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Booking Wizard Modal */}
      {selectedCruise && (
        <BookingWizardModal
          cruise={selectedCruise}
          onClose={() => {
            setSelectedCruise(null);
            loadCruises(); // Refresh capacity
          }}
        />
      )}

      {/* Booking Lookup Modal */}
      {showLookupModal && (
        <BookingLookupModal
          onClose={() => setShowLookupModal(false)}
        />
      )}

      <footer style={{ borderTop: '1px solid var(--border-light)', background: '#ffffff', padding: '2.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--accent-navy)', fontSize: '1.1rem' }}>
            <span>Cruise</span>
            <span style={{ color: 'var(--accent-blue)' }}>Fast</span>
          </div>
          <p>© {new Date().getFullYear()} CruiseFast Booking System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

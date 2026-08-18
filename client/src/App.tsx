import React, { useState, useEffect } from 'react';
import { Cruise } from './types';
import { fetchCruises } from './services/api';
import { Header } from './components/Header';
import { CruiseCard } from './components/CruiseCard';
import { BookingWizardModal } from './components/BookingWizardModal';
import { BookingLookupModal } from './components/BookingLookupModal';
import { Ship, Tag, Sparkles, Filter, RefreshCw } from 'lucide-react';

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
          <span className="badge badge-promo" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} /> Official Odysseus Technical Assessment System
          </span>
          <h1 className="hero-title">Experience Ocean Luxury & Dynamic Booking</h1>
          <p className="hero-subtitle">
            Instant dynamic pricing, age-band child discounts, group tier rates, live capacity locks, and 100% historical price reconstruction.
          </p>

          {/* Seed Promos Banner */}
          <div className="seed-promos-banner">
            <Tag size={18} className="text-cyan-400" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Active Promo Codes:</span>
            <span className="promo-chip" title="10% off min spend $1,000">SUMMER10 (-10%)</span>
            <span className="promo-chip" title="$150 off min spend $2,000">FIRST150 (-$150)</span>
            <span className="promo-chip" title="25% off max 3 uses">CREW25 (-25%)</span>
            <span className="promo-chip" style={{ opacity: 0.6 }} title="Expired code">WINTER5 (Expired)</span>
          </div>
        </section>

        {/* Filter Controls */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} className="text-cyan-400" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Filter Destination:</span>
            {destinations.map((dest, idx) => (
              <button
                key={idx}
                className={`btn ${destinationFilter === dest ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                onClick={() => setDestinationFilter(dest)}
              >
                {dest}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={loadCruises}>
            <RefreshCw size={14} /> Refresh Catalog
          </button>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading cruises...</p>
          </div>
        ) : error ? (
          <div style={{ maxWidth: '600px', margin: '3rem auto', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: '#fb7185', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
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

      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4rem' }}>
        <p>Odysseus Solutions Technical Assessment • Cruise Booking System • Built with React, Node.js/Express & PostgreSQL</p>
      </footer>
    </div>
  );
};

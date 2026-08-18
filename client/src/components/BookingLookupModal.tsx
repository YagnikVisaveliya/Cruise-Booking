import React, { useState } from 'react';
import { HistoricBookingResponse } from '../types';
import { lookupBooking } from '../services/api';
import { X, Search, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface BookingLookupModalProps {
  onClose: () => void;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({ onClose }) => {
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [booking, setBooking] = useState<HistoricBookingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;

    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const res = await lookupBooking(referenceInput.trim());
      setBooking(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          🔍 Lookup Booking Snapshot
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Reconstruct exact historic pricing breakdown verbatim from stored booking reference (Req 8).
        </p>

        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Enter Reference e.g. CRZ-XXXXXX"
            value={referenceInput}
            onChange={e => setReferenceInput(e.target.value.toUpperCase())}
            className="form-input"
            style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Search size={18} />
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: '#fb7185', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {booking && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-capacity-good" style={{ marginBottom: '0.25rem' }}>Status: {booking.status}</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Ref: {booking.booking_reference}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Date Booked</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date(booking.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div>
                <p><strong>Customer Name:</strong> {booking.customer.first_name} {booking.customer.last_name}</p>
                <p><strong>Customer Email:</strong> {booking.customer.email}</p>
              </div>
              <div>
                <p><strong>Cruise Line:</strong> {booking.cruise.cruise_line}</p>
                <p><strong>Ship & Destination:</strong> {booking.cruise.ship_name} ({booking.cruise.destination}, {booking.cruise.nights} nights)</p>
              </div>
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Reconstructed Line Items</h4>
            <table className="price-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Item / Passenger</th>
                  <th>Age / Unit</th>
                  <th style={{ textAlign: 'right' }}>Base Fare</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }}>Charged</th>
                </tr>
              </thead>
              <tbody>
                {booking.passenger_snapshots.map((p, i) => (
                  <tr key={i}>
                    <td>Passenger #{i + 1} ({p.passenger_type})</td>
                    <td>Age {p.age}</td>
                    <td style={{ textAlign: 'right' }}>${p.base_fare_snapshot.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#34d399' }}>{p.child_discount_percentage}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${p.charged_fare.toFixed(2)}</td>
                  </tr>
                ))}

                {booking.service_snapshots.map((s, i) => (
                  <tr key={i}>
                    <td colSpan={2}>Add-on: {s.service_name}</td>
                    <td style={{ textAlign: 'right' }}>${s.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{s.quantity} qty</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>+${s.total_charged.toFixed(2)}</td>
                  </tr>
                ))}

                {booking.breakdown.group_discount_amount > 0 && (
                  <tr style={{ color: '#34d399' }}>
                    <td colSpan={4}>Group Discount ({booking.breakdown.group_discount_percentage}%)</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>-${booking.breakdown.group_discount_amount.toFixed(2)}</td>
                  </tr>
                )}

                {booking.breakdown.promo_code && (
                  <tr style={{ color: '#34d399' }}>
                    <td colSpan={4}>Promo Code ({booking.breakdown.promo_code})</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>-${booking.breakdown.promo_discount_amount.toFixed(2)}</td>
                  </tr>
                )}

                <tr>
                  <td colSpan={4}>Applied Tax ({booking.breakdown.tax_rate_percentage}%)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>+${booking.breakdown.tax_amount.toFixed(2)}</td>
                </tr>

                <tr className="price-total-row">
                  <td colSpan={4}>Historical Total Charged</td>
                  <td style={{ textAlign: 'right' }}>${booking.breakdown.total_amount_charged.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

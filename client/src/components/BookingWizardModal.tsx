import React, { useState, useEffect } from 'react';
import { Cruise, PassengerInput, PriceCalculationResponse, HistoricBookingResponse } from '../types';
import { calculatePricing, createBooking } from '../services/api';
import { X, Users, ShieldCheck, Tag, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, UserCheck, Plus, Trash2, Home } from 'lucide-react';

interface BookingWizardModalProps {
  cruise: Cruise;
  onClose: () => void;
}

export interface DetailedPassenger {
  id: string;
  type: 'adult' | 'child';
  age: number;
  first_name: string;
  last_name: string;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({ cruise, onClose }) => {
  const [step, setStep] = useState<number>(1);
  
  // Passenger list state capturing full details for EVERY person occupying 1 Cabin
  const [passengersList, setPassengersList] = useState<DetailedPassenger[]>([
    { id: 'pax_1', type: 'adult', age: 30, first_name: '', last_name: '' }
  ]);

  const [passengerValidationError, setPassengerValidationError] = useState<string | null>(null);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [pricing, setPricing] = useState<PriceCalculationResponse | null>(null);
  const [loadingPricing, setLoadingPricing] = useState<boolean>(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const [bookingConfirmed, setBookingConfirmed] = useState<HistoricBookingResponse | null>(null);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const capacityLeft = typeof cruise.capacity_left === 'number' ? cruise.capacity_left : 0;
  const totalPassengers = passengersList.length;
  const isSoldOut = capacityLeft < 1;

  // Sync Adult #1 name to contact info if contact info is empty
  useEffect(() => {
    const adult1 = passengersList.find(p => p.type === 'adult');
    if (adult1) {
      if (adult1.first_name && !customerInfo.first_name) {
        setCustomerInfo(prev => ({ ...prev, first_name: adult1.first_name }));
      }
      if (adult1.last_name && !customerInfo.last_name) {
        setCustomerInfo(prev => ({ ...prev, last_name: adult1.last_name }));
      }
    }
  }, [passengersList]);

  // Recalculate price when passengers, services, or promo code changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (totalPassengers === 0 || isSoldOut) return;
      const apiPassengers: PassengerInput[] = passengersList.map(p => ({
        type: p.type,
        age: p.age,
        first_name: p.first_name,
        last_name: p.last_name
      }));

      setLoadingPricing(true);
      setPricingError(null);
      try {
        const res = await calculatePricing({
          cruise_id: cruise.id,
          passengers: apiPassengers,
          selected_services: selectedServices,
          promo_code: promoCodeInput.trim() || undefined,
          customer_email: customerInfo.email.trim() || undefined
        });
        setPricing(res);
      } catch (err: any) {
        setPricingError(err.message);
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPrice();
  }, [cruise.id, passengersList, selectedServices, promoCodeInput, customerInfo.email, isSoldOut, totalPassengers]);

  const handleAddAdult = () => {
    if (totalPassengers >= 6) return;
    setPassengerValidationError(null);
    setPassengersList([
      ...passengersList,
      { id: `pax_${Date.now()}_${Math.random()}`, type: 'adult', age: 30, first_name: '', last_name: '' }
    ]);
  };

  const handleAddChild = () => {
    if (totalPassengers >= 6) return;
    setPassengerValidationError(null);
    setPassengersList([
      ...passengersList,
      { id: `pax_${Date.now()}_${Math.random()}`, type: 'child', age: 8, first_name: '', last_name: '' }
    ]);
  };

  const handleRemovePassenger = (id: string) => {
    // Keep at least 1 adult
    const remaining = passengersList.filter(p => p.id !== id);
    const adultRemaining = remaining.some(p => p.type === 'adult');
    if (!adultRemaining) return;
    setPassengerValidationError(null);
    setPassengersList(remaining);
  };

  const handlePassengerChange = (id: string, field: keyof DetailedPassenger, value: any) => {
    setPassengerValidationError(null);
    setPassengersList(passengersList.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleNextFromStep1 = () => {
    setPassengerValidationError(null);
    for (let i = 0; i < passengersList.length; i++) {
      const pax = passengersList[i];
      if (!pax.first_name.trim() || !pax.last_name.trim()) {
        setPassengerValidationError(`Please enter First Name and Last Name for Passenger #${i + 1} (${pax.type.toUpperCase()}) before proceeding.`);
        return;
      }
    }
    setStep(2);
  };

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const handleConfirmBooking = async () => {
    if (!customerInfo.first_name || !customerInfo.last_name || !customerInfo.email) {
      setBookingError('Please enter lead customer first name, last name, and email.');
      return;
    }

    const apiPassengers: PassengerInput[] = passengersList.map(p => ({
      type: p.type,
      age: p.age,
      first_name: p.first_name,
      last_name: p.last_name
    }));

    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await createBooking({
        cruise_id: cruise.id,
        customer: customerInfo,
        passengers: apiPassengers,
        selected_services: selectedServices,
        promo_code: promoCodeInput.trim() || undefined
      });
      setBookingConfirmed(res);
      setStep(4);
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const adultPassengers = passengersList.filter(p => p.type === 'adult');
  const childPassengers = passengersList.filter(p => p.type === 'child');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        {/* Wizard Steps Navigation Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="badge badge-promo" style={{ marginBottom: '0.5rem' }}>
            {cruise.cruise_line} • {cruise.ship_name}
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {step === 4 ? '🎉 Booking Confirmed!' : `Step ${step} of 3: ${step === 1 ? 'Cabin & Passenger Details' : step === 2 ? 'Optional Add-ons' : 'Review & Contact Info'}`}
          </h2>
        </div>

        {/* STEP 1: CABIN OCCUPANCY & PASSENGER DETAILS */}
        {step === 1 && (
          <div>
            {/* Sold Out Warning Alert */}
            {isSoldOut && (
              <div style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c', padding: '0.9rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                <AlertCircle size={20} />
                <span>No cabins are currently available on this cruise voyage.</span>
              </div>
            )}

            {/* Cabin Occupancy Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Home size={18} color="var(--accent-blue)" /> Cabin Reservation: 1 Cabin ({totalPassengers} / 6 Passengers)
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '0.2rem' }}>
                  (1 booking occupies 1 cabin • {capacityLeft} cabin{capacityLeft !== 1 ? 's' : ''} available on ship)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={totalPassengers >= 6 || isSoldOut}
                  onClick={handleAddAdult}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> Add Adult
                </button>

                <button
                  className="btn btn-secondary"
                  disabled={totalPassengers >= 6 || isSoldOut}
                  onClick={handleAddChild}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={15} /> Add Child
                </button>
              </div>
            </div>

            {/* Adult Passengers Details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-navy)' }}>
                Adult Passengers (Age 18+)
              </h4>
              {adultPassengers.map((pax, idx) => (
                <div key={pax.id} className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserCheck size={18} /> Adult #{idx + 1} {idx === 0 && '(Lead Passenger)'}
                    </span>
                    {adultPassengers.length > 1 && (
                      <button
                        onClick={() => handleRemovePassenger(pax.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.85rem' }}>
                    <div>
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="First Name"
                        value={pax.first_name}
                        onChange={e => handlePassengerChange(pax.id, 'first_name', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Last Name"
                        value={pax.last_name}
                        onChange={e => handlePassengerChange(pax.id, 'last_name', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Age *</label>
                      <input
                        type="number"
                        min={18}
                        max={120}
                        value={pax.age}
                        onChange={e => handlePassengerChange(pax.id, 'age', parseInt(e.target.value) || 18)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Child Passengers Details */}
            {childPassengers.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-navy)' }}>
                  Child Passengers (Age 0 to 17)
                </h4>
                {childPassengers.map((pax, idx) => (
                  <div key={pax.id} className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={18} /> Child #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleRemovePassenger(pax.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '0.85rem' }}>
                      <div>
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="First Name"
                          value={pax.first_name}
                          onChange={e => handlePassengerChange(pax.id, 'first_name', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Last Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Last Name"
                          value={pax.last_name}
                          onChange={e => handlePassengerChange(pax.id, 'last_name', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label">Age (0-17)</label>
                        <input
                          type="number"
                          min={0}
                          max={17}
                          value={pax.age}
                          onChange={e => handlePassengerChange(pax.id, 'age', parseInt(e.target.value) || 0)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: pax.age <= 4 ? '#10b981' : pax.age <= 11 ? '#d97706' : '#0052cc' }}>
                      Discount: {pax.age <= 4 ? 'Free (100% Off)' : pax.age <= 11 ? '50% Off Adult Fare' : '25% Off (Pays 75%)'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Validation Error Alert Box */}
            {passengerValidationError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                <AlertCircle size={20} />
                <span>{passengerValidationError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                Occupying 1 Cabin ({totalPassengers} Passengers)
              </span>
              <button
                className="btn btn-primary"
                disabled={isSoldOut || totalPassengers === 0}
                onClick={handleNextFromStep1}
              >
                <span>Next: Optional Services</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OPTIONAL SERVICES */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div
                className={`glass-panel ${selectedServices.includes('insurance') ? 'border-cyan-400' : ''}`}
                style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}
                onClick={() => toggleService('insurance')}
              >
                <input type="checkbox" checked={selectedServices.includes('insurance')} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-navy)' }}>🛡️ Travel Insurance</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Full trip cancellation protection • $80 per passenger</p>
                </div>
              </div>

              <div
                className={`glass-panel ${selectedServices.includes('wifi') ? 'border-cyan-400' : ''}`}
                style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}
                onClick={() => toggleService('wifi')}
              >
                <input type="checkbox" checked={selectedServices.includes('wifi')} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-navy)' }}>📶 High-Speed Wi-Fi Package</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Unlimited streaming satellite internet • $15 per passenger per night</p>
                </div>
              </div>

              <div
                className={`glass-panel ${selectedServices.includes('excursion') ? 'border-cyan-400' : ''}`}
                style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}
                onClick={() => toggleService('excursion')}
              >
                <input type="checkbox" checked={selectedServices.includes('excursion')} onChange={() => {}} style={{ width: '20px', height: '20px' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-navy)' }}>🏝️ VIP Shore Excursion Pass</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Guided island tours & water activities • $120 per passenger</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                <span>Next: Review & Contact</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW PRICING & CONFIRM */}
        {step === 3 && (
          <div>
            {pricingError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={20} />
                <span>{pricingError}</span>
              </div>
            )}

            {/* Promo Code Input & Quick Chips */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <label className="form-label">Promotional Code</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Enter code e.g. SUMMER10, FIRST150"
                  value={promoCodeInput}
                  onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              {/* Preset Promo Code Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Try Seed Codes:</span>
                <button className="promo-chip" onClick={() => setPromoCodeInput('SUMMER10')}>SUMMER10 (10%)</button>
                <button className="promo-chip" onClick={() => setPromoCodeInput('FIRST150')}>FIRST150 ($150)</button>
                <button className="promo-chip" onClick={() => setPromoCodeInput('CREW25')}>CREW25 (25%)</button>
              </div>

              {pricing?.promo && promoCodeInput && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
                  {pricing.promo.valid ? (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} /> Code '{pricing.promo.code}' applied: -${pricing.promo.discount_amount.toFixed(2)} off!
                    </span>
                  ) : (
                    <span style={{ color: '#be123c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={16} /> {pricing.promo.rejection_reason}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Passenger Summary Details Box */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#f8fafc' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-navy)' }}>
                Cabin Passengers Manifest (1 Cabin • {passengersList.length} Persons)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {passengersList.map((p, idx) => (
                  <div key={p.id} style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-navy)' }}>
                      #{idx + 1} {p.first_name || p.last_name ? `${p.first_name} ${p.last_name}` : `Passenger ${idx + 1}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.type.toUpperCase()} • Age {p.age}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Transparent Price Table */}
            {pricing && (
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-navy)' }}>Transparent Price Breakdown</h4>
                <table className="price-table">
                  <tbody>
                    {pricing.passengers_breakdown.map((p, idx) => {
                      const paxDetail = passengersList[idx];
                      const paxName = paxDetail && (paxDetail.first_name || paxDetail.last_name)
                        ? `${paxDetail.first_name} ${paxDetail.last_name}`
                        : `Passenger #${idx + 1}`;
                      return (
                        <tr key={idx}>
                          <td>{paxName} ({p.passenger_type.toUpperCase()}, Age {p.age})</td>
                          <td style={{ textAlign: 'right' }}>
                            ${p.base_fare.toFixed(2)}
                            {p.child_discount_percentage > 0 && (
                              <span style={{ color: '#10b981', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 700 }}>
                                (-{p.child_discount_percentage}%)
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>${p.charged_fare.toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={2}>
                        Gross Cruise Subtotal
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${pricing.gross_cruise_fare.toFixed(2)}</td>
                    </tr>

                    {pricing.group_discount_amount > 0 && (
                      <tr style={{ color: '#10b981' }}>
                        <td colSpan={2}>
                          Group Discount ({pricing.group_discount_tier.percentage}% for {pricing.total_passengers} pax)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>-${pricing.group_discount_amount.toFixed(2)}</td>
                      </tr>
                    )}

                    {pricing.selected_services_breakdown.map((srv, idx) => (
                      <tr key={idx}>
                        <td colSpan={2}>Add-on: {srv.service_name} ({srv.quantity} qty)</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>+${srv.total_charged.toFixed(2)}</td>
                      </tr>
                    ))}

                    {pricing.promo.valid && (
                      <tr style={{ color: '#10b981' }}>
                        <td colSpan={2}>Promo Code ({pricing.promo.code})</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>-${pricing.promo.discount_amount.toFixed(2)}</td>
                      </tr>
                    )}

                    <tr>
                      <td colSpan={2}>Estimated Tax (12%)</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>+${pricing.tax_amount.toFixed(2)}</td>
                    </tr>

                    <tr className="price-total-row">
                      <td colSpan={2}>Total Amount Charged</td>
                      <td style={{ textAlign: 'right' }}>${pricing.total_amount_charged.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Lead Customer Contact Info Form */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-navy)' }}>Lead Customer Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.first_name}
                    onChange={e => setCustomerInfo({ ...customerInfo, first_name: e.target.value })}
                    className="form-input"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.last_name}
                    onChange={e => setCustomerInfo({ ...customerInfo, last_name: e.target.value })}
                    className="form-input"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="form-input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="form-input"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>
            </div>

            {bookingError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                {bookingError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <button
                className="btn btn-primary"
                disabled={bookingLoading}
                onClick={handleConfirmBooking}
              >
                <span>{bookingLoading ? 'Processing Booking...' : 'Confirm & Pay Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION RECEIPT */}
        {step === 4 && bookingConfirmed && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: '#dcfce7', borderRadius: '50%', color: '#16a34a', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} />
            </div>

            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent-navy)' }}>
              Booking Reference: <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{bookingConfirmed.booking_reference}</span>
            </h3>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your cruise booking for <strong>1 Cabin</strong> with <strong>{bookingConfirmed.cruise.cruise_line}</strong> ({bookingConfirmed.cruise.ship_name}) is confirmed!
            </p>

            <div className="glass-panel" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--accent-navy)' }}>
                Immutable Snapshot Summary
              </h4>
              <p><strong>Reserved Unit:</strong> 1 Cabin Occupied</p>
              <p><strong>Lead Customer:</strong> {bookingConfirmed.customer.first_name} {bookingConfirmed.customer.last_name} ({bookingConfirmed.customer.email})</p>
              <p><strong>Destination:</strong> {bookingConfirmed.cruise.destination} ({bookingConfirmed.cruise.nights} Nights)</p>
              <p><strong>Total Passengers:</strong> {bookingConfirmed.breakdown.total_passengers} ({bookingConfirmed.breakdown.adult_count} Adults, {bookingConfirmed.breakdown.child_count} Children)</p>
              
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Cabin Passenger Manifest:</strong>
                {passengersList.map((p, i) => (
                  <div key={i} style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    • #{i + 1} {p.first_name || p.last_name ? `${p.first_name} ${p.last_name}` : `Passenger ${i + 1}`} ({p.type.toUpperCase()}, Age {p.age})
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '1rem' }}><strong>Amount Charged:</strong> <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>${bookingConfirmed.breakdown.total_amount_charged.toFixed(2)}</span></p>
            </div>

            <button className="btn btn-primary" onClick={onClose}>
              Done & Return to Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

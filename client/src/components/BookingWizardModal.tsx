import React, { useState, useEffect } from 'react';
import { Cruise, PassengerInput, PriceCalculationResponse, HistoricBookingResponse } from '../types';
import { calculatePricing, createBooking } from '../services/api';
import { X, Users, ShieldCheck, Tag, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface BookingWizardModalProps {
  cruise: Cruise;
  onClose: () => void;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({ cruise, onClose }) => {
  const [step, setStep] = useState<number>(1);
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
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
  const maxAllowedPassengers = Math.min(6, capacityLeft);
  const totalPassengers = adultCount + childrenAges.length;
  const isMaxReached = totalPassengers >= maxAllowedPassengers;
  const isSoldOut = capacityLeft === 0;

  // Recalculate price when passengers, services, or promo code changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (totalPassengers === 0 || isSoldOut) return;
      const passengers: PassengerInput[] = [
        ...Array(adultCount).fill({ type: 'adult', age: 30 }),
        ...childrenAges.map(age => ({ type: 'child' as const, age }))
      ];

      setLoadingPricing(true);
      setPricingError(null);
      try {
        const res = await calculatePricing({
          cruise_id: cruise.id,
          passengers,
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
  }, [cruise.id, adultCount, childrenAges, selectedServices, promoCodeInput, customerInfo.email, isSoldOut, totalPassengers]);

  const handleAddChild = () => {
    if (adultCount + childrenAges.length >= maxAllowedPassengers) return;
    setChildrenAges([...childrenAges, 8]); // default 8 y/o
  };

  const handleRemoveChild = (index: number) => {
    setChildrenAges(childrenAges.filter((_, i) => i !== index));
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const updated = [...childrenAges];
    updated[index] = age;
    setChildrenAges(updated);
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
      setBookingError('Please enter your first name, last name, and email.');
      return;
    }

    const passengers: PassengerInput[] = [
      ...Array(adultCount).fill({ type: 'adult', age: 30 }),
      ...childrenAges.map(age => ({ type: 'child' as const, age }))
    ];

    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await createBooking({
        cruise_id: cruise.id,
        customer: customerInfo,
        passengers,
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
            {step === 4 ? '🎉 Booking Confirmed!' : `Step ${step} of 3: ${step === 1 ? 'Select Passengers' : step === 2 ? 'Optional Add-ons' : 'Review & Contact Info'}`}
          </h2>
        </div>

        {/* STEP 1: PASSENGERS */}
        {step === 1 && (
          <div>
            {/* Sold Out Warning Banner */}
            {isSoldOut ? (
              <div style={{ background: '#ffe4e6', border: '1px solid #fecdd3', color: '#be123c', padding: '0.9rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                <AlertCircle size={20} />
                <span>No more cabins are available on this cruise voyage.</span>
              </div>
            ) : isMaxReached ? (
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', padding: '0.9rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                <AlertCircle size={20} />
                <span>Maximum available cabin capacity reached ({capacityLeft} cabin{capacityLeft > 1 ? 's' : ''} left). No more cabins available for additional passengers.</span>
              </div>
            ) : null}

            <div className="form-group glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Adult Passengers (Age 18+)</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Min 1 adult required per booking. 100% full adult fare.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    disabled={adultCount <= 1 || isSoldOut}
                    onClick={() => setAdultCount(adultCount - 1)}
                  >-</button>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>{adultCount}</span>
                  <button
                    className="btn btn-secondary"
                    disabled={isMaxReached || isSoldOut}
                    onClick={() => {
                      if (!isMaxReached && !isSoldOut) setAdultCount(adultCount + 1);
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Children Section */}
            <div className="form-group glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Child Passengers (Age 0 to 17)</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    0-4 yrs: <strong style={{ color: '#10b981' }}>Free (100% off)</strong> | 5-11 yrs: <strong style={{ color: '#ff9900' }}>50% off</strong> | 12-17 yrs: <strong style={{ color: '#0052cc' }}>25% off</strong>
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled={isMaxReached || isSoldOut}
                  onClick={handleAddChild}
                >
                  + Add Child
                </button>
              </div>

              {childrenAges.map((age, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Child #{idx + 1} Age:</span>
                  <input
                    type="number"
                    min={0}
                    max={17}
                    value={age}
                    onChange={e => handleChildAgeChange(idx, parseInt(e.target.value) || 0)}
                    className="form-input"
                    style={{ width: '90px' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: age <= 4 ? '#10b981' : age <= 11 ? '#d97706' : '#0052cc', fontWeight: 700 }}>
                    {age <= 4 ? 'Free (100% Off)' : age <= 11 ? '50% Off Adult Fare' : '25% Off (Pays 75%)'}
                  </span>
                  <button
                    onClick={() => handleRemoveChild(idx)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                Total Passengers: {totalPassengers} / {maxAllowedPassengers} ({isSoldOut ? 'No cabins available' : `${capacityLeft} cabin${capacityLeft !== 1 ? 's' : ''} left`})
              </span>
              <button
                className="btn btn-primary"
                disabled={isSoldOut || totalPassengers === 0 || totalPassengers > capacityLeft}
                onClick={() => setStep(2)}
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
                <button className="promo-chip" onClick={() => setPromoCodeInput('WINTER5')}>WINTER5 (Expired)</button>
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

            {/* Live Transparent Price Table */}
            {pricing && (
              <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-navy)' }}>Transparent Price Breakdown</h4>
                <table className="price-table">
                  <tbody>
                    {pricing.passengers_breakdown.map((p, idx) => (
                      <tr key={idx}>
                        <td>Passenger #{idx + 1} ({p.passenger_type.toUpperCase()}, Age {p.age})</td>
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
                    ))}

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

            {/* Customer Info Form */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-navy)' }}>Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">First Name</label>
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
                  <label className="form-label">Last Name</label>
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
                  <label className="form-label">Email Address</label>
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
              Your cruise booking with <strong>{bookingConfirmed.cruise.cruise_line}</strong> ({bookingConfirmed.cruise.ship_name}) is confirmed!
            </p>

            <div className="glass-panel" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--accent-navy)' }}>
                Immutable Snapshot Summary
              </h4>
              <p><strong>Customer:</strong> {bookingConfirmed.customer.first_name} {bookingConfirmed.customer.last_name} ({bookingConfirmed.customer.email})</p>
              <p><strong>Destination:</strong> {bookingConfirmed.cruise.destination} ({bookingConfirmed.cruise.nights} Nights)</p>
              <p><strong>Total Passengers:</strong> {bookingConfirmed.breakdown.total_passengers} ({bookingConfirmed.breakdown.adult_count} Adults, {bookingConfirmed.breakdown.child_count} Children)</p>
              <p><strong>Amount Charged:</strong> <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>${bookingConfirmed.breakdown.total_amount_charged.toFixed(2)}</span></p>
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

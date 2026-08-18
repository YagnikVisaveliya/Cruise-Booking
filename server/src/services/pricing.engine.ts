/**
 * Independent, Pure Pure-Function Pricing Engine
 * Zero Database Dependencies - Pure Integer Cents Arithmetic
 */

export interface PurePassengerInput {
  type: 'adult' | 'child';
  age: number;
}

export interface PureChildAgeBand {
  minAge: number;
  maxAge: number;
  discountPercentage: number;
}

export interface PureGroupDiscountTier {
  minPassengers: number;
  maxPassengers: number;
  discountPercentage: number;
}

export interface PureOptionalService {
  id: string;
  name: string;
  unitPriceCents: number;
  pricingUnit: 'per_passenger' | 'per_passenger_per_night';
}

export interface PurePromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (e.g. 10.0) or fixed cents (e.g. 15000)
  validFrom: string; // ISO YYYY-MM-DD
  validTo: string;
  maxTotalUses: number;
  maxUsesPerCustomer: number;
  minSpendCents: number;
  currentUses: number;
}

export interface PassengerFareBreakdownCents {
  passengerType: 'adult' | 'child';
  age: number;
  baseFareCents: number;
  childDiscountPercentage: number;
  childDiscountAmountCents: number;
  chargedFareCents: number;
}

export interface ServiceFareBreakdownCents {
  serviceId: string;
  serviceName: string;
  unitPriceCents: number;
  pricingUnit: string;
  quantity: number;
  totalChargedCents: number;
}

export interface PricingQuoteResult {
  totalPassengers: number;
  adultCount: number;
  childCount: number;
  adultFareCents: number;
  childFaresCentsTotal: number;
  passengersBreakdown: PassengerFareBreakdownCents[];
  grossCruiseSubtotalCents: number; // 3. Cruise subtotal
  groupDiscountPercentage: number;
  groupDiscountAmountCents: number; // 4. Group discount
  netCruiseFareCents: number; // 4. Cruise fare after group discount
  insuranceCents: number; // 5. Insurance
  wifiCents: number; // 5. Wi-Fi
  shoreExcursionCents: number; // 5. Shore excursion
  servicesBreakdown: ServiceFareBreakdownCents[];
  servicesSubtotalCents: number; // 5. Services subtotal
  subtotalBeforePromoCents: number;
  promoCodeApplied?: string;
  promoDiscountAmountCents: number; // 6. Promotional discount
  taxableSubtotalCents: number; // 7. Taxable subtotal (Net Payable Before Tax)
  taxRatePercentage: number; // 7. Tax rate (e.g. 12.0)
  taxAmountCents: number; // 7. Tax amount
  finalTotalCents: number; // 8. Final total
}

export class PricingEngine {
  /**
   * Pure calculation of pricing using INTEGER CENTS only.
   * Zero DB access, zero floating-point arithmetic.
   */
  public static calculateQuote(params: {
    adultBaseFareCents: number;
    nights: number;
    passengers: PurePassengerInput[];
    selectedServiceIds?: string[];
    availableServices?: PureOptionalService[];
    childAgeBands?: PureChildAgeBand[];
    groupDiscountTiers?: PureGroupDiscountTier[];
    promoCodeObj?: PurePromoCode | null;
    taxRate?: number; // default 0.12 (12%)
    customerRedemptionsCount?: number;
    currentDateIso?: string;
  }): PricingQuoteResult {
    const {
      adultBaseFareCents,
      nights,
      passengers,
      selectedServiceIds = [],
      availableServices = [
        { id: 'insurance', name: 'Travel Insurance', unitPriceCents: 8000, pricingUnit: 'per_passenger' },
        { id: 'wifi', name: 'Onboard High-Speed Wi-Fi', unitPriceCents: 1500, pricingUnit: 'per_passenger_per_night' },
        { id: 'excursion', name: 'Shore Excursion Package', unitPriceCents: 12000, pricingUnit: 'per_passenger' }
      ],
      childAgeBands = [
        { minAge: 0, maxAge: 4, discountPercentage: 100.0 },
        { minAge: 5, maxAge: 11, discountPercentage: 50.0 },
        { minAge: 12, maxAge: 17, discountPercentage: 25.0 }
      ],
      groupDiscountTiers = [
        { minPassengers: 1, maxPassengers: 2, discountPercentage: 0.0 },
        { minPassengers: 3, maxPassengers: 4, discountPercentage: 5.0 },
        { minPassengers: 5, maxPassengers: 6, discountPercentage: 10.0 }
      ],
      promoCodeObj = null,
      taxRate = 0.12,
      customerRedemptionsCount = 0,
      currentDateIso = new Date().toISOString().split('T')[0]
    } = params;

    // Rule Validations
    if (!passengers || passengers.length === 0) {
      throw new Error('At least one passenger must be specified.');
    }
    if (passengers.length > 6) {
      throw new Error('Maximum 6 passengers allowed per booking.');
    }

    const adultCount = passengers.filter(p => p.type === 'adult' || p.age >= 18).length;
    const childCount = passengers.filter(p => p.type === 'child' && p.age < 18).length;

    if (adultCount < 1) {
      throw new Error('At least one adult (age 18+) is required per booking.');
    }

    // 1 & 2. Calculate Adult and Child Fares in Integer Cents
    let adultFareCentsSum = 0;
    let childFaresCentsSum = 0;

    const passengersBreakdown: PassengerFareBreakdownCents[] = passengers.map(p => {
      const isAdult = p.type === 'adult' || p.age >= 18;
      if (isAdult) {
        adultFareCentsSum += adultBaseFareCents;
        return {
          passengerType: 'adult',
          age: p.age,
          baseFareCents: adultBaseFareCents,
          childDiscountPercentage: 0,
          childDiscountAmountCents: 0,
          chargedFareCents: adultBaseFareCents
        };
      } else {
        const band = childAgeBands.find(b => p.age >= b.minAge && p.age <= b.maxAge);
        const discountPct = band ? band.discountPercentage : 0;
        // Integer Cents discount calculation
        const discountAmountCents = Math.round((adultBaseFareCents * discountPct) / 100);
        const chargedFareCents = adultBaseFareCents - discountAmountCents;
        childFaresCentsSum += chargedFareCents;

        return {
          passengerType: 'child',
          age: p.age,
          baseFareCents: adultBaseFareCents,
          childDiscountPercentage: discountPct,
          childDiscountAmountCents: discountAmountCents,
          chargedFareCents: chargedFareCents
        };
      }
    });

    // 3. Gross Cruise Subtotal
    const grossCruiseSubtotalCents = adultFareCentsSum + childFaresCentsSum;

    // 4. Apply Group Discount to Cruise Fare ONLY
    const totalPassengers = passengers.length;
    const tier = groupDiscountTiers.find(
      t => totalPassengers >= t.minPassengers && totalPassengers <= t.maxPassengers
    ) || { minPassengers: 1, maxPassengers: 2, discountPercentage: 0.0 };

    const groupDiscountAmountCents = Math.round((grossCruiseSubtotalCents * tier.discountPercentage) / 100);
    const netCruiseFareCents = grossCruiseSubtotalCents - groupDiscountAmountCents;

    // 5. Add Optional Services in Cents
    let insuranceCents = 0;
    let wifiCents = 0;
    let shoreExcursionCents = 0;
    const servicesBreakdown: ServiceFareBreakdownCents[] = [];

    for (const serviceId of selectedServiceIds) {
      const srv = availableServices.find(s => s.id === serviceId);
      if (!srv) {
        throw new Error(`Invalid optional service: '${serviceId}'`);
      }
      let qty = totalPassengers;
      let totalCharged = srv.unitPriceCents * totalPassengers;
      if (srv.pricingUnit === 'per_passenger_per_night') {
        qty = totalPassengers * nights;
        totalCharged = srv.unitPriceCents * totalPassengers * nights;
      }

      if (srv.id === 'insurance') insuranceCents = totalCharged;
      if (srv.id === 'wifi') wifiCents = totalCharged;
      if (srv.id === 'excursion') shoreExcursionCents = totalCharged;

      servicesBreakdown.push({
        serviceId: srv.id,
        serviceName: srv.name,
        unitPriceCents: srv.unitPriceCents,
        pricingUnit: srv.pricingUnit,
        quantity: qty,
        totalChargedCents: totalCharged
      });
    }

    const servicesSubtotalCents = insuranceCents + wifiCents + shoreExcursionCents;
    const subtotalBeforePromoCents = netCruiseFareCents + servicesSubtotalCents;

    // 6. Apply Promotional Discount
    let promoDiscountAmountCents = 0;
    let promoCodeApplied: string | undefined = undefined;

    if (promoCodeObj) {
      const validFrom = new Date(promoCodeObj.validFrom).toISOString().split('T')[0];
      const validTo = new Date(promoCodeObj.validTo).toISOString().split('T')[0];

      if (currentDateIso < validFrom || currentDateIso > validTo) {
        throw new Error(`Promotional code '${promoCodeObj.code}' is expired or not yet valid.`);
      }
      if (promoCodeObj.currentUses >= promoCodeObj.maxTotalUses) {
        throw new Error(`Promotional code '${promoCodeObj.code}' usage limit reached.`);
      }
      if (customerRedemptionsCount >= promoCodeObj.maxUsesPerCustomer) {
        throw new Error(`You have reached the redemption limit for promo code '${promoCodeObj.code}'.`);
      }
      if (subtotalBeforePromoCents < promoCodeObj.minSpendCents) {
        throw new Error(`Minimum spend of $${(promoCodeObj.minSpendCents / 100).toFixed(2)} required for code '${promoCodeObj.code}'.`);
      }

      if (promoCodeObj.discountType === 'percentage') {
        promoDiscountAmountCents = Math.round((subtotalBeforePromoCents * promoCodeObj.discountValue) / 100);
      } else {
        promoDiscountAmountCents = Math.round(promoCodeObj.discountValue);
      }

      // Cap discount to subtotal
      promoDiscountAmountCents = Math.min(promoDiscountAmountCents, subtotalBeforePromoCents);
      promoCodeApplied = promoCodeObj.code;
    }

    // 7. Taxable Subtotal & 12% Tax
    const taxableSubtotalCents = subtotalBeforePromoCents - promoDiscountAmountCents;
    const taxAmountCents = Math.round(taxableSubtotalCents * taxRate);

    // 8. Final Total
    const finalTotalCents = taxableSubtotalCents + taxAmountCents;

    return {
      totalPassengers,
      adultCount,
      childCount,
      adultFareCents: adultFareCentsSum,
      childFaresCentsTotal: childFaresCentsSum,
      passengersBreakdown,
      grossCruiseSubtotalCents,
      groupDiscountPercentage: tier.discountPercentage,
      groupDiscountAmountCents,
      netCruiseFareCents,
      insuranceCents,
      wifiCents,
      shoreExcursionCents,
      servicesBreakdown,
      servicesSubtotalCents,
      subtotalBeforePromoCents,
      promoCodeApplied,
      promoDiscountAmountCents,
      taxableSubtotalCents,
      taxRatePercentage: taxRate * 100,
      taxAmountCents,
      finalTotalCents
    };
  }
}

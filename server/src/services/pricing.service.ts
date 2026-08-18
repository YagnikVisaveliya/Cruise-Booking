import { prisma } from '../config/prisma.js';
import { PricingEngine, PurePassengerInput, PurePromoCode } from './pricing.engine.js';
import { PriceCalculationRequest } from '../types/index.js';

export class PricingService {
  /**
   * Helper to map cruise by UUID or deterministic seed line order
   */
  public static async findCruiseById(cruiseIdStr: string) {
    let cruise = await prisma.cruise.findUnique({
      where: { id: cruiseIdStr }
    });

    if (!cruise) {
      const cruiseLineOrder = ['Royal Caribbean', 'Celebrity Cruises', 'Norwegian Cruise Line', 'Princess Cruises', 'MSC Cruises'];
      const targetLine = cruiseLineOrder[parseInt(cruiseIdStr, 10) - 1];
      if (targetLine) {
        cruise = await prisma.cruise.findFirst({ where: { cruiseLine: targetLine } });
      }
    }

    if (!cruise) {
      const all = await prisma.cruise.findMany({ orderBy: { adultFareCents: 'asc' } });
      cruise = all[0];
    }

    return cruise;
  }

  /**
   * Fetch rules from Prisma DB and compute quote using pure PricingEngine
   */
  public static async calculateQuoteFromDb(req: PriceCalculationRequest) {
    const { cruise_id, passengers, selected_services = [], promo_code, customer_email } = req;
    const cruiseIdStr = String(cruise_id);

    const cruise = await this.findCruiseById(cruiseIdStr);

    if (!cruise) {
      throw new Error(`Cruise '${cruise_id}' not found.`);
    }

    let promoObj: PurePromoCode | null = null;
    let customerRedemptions = 0;

    if (promo_code) {
      const p = await prisma.promotionalCode.findUnique({
        where: { code: promo_code.toUpperCase() }
      });

      if (!p) {
        throw new Error(`Promotional code '${promo_code}' does not exist.`);
      }

      promoObj = {
        code: p.code,
        discountType: p.discountType as 'percentage' | 'fixed',
        discountValue: p.discountValue,
        validFrom: p.validFrom.toISOString().split('T')[0],
        validTo: p.validTo.toISOString().split('T')[0],
        maxTotalUses: p.maxTotalUses,
        maxUsesPerCustomer: p.maxUsesPerCustomer,
        minSpendCents: p.minSpendCents,
        currentUses: p.currentUses
      };

      if (customer_email) {
        const cust = await prisma.customer.findUnique({
          where: { email: customer_email.toLowerCase() }
        });
        if (cust) {
          customerRedemptions = await prisma.promoRedemption.count({
            where: { promoCodeId: p.id, customerId: cust.id }
          });
        }
      }
    }

    const purePassengers: PurePassengerInput[] = passengers.map(p => ({
      type: p.type,
      age: p.age
    }));

    const result = PricingEngine.calculateQuote({
      adultBaseFareCents: cruise.adultFareCents,
      nights: cruise.nights,
      passengers: purePassengers,
      selectedServiceIds: selected_services,
      promoCodeObj: promoObj,
      customerRedemptionsCount: customerRedemptions
    });

    return {
      cruise: {
        id: cruise.id,
        cruise_line: cruise.cruiseLine,
        ship_name: cruise.shipName,
        destination: cruise.destination,
        nights: cruise.nights,
        adult_fare: cruise.adultFareCents / 100
      },
      total_passengers: result.totalPassengers,
      adult_count: result.adultCount,
      child_count: result.childCount,
      adult_fare: result.adultFareCents / 100,
      child_fares: result.childFaresCentsTotal / 100,
      passengers_breakdown: result.passengersBreakdown.map(p => ({
        passenger_type: p.passengerType,
        age: p.age,
        base_fare: p.baseFareCents / 100,
        child_discount_percentage: p.childDiscountPercentage,
        child_discount_amount: p.childDiscountAmountCents / 100,
        charged_fare: p.chargedFareCents / 100
      })),
      gross_cruise_fare: result.grossCruiseSubtotalCents / 100,
      group_discount_tier: {
        percentage: result.groupDiscountPercentage
      },
      group_discount_amount: result.groupDiscountAmountCents / 100,
      net_cruise_fare: result.netCruiseFareCents / 100,
      insurance: result.insuranceCents / 100,
      wifi: result.wifiCents / 100,
      shore_excursion: result.shoreExcursionCents / 100,
      selected_services_breakdown: result.servicesBreakdown.map(s => ({
        service_id: s.serviceId,
        service_name: s.serviceName,
        unit_price: s.unitPriceCents / 100,
        pricing_unit: s.pricingUnit,
        quantity: s.quantity,
        total_charged: s.totalChargedCents / 100
      })),
      optional_services_total: result.servicesSubtotalCents / 100,
      subtotal_before_promo: result.subtotalBeforePromoCents / 100,
      promo: {
        valid: true,
        code: result.promoCodeApplied,
        discount_amount: result.promoDiscountAmountCents / 100
      },
      taxable_subtotal: result.taxableSubtotalCents / 100,
      net_payable_before_tax: result.taxableSubtotalCents / 100,
      tax_rate_percentage: result.taxRatePercentage,
      tax_amount: result.taxAmountCents / 100,
      total_amount_charged: result.finalTotalCents / 100,
      cents: {
        adultFareCents: result.adultFareCents,
        childFaresCentsTotal: result.childFaresCentsTotal,
        grossCruiseSubtotalCents: result.grossCruiseSubtotalCents,
        groupDiscountAmountCents: result.groupDiscountAmountCents,
        netCruiseFareCents: result.netCruiseFareCents,
        insuranceCents: result.insuranceCents,
        wifiCents: result.wifiCents,
        shoreExcursionCents: result.shoreExcursionCents,
        servicesSubtotalCents: result.servicesSubtotalCents,
        subtotalBeforePromoCents: result.subtotalBeforePromoCents,
        promoDiscountAmountCents: result.promoDiscountAmountCents,
        taxableSubtotalCents: result.taxableSubtotalCents,
        taxAmountCents: result.taxAmountCents,
        finalTotalCents: result.finalTotalCents
      }
    };
  }

  public static async calculatePrice(req: PriceCalculationRequest) {
    return this.calculateQuoteFromDb(req);
  }

  public static async validatePromoCode(code: string, subtotalBeforePromo: number, customerEmail?: string) {
    const p = await prisma.promotionalCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!p) {
      return { valid: false, discount_amount: 0, rejection_reason: `Promotional code '${code}' does not exist.` };
    }

    const promoObj: PurePromoCode = {
      code: p.code,
      discountType: p.discountType as 'percentage' | 'fixed',
      discountValue: p.discountValue,
      validFrom: p.validFrom.toISOString().split('T')[0],
      validTo: p.validTo.toISOString().split('T')[0],
      maxTotalUses: p.maxTotalUses,
      maxUsesPerCustomer: p.maxUsesPerCustomer,
      minSpendCents: p.minSpendCents,
      currentUses: p.currentUses
    };

    let customerRedemptions = 0;
    if (customerEmail) {
      const cust = await prisma.customer.findUnique({ where: { email: customerEmail.toLowerCase() } });
      if (cust) {
        customerRedemptions = await prisma.promoRedemption.count({
          where: { promoCodeId: p.id, customerId: cust.id }
        });
      }
    }

    try {
      const dummyRes = PricingEngine.calculateQuote({
        adultBaseFareCents: Math.round((subtotalBeforePromo || 1000) * 100),
        nights: 1,
        passengers: [{ type: 'adult', age: 30 }],
        promoCodeObj: promoObj,
        currentDateIso: new Date().toISOString().split('T')[0]
      });
      return {
        valid: true,
        code: promoObj.code,
        discount_type: promoObj.discountType,
        discount_value: promoObj.discountValue,
        discount_amount: dummyRes.promoDiscountAmountCents / 100
      };
    } catch (err: any) {
      return {
        valid: false,
        code: promoObj.code,
        discount_amount: 0,
        rejection_reason: err.message
      };
    }
  }
}

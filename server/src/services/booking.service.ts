import { prisma } from '../config/prisma.js';
import { PricingService } from './pricing.service.js';
import { CreateBookingRequest, HistoricBookingResponse } from '../types/index.js';

export class BookingService {
  /**
   * Helper to generate unique alphanumeric booking reference e.g. CRZ-9A4F2B
   */
  private static generateReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CRZ-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create & Confirm Booking using Prisma Interactive Transaction
   */
  public static async createBooking(req: CreateBookingRequest): Promise<HistoricBookingResponse> {
    const { cruise_id, customer, passengers, selected_services = [], promo_code } = req;

    if (!customer || !customer.first_name || !customer.last_name || !customer.email) {
      throw new Error('Customer first_name, last_name, and email are required.');
    }

    const cruiseIdStr = String(cruise_id);
    const targetCruise = await PricingService.findCruiseById(cruiseIdStr);
    if (!targetCruise) {
      throw new Error(`Cruise '${cruise_id}' not found.`);
    }

    // 1. Compute price quote using PricingService & pure PricingEngine
    const pricing = await PricingService.calculatePrice({
      cruise_id: targetCruise.id,
      passengers,
      selected_services,
      promo_code,
      customer_email: customer.email
    });

    const bookingRef = this.generateReference();

    // 2. Execute Transaction using Prisma Client
    await prisma.$transaction(async (tx) => {
      // A. Fetch & Lock Cruise for Capacity Check
      const cruise = await tx.cruise.findUnique({
        where: { id: targetCruise.id }
      });

      if (!cruise || cruise.capacityLeft < pricing.total_passengers) {
        throw new Error('Booking failed: Cruise has insufficient capacity remaining.');
      }

      // B. Upsert Customer Record
      const customerRecord = await tx.customer.upsert({
        where: { email: customer.email.toLowerCase() },
        update: {
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone || null
        },
        create: {
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email.toLowerCase(),
          phone: customer.phone || null
        }
      });

      // C. Process Promo Code Redemption Limits
      let promoRecord: any = null;
      if (pricing.promo.valid && pricing.promo.code) {
        promoRecord = await tx.promotionalCode.findUnique({
          where: { code: pricing.promo.code.toUpperCase() }
        });

        if (!promoRecord || promoRecord.currentUses >= promoRecord.maxTotalUses) {
          throw new Error(`Booking failed: Promo code '${pricing.promo.code}' usage limit reached.`);
        }

        await tx.promotionalCode.update({
          where: { id: promoRecord.id },
          data: { currentUses: { increment: 1 } }
        });
      }

      // D. Decrement Cruise Capacity Atomically
      await tx.cruise.update({
        where: { id: cruise.id },
        data: { capacityLeft: { decrement: pricing.total_passengers } }
      });

      // E. Create Main Booking Header Snapshot Record
      const newBooking = await tx.booking.create({
        data: {
          bookingReference: bookingRef,
          customerId: customerRecord.id,
          cruiseId: cruise.id,
          nightsSnapshot: pricing.cruise.nights,
          adultFareCentsSnapshot: pricing.cents.adultFareCents,
          totalPassengers: pricing.total_passengers,
          adultCount: pricing.adult_count,
          childCount: pricing.child_count,
          grossCruiseFareCents: pricing.cents.grossCruiseSubtotalCents,
          groupDiscountPercentageSnapshot: pricing.group_discount_tier.percentage,
          groupDiscountAmountCents: pricing.cents.groupDiscountAmountCents,
          netCruiseFareCents: pricing.cents.netCruiseFareCents,
          optionalServicesTotalCents: pricing.cents.servicesSubtotalCents,
          subtotalBeforePromoCents: pricing.cents.subtotalBeforePromoCents,
          promoCodeId: promoRecord ? promoRecord.id : null,
          promoCodeNameSnapshot: pricing.promo.code || null,
          promoDiscountAmountCents: pricing.cents.promoDiscountAmountCents,
          netPayableBeforeTaxCents: pricing.cents.taxableSubtotalCents,
          taxRatePercentageSnapshot: pricing.tax_rate_percentage,
          taxAmountCents: pricing.cents.taxAmountCents,
          totalAmountChargedCents: pricing.cents.finalTotalCents,
          status: 'CONFIRMED'
        }
      });

      // F. Create Passenger Snapshot Line Items
      for (const pax of pricing.passengers_breakdown) {
        await tx.bookingPassenger.create({
          data: {
            bookingId: newBooking.id,
            passengerType: pax.passenger_type,
            age: pax.age,
            baseFareCentsSnapshot: Math.round(pax.base_fare * 100),
            childDiscountPercentageSnapshot: pax.child_discount_percentage,
            chargedFareCents: Math.round(pax.charged_fare * 100)
          }
        });
      }

      // G. Create Service Snapshot Line Items
      for (const srv of pricing.selected_services_breakdown) {
        await tx.bookingService.create({
          data: {
            bookingId: newBooking.id,
            serviceId: srv.service_id,
            serviceNameSnapshot: srv.service_name,
            unitPriceCentsSnapshot: Math.round(srv.unit_price * 100),
            quantity: srv.quantity,
            totalChargedCents: Math.round(srv.total_charged * 100)
          }
        });
      }

      // H. Create Promo Redemption Audit Log Record
      if (promoRecord) {
        await tx.promoRedemption.create({
          data: {
            promoCodeId: promoRecord.id,
            customerId: customerRecord.id,
            bookingId: newBooking.id
          }
        });
      }
    });

    return await this.getBookingByReference(bookingRef);
  }

  /**
   * Reconstruct & Retrieve Historic Booking by Reference Code using Prisma Client
   */
  public static async getBookingByReference(reference: string): Promise<HistoricBookingResponse> {
    const refUpper = reference.trim().toUpperCase();

    const booking = await prisma.booking.findUnique({
      where: { bookingReference: refUpper },
      include: {
        customer: true,
        cruise: true,
        passengers: true,
        services: true
      }
    });

    if (!booking) {
      throw new Error(`Booking reference '${reference}' not found.`);
    }

    return {
      booking_reference: booking.bookingReference,
      created_at: booking.createdAt.toISOString(),
      status: booking.status,
      customer: {
        first_name: booking.customer.firstName,
        last_name: booking.customer.lastName,
        email: booking.customer.email,
        phone: booking.customer.phone || undefined
      },
      cruise: {
        cruise_line: booking.cruise.cruiseLine,
        ship_name: booking.cruise.shipName,
        destination: booking.cruise.destination,
        nights: booking.nightsSnapshot,
        adult_fare_at_booking: booking.adultFareCentsSnapshot / 100
      },
      breakdown: {
        total_passengers: booking.totalPassengers,
        adult_count: booking.adultCount,
        child_count: booking.childCount,
        gross_cruise_fare: booking.grossCruiseFareCents / 100,
        group_discount_percentage: booking.groupDiscountPercentageSnapshot,
        group_discount_amount: booking.groupDiscountAmountCents / 100,
        net_cruise_fare: booking.netCruiseFareCents / 100,
        optional_services_total: booking.optionalServicesTotalCents / 100,
        subtotal_before_promo: booking.subtotalBeforePromoCents / 100,
        promo_code: booking.promoCodeNameSnapshot || undefined,
        promo_discount_amount: booking.promoDiscountAmountCents / 100,
        net_payable_before_tax: booking.netPayableBeforeTaxCents / 100,
        tax_rate_percentage: booking.taxRatePercentageSnapshot,
        tax_amount: booking.taxAmountCents / 100,
        total_amount_charged: booking.totalAmountChargedCents / 100
      },
      passenger_snapshots: booking.passengers.map(p => ({
        passenger_type: p.passengerType,
        age: p.age,
        base_fare_snapshot: p.baseFareCentsSnapshot / 100,
        child_discount_percentage: p.childDiscountPercentageSnapshot,
        charged_fare: p.chargedFareCents / 100
      })),
      service_snapshots: booking.services.map(s => ({
        service_id: s.serviceId,
        service_name: s.serviceNameSnapshot,
        unit_price: s.unitPriceCentsSnapshot / 100,
        quantity: s.quantity,
        total_charged: s.totalChargedCents / 100
      }))
    };
  }
}

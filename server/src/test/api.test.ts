import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/api.routes.js';
import { PricingEngine } from '../services/pricing.engine.js';
import { prisma } from '../config/prisma.js';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Cruise Booking System Comprehensive Assessment Test Suite', () => {

  beforeAll(async () => {
    try {
      // Reset capacity for test runs
      await prisma.cruise.updateMany({
        where: { cruiseLine: 'Royal Caribbean' },
        data: { capacityLeft: 200 }
      });
      await prisma.cruise.updateMany({
        where: { cruiseLine: 'MSC Cruises' },
        data: { capacityLeft: 0 }
      });
      await prisma.promotionalCode.updateMany({
        where: { code: 'SUMMER10' },
        data: { currentUses: 0 }
      });
    } catch (e) {
      // Ignore if DB offline
    }
  });

  // --- 1. PASSENGER BOUNDARY TESTS ---
  describe('Passenger Boundaries & Validation', () => {
    it('0 adults - should reject booking', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({ cruise_id: 1, passengers: [{ type: 'child', age: 10 }] });
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('adult');
    });

    it('1 adult - should succeed', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({ cruise_id: 1, passengers: [{ type: 'adult', age: 30 }] });
      expect(res.status).toBe(200);
    });

    it('6 passengers - maximum allowed should succeed', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [
            { type: 'adult', age: 30 },
            { type: 'adult', age: 30 },
            { type: 'child', age: 4 },
            { type: 'child', age: 5 },
            { type: 'child', age: 11 },
            { type: 'child', age: 17 }
          ]
        });
      expect(res.status).toBe(200);
      expect(res.body.data.total_passengers).toBe(6);
    });

    it('7 passengers - should reject', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: Array(7).fill({ type: 'adult', age: 30 })
        });
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('Maximum 6 passengers');
    });

    it('Age 0-4 boundary (Age 0 and Age 4 should be 100% free)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }, { type: 'child', age: 0 }, { type: 'child', age: 4 }]
        });
      expect(res.status).toBe(200);
      expect(res.body.data.passengers_breakdown[1].charged_fare).toBe(0);
      expect(res.body.data.passengers_breakdown[2].charged_fare).toBe(0);
    });

    it('Age 5-11 boundary (Age 5 and Age 11 should get 50% discount)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }, { type: 'child', age: 5 }, { type: 'child', age: 11 }]
        });
      expect(res.status).toBe(200);
      expect(res.body.data.passengers_breakdown[1].charged_fare).toBe(600);
      expect(res.body.data.passengers_breakdown[2].charged_fare).toBe(600);
    });

    it('Age 12-17 boundary (Age 12 and Age 17 should get 25% discount / pay 75%)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }, { type: 'child', age: 12 }, { type: 'child', age: 17 }]
        });
      expect(res.status).toBe(200);
      expect(res.body.data.passengers_breakdown[1].charged_fare).toBe(900);
      expect(res.body.data.passengers_breakdown[2].charged_fare).toBe(900);
    });

    it('Age 18 boundary - counted as adult (100% fare)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 18 }]
        });
      expect(res.status).toBe(200);
      expect(res.body.data.passengers_breakdown[0].charged_fare).toBe(1200);
    });
  });

  // --- 2. GROUP DISCOUNT TESTS ---
  describe('Group Discount Tiers', () => {
    it('1 passenger -> 0% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: [{ type: 'adult', age: 30 }] });
      expect(res.body.data.group_discount_tier.percentage).toBe(0);
      expect(res.body.data.group_discount_amount).toBe(0);
    });

    it('2 passengers -> 0% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: [{ type: 'adult', age: 30 }, { type: 'adult', age: 30 }] });
      expect(res.body.data.group_discount_tier.percentage).toBe(0);
    });

    it('3 passengers -> 5% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: Array(3).fill({ type: 'adult', age: 30 }) });
      expect(res.body.data.group_discount_tier.percentage).toBe(5);
    });

    it('4 passengers -> 5% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: Array(4).fill({ type: 'adult', age: 30 }) });
      expect(res.body.data.group_discount_tier.percentage).toBe(5);
    });

    it('5 passengers -> 10% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: Array(5).fill({ type: 'adult', age: 30 }) });
      expect(res.body.data.group_discount_tier.percentage).toBe(10);
    });

    it('6 passengers -> 10% group discount', async () => {
      const res = await request(app).post('/api/quotes').send({ cruise_id: 1, passengers: Array(6).fill({ type: 'adult', age: 30 }) });
      expect(res.body.data.group_discount_tier.percentage).toBe(10);
    });
  });

  // --- 3. OPTIONAL SERVICES ---
  describe('Optional Add-on Services', () => {
    it('Calculate Insurance ($80/pax), Wi-Fi ($15/pax/night), Excursion ($120/pax)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }, { type: 'adult', age: 30 }],
          selected_services: ['insurance', 'wifi', 'excursion']
        });
      expect(res.body.data.insurance).toBe(160);
      expect(res.body.data.wifi).toBe(210);
      expect(res.body.data.shore_excursion).toBe(240);
      expect(res.body.data.optional_services_total).toBe(610);
    });
  });

  // --- 4. PROMOTIONAL CODES ---
  describe('Promotional Code Validation', () => {
    it('Valid percentage promo (SUMMER10)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({ cruise_id: 1, passengers: [{ type: 'adult', age: 30 }], promo_code: 'SUMMER10' });
      expect(res.body.data.promo.valid).toBe(true);
      expect(res.body.data.promo.discount_amount).toBe(120);
    });

    it('Valid fixed promo (FIRST150 - min spend $2000)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }, { type: 'adult', age: 30 }],
          promo_code: 'FIRST150'
        });
      expect(res.body.data.promo.valid).toBe(true);
      expect(res.body.data.promo.discount_amount).toBe(150);
    });

    it('Minimum spend not met rejection', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({
          cruise_id: 1,
          passengers: [{ type: 'adult', age: 30 }],
          promo_code: 'FIRST150'
        });
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('Minimum spend');
    });

    it('Expired promo code (WINTER5)', async () => {
      const res = await request(app)
        .post('/api/quotes')
        .send({ cruise_id: 1, passengers: [{ type: 'adult', age: 30 }], promo_code: 'WINTER5' });
      expect(res.status).toBe(400);
      expect(res.body.errors[0]).toContain('expired');
    });
  });

  // --- 5. CAPACITY & BOOKING TRANSACTIONS ---
  describe('Capacity & Confirmation Consistency', () => {
    it('Zero capacity cruise must not be bookable (MSC Cruises)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          cruise_id: 5,
          customer: { first_name: 'Test', last_name: 'User', email: `test.zero.${Date.now()}@example.com` },
          passengers: [{ type: 'adult', age: 30 }]
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('capacity');
    });

    it('Quote vs Confirmation price consistency', async () => {
      const uniqueEmail = `alice.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;
      const payload = {
        cruise_id: 1,
        customer: { first_name: 'Alice', last_name: 'Wonder', email: uniqueEmail },
        passengers: [{ type: 'adult', age: 30 }, { type: 'child', age: 8 }],
        selected_services: ['insurance'],
        promo_code: 'SUMMER10'
      };

      const quoteRes = await request(app).post('/api/quotes').send(payload);
      const bookingRes = await request(app).post('/api/bookings').send(payload);

      expect(bookingRes.status).toBe(201);
      expect(bookingRes.body.data.breakdown.total_amount_charged).toBe(quoteRes.body.data.total_amount_charged);
    });

    it('Historical price reconstruction integrity', async () => {
      const uniqueEmail = `bob.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`;
      const bookingRes = await request(app)
        .post('/api/bookings')
        .send({
          cruise_id: 1,
          customer: { first_name: 'Bob', last_name: 'Marley', email: uniqueEmail },
          passengers: [{ type: 'adult', age: 30 }]
        });

      expect(bookingRes.status).toBe(201);
      const ref = bookingRes.body.data.booking_reference;
      const getRes = await request(app).get(`/api/bookings/${ref}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.breakdown.total_amount_charged).toBe(bookingRes.body.data.breakdown.total_amount_charged);
    });
  });

  // --- 6. INDEPENDENT PRICING ENGINE UNIT TESTS ---
  describe('Independent Pure PricingEngine (Zero DB Access)', () => {
    it('Computes exact integer cents for complex passenger mix & discounts', () => {
      const result = PricingEngine.calculateQuote({
        adultBaseFareCents: 100000,
        nights: 5,
        passengers: [
          { type: 'adult', age: 35 },
          { type: 'adult', age: 35 },
          { type: 'child', age: 3 },
          { type: 'child', age: 10 }
        ],
        selectedServiceIds: ['insurance']
      });

      expect(result.grossCruiseSubtotalCents).toBe(250000);
      expect(result.groupDiscountAmountCents).toBe(12500);
      expect(result.netCruiseFareCents).toBe(237500);
      expect(result.insuranceCents).toBe(32000);
      expect(result.taxAmountCents).toBe(32340);
      expect(result.finalTotalCents).toBe(301840);
    });
  });

});

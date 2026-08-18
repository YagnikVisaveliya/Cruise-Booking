import { PricingService } from '../services/pricing.service.js';
import { BookingService } from '../services/booking.service.js';
import { checkPgConnection, memoryDb } from '../config/db.js';

async function runTestSuite() {
  console.log('----------------------------------------------------');
  console.log(' CRUISE BOOKING SYSTEM - AUTOMATED TEST SUITE');
  console.log('----------------------------------------------------\n');

  await checkPgConnection();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${description}`);
      failed++;
    }
  }

  try {
    // TC-POS-01: Single Adult Booking
    const res1 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 30 }]
    });
    assert(res1.total_amount_charged === 1344.00, 'TC-POS-01', 'Single Adult ($1200 + 12% Tax = $1344.00)');

    // TC-POS-02: Child Age 0-4 (Free)
    const res2 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 35 }, { type: 'child', age: 3 }]
    });
    assert(res2.passengers_breakdown[1].charged_fare === 0.00 && res2.total_amount_charged === 1344.00, 'TC-POS-02', 'Child Age 3 is Free ($1000 + $0 = $1000 base)');

    // TC-POS-03: Child Age 5-11 (50% Fare)
    const res3 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 35 }, { type: 'child', age: 8 }]
    });
    assert(res3.passengers_breakdown[1].charged_fare === 600.00, 'TC-POS-03', 'Child Age 8 gets 50% discount ($600 charged)');

    // TC-POS-04: Child Age 12-17 (75% Fare)
    const res4 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 35 }, { type: 'child', age: 15 }]
    });
    assert(res4.passengers_breakdown[1].charged_fare === 900.00, 'TC-POS-04', 'Child Age 15 pays 75% fare ($900 charged)');

    // TC-POS-05: Group Discount 5% (4 Pax)
    const res5 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [
        { type: 'adult', age: 35 },
        { type: 'adult', age: 34 },
        { type: 'child', age: 8 },
        { type: 'child', age: 15 }
      ]
    });
    assert(res5.group_discount_tier.percentage === 5.00, 'TC-POS-05', '4 Passengers trigger 5% group discount');

    // TC-POS-07: Optional Services Calculation
    const res7 = await PricingService.calculatePrice({
      cruise_id: 1, // 7 nights
      passengers: [{ type: 'adult', age: 30 }, { type: 'adult', age: 30 }], // 2 pax
      selected_services: ['insurance', 'wifi']
    });
    // Insurance: 80 * 2 = 160. Wifi: 15 * 2 * 7 = 210. Total services = 370
    assert(res7.optional_services_total === 370.00, 'TC-POS-07', 'Optional Services correctly calculated ($370.00)');

    // TC-POS-08: Percentage Promo Code (SUMMER10)
    const res8 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 30 }],
      promo_code: 'SUMMER10'
    });
    assert(res8.promo.valid && res8.promo.discount_amount === 120.00, 'TC-POS-08', 'SUMMER10 gives 10% off ($120 discount)');

    // TC-NEG-01: No Adult in Booking
    try {
      await PricingService.calculatePrice({
        cruise_id: 1,
        passengers: [{ type: 'child', age: 10 }, { type: 'child', age: 14 }]
      });
      assert(false, 'TC-NEG-01', 'Should reject booking without adult');
    } catch (err: any) {
      assert(err.message.includes('At least one adult'), 'TC-NEG-01', 'Rejects booking without adult');
    }

    // TC-NEG-02: Exceed Max Passengers (>6)
    try {
      await PricingService.calculatePrice({
        cruise_id: 1,
        passengers: [
          { type: 'adult', age: 30 },
          { type: 'adult', age: 30 },
          { type: 'child', age: 5 },
          { type: 'child', age: 6 },
          { type: 'child', age: 7 },
          { type: 'child', age: 8 },
          { type: 'child', age: 9 }
        ]
      });
      assert(false, 'TC-NEG-02', 'Should reject >6 passengers');
    } catch (err: any) {
      assert(err.message.includes('Maximum 6 passengers'), 'TC-NEG-02', 'Rejects >6 passengers');
    }

    // TC-NEG-03: Capacity Overflow (MSC Cruises has 0 capacity left)
    try {
      await BookingService.createBooking({
        cruise_id: 5, // MSC Cruises capacity_left = 0
        customer: { first_name: 'Test', last_name: 'User', email: 'test@example.com' },
        passengers: [{ type: 'adult', age: 30 }]
      });
      assert(false, 'TC-NEG-03', 'Should reject booking on 0 capacity cruise');
    } catch (err: any) {
      assert(err.message.includes('insufficient capacity'), 'TC-NEG-03', 'Rejects booking when capacity is 0');
    }

    // TC-NEG-04: Expired Promo Code (WINTER5)
    const resNeg4 = await PricingService.calculatePrice({
      cruise_id: 1,
      passengers: [{ type: 'adult', age: 30 }],
      promo_code: 'WINTER5'
    });
    assert(!resNeg4.promo.valid && (resNeg4.promo as any).rejection_reason?.includes('expired'), 'TC-NEG-04', 'Rejects expired promo code WINTER5');

    // TC-REC-01: Booking Snapshot & Price Reconstruction
    const booking = await BookingService.createBooking({
      cruise_id: 1,
      customer: { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com' },
      passengers: [{ type: 'adult', age: 30 }, { type: 'child', age: 8 }],
      selected_services: ['insurance'],
      promo_code: 'SUMMER10'
    });

    const reconstructed = await BookingService.getBookingByReference(booking.booking_reference);
    assert(
      reconstructed.breakdown.total_amount_charged === booking.breakdown.total_amount_charged,
      'TC-REC-01',
      `Historic booking reconstructs charged amount exactly ($${reconstructed.breakdown.total_amount_charged})`
    );

  } catch (globalErr: any) {
    console.error('Test execution error:', globalErr);
  }

  console.log('\n----------------------------------------------------');
  console.log(` TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------\n');
}

runTestSuite();

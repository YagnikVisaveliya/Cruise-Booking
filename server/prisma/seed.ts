import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cruise_booking'
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Neon PostgreSQL Database...');

  // 1. Dynamic Pricing Rule
  await prisma.pricingRule.upsert({
    where: { key: 'tax_rate' },
    update: { value: { rate: 0.12, description: '12% Sales Tax' } },
    create: { key: 'tax_rate', value: { rate: 0.12, description: '12% Sales Tax' } }
  });

  // 2. Child Age Bands
  await prisma.childAgeBand.deleteMany();
  await prisma.childAgeBand.createMany({
    data: [
      { minAge: 0, maxAge: 4, discountPercentage: 100.0, description: 'Child Age 0-4: Free (100% discount)' },
      { minAge: 5, maxAge: 11, discountPercentage: 50.0, description: 'Child Age 5-11: 50% of adult fare' },
      { minAge: 12, maxAge: 17, discountPercentage: 25.0, description: 'Child Age 12-17: 75% of adult fare (25% discount)' }
    ]
  });

  // 3. Group Discount Tiers
  await prisma.groupDiscountTier.deleteMany();
  await prisma.groupDiscountTier.createMany({
    data: [
      { minPassengers: 1, maxPassengers: 2, discountPercentage: 0.0 },
      { minPassengers: 3, maxPassengers: 4, discountPercentage: 5.0 },
      { minPassengers: 5, maxPassengers: 6, discountPercentage: 10.0 }
    ]
  });

  // 4. Optional Services (Stored in Cents)
  await prisma.optionalService.deleteMany();
  await prisma.optionalService.createMany({
    data: [
      { id: 'insurance', name: 'Travel Insurance', unitPriceCents: 8000, pricingUnit: 'per_passenger' },
      { id: 'wifi', name: 'Onboard High-Speed Wi-Fi', unitPriceCents: 1500, pricingUnit: 'per_passenger_per_night' },
      { id: 'excursion', name: 'Shore Excursion Package', unitPriceCents: 12000, pricingUnit: 'per_passenger' }
    ]
  });

  // 5. Cruises (Stored in Cents)
  await prisma.cruise.deleteMany();
  await prisma.cruise.createMany({
    data: [
      {
        cruiseLine: 'Royal Caribbean',
        shipName: 'Wonder of the Seas',
        destination: 'Caribbean',
        nights: 7,
        adultFareCents: 120000,
        capacityTotal: 200,
        capacityLeft: 12,
        imageUrl: 'https://images.unsplash.com/photo-1548574505-5e2386903f87?auto=format&fit=crop&w=800&q=80'
      },
      {
        cruiseLine: 'Celebrity Cruises',
        shipName: 'Celebrity Beyond',
        destination: 'Mediterranean',
        nights: 10,
        adultFareCents: 185000,
        capacityTotal: 150,
        capacityLeft: 4,
        imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80'
      },
      {
        cruiseLine: 'Norwegian Cruise Line',
        shipName: 'Norwegian Prima',
        destination: 'Alaska',
        nights: 5,
        adultFareCents: 95000,
        capacityTotal: 180,
        capacityLeft: 20,
        imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80'
      },
      {
        cruiseLine: 'Princess Cruises',
        shipName: 'Sky Princess',
        destination: 'Northern Europe',
        nights: 12,
        adultFareCents: 210000,
        capacityTotal: 100,
        capacityLeft: 2,
        imageUrl: 'https://images.unsplash.com/photo-1559599746-871462fd44e6?auto=format&fit=crop&w=800&q=80'
      },
      {
        cruiseLine: 'MSC Cruises',
        shipName: 'MSC Seascape',
        destination: 'Bahamas',
        nights: 4,
        adultFareCents: 70000,
        capacityTotal: 250,
        capacityLeft: 0,
        imageUrl: 'https://images.unsplash.com/photo-1516495312540-a148643b22d3?auto=format&fit=crop&w=800&q=80'
      }
    ]
  });

  // 6. Promotional Codes (Stored in Cents for Fixed & Min Spend)
  await prisma.promotionalCode.deleteMany();
  await prisma.promotionalCode.createMany({
    data: [
      {
        code: 'SUMMER10',
        discountType: 'percentage',
        discountValue: 10.0,
        validFrom: new Date('2026-06-01'),
        validTo: new Date('2026-08-31'),
        maxTotalUses: 100,
        maxUsesPerCustomer: 1,
        minSpendCents: 100000,
        currentUses: 0
      },
      {
        code: 'FIRST150',
        discountType: 'fixed',
        discountValue: 15000, // $150 in cents
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        maxTotalUses: 500,
        maxUsesPerCustomer: 1,
        minSpendCents: 200000,
        currentUses: 0
      },
      {
        code: 'CREW25',
        discountType: 'percentage',
        discountValue: 25.0,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        maxTotalUses: 3,
        maxUsesPerCustomer: 3,
        minSpendCents: 0,
        currentUses: 0
      },
      {
        code: 'WINTER5',
        discountType: 'percentage',
        discountValue: 5.0,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-03-31'),
        maxTotalUses: 1000,
        maxUsesPerCustomer: 5,
        minSpendCents: 0,
        currentUses: 0
      }
    ]
  });

  console.log('✅ Successfully seeded Neon PostgreSQL Database with Cruises, Promo Codes, and Rules!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

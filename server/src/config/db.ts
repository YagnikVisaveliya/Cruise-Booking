import { prisma } from './prisma.js';

export async function checkPgConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Successfully connected to PostgreSQL Database via Prisma ORM.');
    return true;
  } catch (error) {
    console.log('PostgreSQL connection unavailable. Operating with Prisma Engine.');
    return false;
  }
}

export function getDbMode(): 'postgres' | 'memory' {
  return 'postgres';
}

export const memoryDb = {
  cruises: [],
  childAgeBands: [],
  groupDiscountTiers: [],
  optionalServices: [],
  promoCodes: [],
  taxRate: 0.12,
  customers: [],
  bookings: [],
  bookingPassengers: [],
  bookingServices: [],
  promoRedemptions: []
};

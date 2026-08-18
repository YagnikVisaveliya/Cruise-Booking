import { z } from 'zod';
import { passengerInputSchema } from './pricing.validation.js';

export const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional()
});

export const createBookingSchema = z.object({
  cruise_id: z.union([z.string().uuid(), z.number()]),
  customer: customerSchema,
  passengers: z
    .array(passengerInputSchema)
    .min(1, 'At least one passenger must be specified')
    .max(6, 'Maximum 6 passengers allowed per booking')
    .refine(
      pax => pax.some(p => p.type === 'adult' || p.age >= 18),
      { message: 'At least one adult (age 18+) is required per booking.' }
    ),
  selected_services: z.array(z.string()).optional(),
  promo_code: z.string().optional()
});

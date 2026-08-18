import { z } from 'zod';

export const passengerInputSchema = z.object({
  type: z.enum(['adult', 'child']),
  age: z.number().min(0, 'Age cannot be negative').max(120, 'Invalid age')
});

export const calculatePriceSchema = z.object({
  cruise_id: z.union([z.string().uuid(), z.number()]),
  passengers: z
    .array(passengerInputSchema)
    .min(1, 'At least one passenger must be specified')
    .max(6, 'Maximum 6 passengers allowed per booking')
    .refine(
      pax => pax.some(p => p.type === 'adult' || p.age >= 18),
      { message: 'At least one adult (age 18+) is required per booking.' }
    ),
  selected_services: z.array(z.string()).optional(),
  promo_code: z.string().optional(),
  customer_email: z.string().email('Invalid customer email').optional().or(z.literal(''))
});

export const validatePromoSchema = z.object({
  code: z.string().min(1, 'Promotional code is required'),
  subtotalCents: z.number().min(0).optional(),
  customer_email: z.string().email('Invalid customer email').optional().or(z.literal(''))
});

// T062: Holdings validation schemas

import { z } from 'zod';

export const AddHoldingSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol too long')
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
    .transform(s => s.toUpperCase()),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim(),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(1000000000, 'Quantity exceeds maximum')
    .finite('Quantity must be a finite number'),
  averageCost: z.number()
    .positive('Average cost must be positive')
    .max(10000000, 'Price exceeds maximum')
    .finite('Average cost must be a finite number'),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const UpdateHoldingSchema = z.object({
  quantity: z.number().positive().max(1000000000).finite().optional(),
  averageCost: z.number().positive().max(10000000).finite().optional(),
  notes: z.string().max(1000).optional()
});

export type AddHoldingDto = z.infer<typeof AddHoldingSchema>;
export type UpdateHoldingDto = z.infer<typeof UpdateHoldingSchema>;

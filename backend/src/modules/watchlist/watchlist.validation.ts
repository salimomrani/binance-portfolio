// T163: Watchlist validation schemas

import { z } from 'zod';

export const AddToWatchlistSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol too long')
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
    .transform((s) => s.toUpperCase()),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export type AddToWatchlistDto = z.infer<typeof AddToWatchlistSchema>;

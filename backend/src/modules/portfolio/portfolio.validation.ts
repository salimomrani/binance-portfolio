// T061: Portfolio validation schemas

import { z } from 'zod';

export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  description: z.string().max(500, 'Description too long').optional()
});

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional()
});

export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioDto = z.infer<typeof UpdatePortfolioSchema>;

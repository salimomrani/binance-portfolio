// T094: Transaction validation schemas using Zod

import { z } from 'zod';

/**
 * Enum for transaction types
 */
export const TransactionTypeSchema = z.enum(['BUY', 'SELL'], {
  errorMap: () => ({ message: 'Transaction type must be BUY or SELL' }),
});

/**
 * Schema for adding a new transaction
 *
 * Validation rules:
 * - type: Must be BUY or SELL
 * - quantity: Must be positive number, max 8 decimal places
 * - pricePerUnit: Must be positive number, max 8 decimal places
 * - fee: Optional, must be non-negative if provided
 * - date: Must be a valid date, cannot be in the future
 * - notes: Optional string, max 500 characters
 */
export const AddTransactionSchema = z.object({
  type: TransactionTypeSchema,

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .max(1000000000, 'Quantity too large')
    .refine(
      (val) => {
        // Check that number has at most 8 decimal places
        const decimalStr = val.toString().split('.')[1];
        return !decimalStr || decimalStr.length <= 8;
      },
      { message: 'Quantity can have at most 8 decimal places' }
    ),

  pricePerUnit: z
    .number({
      required_error: 'Price per unit is required',
      invalid_type_error: 'Price per unit must be a number',
    })
    .positive('Price per unit must be greater than 0')
    .max(10000000, 'Price per unit too large')
    .refine(
      (val) => {
        const decimalStr = val.toString().split('.')[1];
        return !decimalStr || decimalStr.length <= 8;
      },
      { message: 'Price per unit can have at most 8 decimal places' }
    ),

  fee: z
    .number({
      invalid_type_error: 'Fee must be a number',
    })
    .nonnegative('Fee cannot be negative')
    .max(1000000, 'Fee too large')
    .optional(),

  date: z
    .string({
      required_error: 'Transaction date is required',
    })
    .datetime('Invalid date format')
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        return date <= now;
      },
      { message: 'Transaction date cannot be in the future' }
    ),

  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
}).strict();

/**
 * Schema for transaction query parameters
 */
export const TransactionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100).default(10)),

  sortBy: z
    .enum(['date', 'quantity', 'totalCost', 'type'])
    .optional()
    .default('date'),

  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * Type exports for use in controllers and services
 */
export type AddTransactionInput = z.infer<typeof AddTransactionSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

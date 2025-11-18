import { PrismaClient, Portfolio, Prisma } from '@prisma/client';

/**
 * Portfolio Repository Type
 * Handles all database operations for portfolios
 */
export type PortfolioRepository = {
  findAll: (userId: string) => Promise<Portfolio[]>;
  findAllWithHoldings: (userId: string) => Promise<any>;
  findById: (id: string) => Promise<Portfolio | null>;
  findByIdWithHoldings: (id: string) => Promise<any>;
  findDefaultPortfolio: (userId: string) => Promise<Portfolio | null>;
  create: (data: Prisma.PortfolioCreateInput) => Promise<Portfolio>;
  update: (id: string, data: Prisma.PortfolioUpdateInput) => Promise<Portfolio>;
  delete: (id: string) => Promise<void>;
  setAsDefault: (userId: string, portfolioId: string) => Promise<Portfolio>;
  countByUser: (userId: string) => Promise<number>;
  exists: (id: string) => Promise<boolean>;
  findHoldings: (portfolioId: string) => Promise<any>;
};

/**
 * Create Portfolio Repository
 * Factory function for creating portfolio repository instance
 */
export const createPortfolioRepository = (prisma: PrismaClient): PortfolioRepository => ({
  /**
   * Find all portfolios for a user
   */
  findAll: async (userId: string) => {
    return prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find all portfolios for a user with holdings included
   */
  findAllWithHoldings: async (userId: string) => {
    return prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Find portfolio by ID
   */
  findById: async (id: string) => {
    return prisma.portfolio.findUnique({
      where: { id },
    });
  },

  /**
   * Find portfolio by ID with holdings included
   */
  findByIdWithHoldings: async (id: string) => {
    return prisma.portfolio.findUnique({
      where: { id },
      include: {
        holdings: true,
      },
    });
  },

  /**
   * Find user's default portfolio
   */
  findDefaultPortfolio: async (userId: string) => {
    return prisma.portfolio.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  },

  /**
   * Create a new portfolio
   */
  create: async (data: Prisma.PortfolioCreateInput) => {
    return prisma.portfolio.create({ data });
  },

  /**
   * Update a portfolio
   */
  update: async (id: string, data: Prisma.PortfolioUpdateInput) => {
    return prisma.portfolio.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a portfolio
   */
  delete: async (id: string) => {
    await prisma.portfolio.delete({
      where: { id },
    });
  },

  /**
   * Set a portfolio as default for a user
   * Unsets any other default portfolios for the user
   */
  setAsDefault: async (userId: string, portfolioId: string) => {
    // Use transaction to ensure atomicity
    return prisma.$transaction(async (tx) => {
      // Unset all other defaults for this user
      await tx.portfolio.updateMany({
        where: {
          userId,
          isDefault: true,
          id: { not: portfolioId },
        },
        data: { isDefault: false },
      });

      // Set the specified portfolio as default
      return tx.portfolio.update({
        where: { id: portfolioId },
        data: { isDefault: true },
      });
    });
  },

  /**
   * Count portfolios for a user
   */
  countByUser: async (userId: string) => {
    return prisma.portfolio.count({
      where: { userId },
    });
  },

  /**
   * Check if portfolio exists
   */
  exists: async (id: string) => {
    const count = await prisma.portfolio.count({
      where: { id },
    });
    return count > 0;
  },

  /**
   * Find holdings for a portfolio (helper method)
   */
  findHoldings: async (portfolioId: string) => {
    return prisma.holding.findMany({
      where: { portfolioId },
    });
  },
});

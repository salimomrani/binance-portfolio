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
   * Retrieves all portfolios owned by the specified user, ordered by creation date (newest first)
   *
   * @param userId - The unique identifier of the user
   * @returns Promise<Portfolio[]> - Array of portfolios (empty array if none found)
   * @example
   * const portfolios = await repository.findAll('user-123');
   * console.log(`Found ${portfolios.length} portfolios`);
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
   * Retrieves a single portfolio by its unique identifier
   *
   * @param id - The unique identifier of the portfolio
   * @returns Promise<Portfolio | null> - The portfolio if found, null otherwise
   * @example
   * const portfolio = await repository.findById('portfolio-123');
   * if (portfolio) {
   *   console.log(`Portfolio: ${portfolio.name}`);
   * }
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
   * Creates a new portfolio with the specified data
   *
   * @param data - Portfolio creation data (userId, name, description, isDefault)
   * @returns Promise<Portfolio> - The newly created portfolio
   * @throws {PrismaClientKnownRequestError} - If userId doesn't exist or unique constraint is violated
   * @example
   * const portfolio = await repository.create({
   *   user: { connect: { id: 'user-123' } },
   *   name: 'My Crypto Portfolio',
   *   description: 'Long-term investments',
   *   isDefault: false
   * });
   */
  create: async (data: Prisma.PortfolioCreateInput) => {
    return prisma.portfolio.create({ data });
  },

  /**
   * Update a portfolio
   * Updates an existing portfolio with the provided data
   *
   * @param id - The unique identifier of the portfolio to update
   * @param data - Portfolio update data (partial fields)
   * @returns Promise<Portfolio> - The updated portfolio
   * @throws {PrismaClientKnownRequestError} - If portfolio doesn't exist (P2025)
   * @example
   * const updated = await repository.update('portfolio-123', {
   *   name: 'Updated Name',
   *   description: 'New description'
   * });
   */
  update: async (id: string, data: Prisma.PortfolioUpdateInput) => {
    return prisma.portfolio.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a portfolio
   * Permanently deletes a portfolio and all associated holdings (CASCADE)
   *
   * @param id - The unique identifier of the portfolio to delete
   * @returns Promise<void>
   * @throws {PrismaClientKnownRequestError} - If portfolio doesn't exist (P2025)
   * @example
   * await repository.delete('portfolio-123');
   * console.log('Portfolio deleted');
   */
  delete: async (id: string) => {
    await prisma.portfolio.delete({
      where: { id },
    });
  },

  /**
   * Set a portfolio as default for a user
   * Unsets any other default portfolios for the user and sets the specified portfolio as default
   * Uses a database transaction to ensure atomicity
   *
   * @param userId - The unique identifier of the user
   * @param portfolioId - The unique identifier of the portfolio to set as default
   * @returns Promise<Portfolio> - The updated portfolio (now default)
   * @throws {PrismaClientKnownRequestError} - If portfolio doesn't exist or doesn't belong to user
   * @example
   * const defaultPortfolio = await repository.setAsDefault('user-123', 'portfolio-456');
   * console.log(`${defaultPortfolio.name} is now the default portfolio`);
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

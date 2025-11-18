import { PrismaClient, Portfolio, Prisma } from '@prisma/client';

/**
 * Portfolio Repository
 * Handles all database operations for portfolios
 */
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find all portfolios for a user
   */
  async findAll(userId: string): Promise<Portfolio[]> {
    return this.prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all portfolios for a user with holdings included
   */
  async findAllWithHoldings(userId: string) {
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find portfolio by ID
   */
  async findById(id: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findUnique({
      where: { id },
    });
  }

  /**
   * Find portfolio by ID with holdings included
   */
  async findByIdWithHoldings(id: string) {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: {
        holdings: true,
      },
    });
  }

  /**
   * Find user's default portfolio
   */
  async findDefaultPortfolio(userId: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  /**
   * Create a new portfolio
   */
  async create(data: Prisma.PortfolioCreateInput): Promise<Portfolio> {
    return this.prisma.portfolio.create({ data });
  }

  /**
   * Update a portfolio
   */
  async update(id: string, data: Prisma.PortfolioUpdateInput): Promise<Portfolio> {
    return this.prisma.portfolio.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a portfolio
   */
  async delete(id: string): Promise<void> {
    await this.prisma.portfolio.delete({
      where: { id },
    });
  }

  /**
   * Set a portfolio as default for a user
   * Unsets any other default portfolios for the user
   */
  async setAsDefault(userId: string, portfolioId: string): Promise<Portfolio> {
    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
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
  }

  /**
   * Count portfolios for a user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.portfolio.count({
      where: { userId },
    });
  }

  /**
   * Check if portfolio exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.portfolio.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Find holdings for a portfolio (helper method)
   */
  async findHoldings(portfolioId: string) {
    return this.prisma.holding.findMany({
      where: { portfolioId },
    });
  }
}

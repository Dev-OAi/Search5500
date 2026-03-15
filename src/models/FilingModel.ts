import { PlanData } from '../types';

/**
 * FilingModel provides a modular way to interact with Form 5500 data.
 * It encapsulates normalization and advanced analytics calculations.
 */
export class FilingModel {
  private data: PlanData;

  constructor(data: PlanData) {
    this.data = data;
  }

  get assets() { return this.data.assets; }
  get assetsBoy() { return this.data.assetsBoy; }
  get participants() { return this.data.participantsEoy; }
  get year() { return parseInt(this.data.planYear); }
  get ein() { return this.data.ein; }
  get pn() { return this.data.pn; }
  get planName() { return this.data.planName; }
  get sponsorName() { return this.data.sponsorName; }

  /**
   * Calculates the percentage change in assets for the filing year.
   */
  get assetGrowthRate(): number {
    if (this.data.assetsBoy === 0) return 0;
    return ((this.data.assets - this.data.assetsBoy) / this.data.assetsBoy) * 100;
  }

  /**
   * Advanced metric: Assets per participant.
   * Useful for benchmarking plan health.
   */
  get assetsPerParticipant(): number {
    if (this.data.participantsEoy === 0) return 0;
    return this.data.assets / this.data.participantsEoy;
  }

  /**
   * Helper to format values for display
   */
  get formattedAssets(): string {
    return `$${(this.data.assets / 1000000).toFixed(2)}M`;
  }

  // New financial metrics
  get totalIncome() { return this.data.totalIncome || 0; }
  get totalExpenses() { return this.data.totalExpenses || 0; }
  get employerContributions() { return this.data.employerContributions || 0; }

  get expenseRatio(): number {
    if (this.data.assets === 0) return 0;
    return (this.totalExpenses / this.data.assets) * 100;
  }
}

/**
 * AnalyticsService handles calculations across multiple filings (e.g., trends).
 */
export class AnalyticsService {
  /**
   * Computes the Compound Annual Growth Rate (CAGR) for assets.
   * Formula: [(End Value / Start Value)^(1 / Number of Years)] - 1
   */
  static calculateAssetCAGR(filings: FilingModel[]): number {
    if (filings.length < 2) return 0;

    const sorted = [...filings].sort((a, b) => a.year - b.year);
    const start = sorted[0];
    const end = sorted[sorted.length - 1];

    const years = end.year - start.year;
    if (years <= 0 || start.assets <= 0) return 0;

    return (Math.pow(end.assets / start.assets, 1 / years) - 1) * 100;
  }

  /**
   * Performs a simple linear regression to predict future values.
   * returns { slope, intercept }
   */
  static linearRegression(x: number[], y: number[]) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }
}

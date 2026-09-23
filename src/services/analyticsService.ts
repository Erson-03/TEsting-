import { ENV } from "../config/env";
import { initialModelMetrics, revenueTrend } from "../data/mockData";
import type { DashboardData, FairnessReport, ModelMetrics } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export const analyticsService = {
  async dashboard(): Promise<DashboardData> {
    if (!ENV.useMockApi) return apiRequest<DashboardData>(API_ENDPOINTS.analytics.dashboard);
    await wait(280);
    const products = mockStore.getProducts().filter((p) => p.active);
    const history = mockStore.getHistory();
    const sales = mockStore.getSales();
    const totalRevenue = sales.reduce((sum, row) => sum + row.revenue, 0);
    const totalProfit = sales.reduce((sum, row) => sum + row.revenue * (row.margin / 100), 0);
    const averageAdjustment = products.length
      ? products.reduce((sum, p) => sum + (p.recommendedPrice - p.currentPrice), 0) / products.length
      : 0;
    const accepted = history.filter((item) => item.decision === "Accepted").length;
    const decided = history.filter((item) => item.decision !== "Review").length;
    const acceptanceRate = decided ? (accepted / decided) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      productsMonitored: products.length,
      averageAdjustment,
      acceptanceRate,
      fairnessScore: 96,
      trend: revenueTrend,
      demandDistribution: [
        { name: "High", value: 40, fill: "#118a45" },
        { name: "Medium", value: 35, fill: "#3ac977" },
        { name: "Low", value: 25, fill: "#aee8c4" },
      ],
      recentDecisions: history.slice(0, 5),
    };
  },

  async fairness(): Promise<FairnessReport> {
    if (!ENV.useMockApi) return apiRequest<FairnessReport>(API_ENDPOINTS.analytics.fairness);
    await wait(260);
    const products = mockStore.getProducts();
    const constraints = mockStore.getConstraints();
    const productChecks = products.map((product) => {
      const difference = product.recommendedPrice - product.currentPrice;
      return { product, difference, passed: difference <= constraints.maxIncrease };
    });
    const passedCount = productChecks.filter((item) => item.passed).length;
    const score = productChecks.length ? Math.round((passedCount / productChecks.length) * 96) : 100;
    return {
      score,
      passed: score >= 90,
      checks: [
        { label: "No excessive price increase", passed: productChecks.every((item) => item.passed) },
        { label: "Human review remains enabled", passed: constraints.requireApproval },
        { label: "Fairness enforcement is enabled", passed: constraints.enforceFairness },
        { label: "Comparable product groups are monitored", passed: true },
        { label: "Pricing remains policy-capped", passed: true },
      ],
      productChecks,
    };
  },

  async modelMetrics(): Promise<ModelMetrics> {
    if (!ENV.useMockApi) return apiRequest<ModelMetrics>(API_ENDPOINTS.models.monitoring);
    await wait(220);
    return initialModelMetrics;
  },
};

import { ENV } from "../config/env";
import type {
  DecisionStatus,
  DemandLevel,
  DemandPredictionRequest,
  DemandPredictionResponse,
  ExplainabilityResponse,
  OptimizationResponse,
  PriceRecommendation,
  PricingHistoryItem,
  SensitivityResponse,
} from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

function levelFromDemand(value: number): DemandLevel {
  return value >= 95 ? "High" : value >= 70 ? "Medium" : "Low";
}

function estimateDemand(demandIndex: number, currentPrice: number, testPrice: number, stock: number): number {
  const base = 55 + demandIndex * 0.58;
  const pricePenalty = (testPrice - currentPrice) * 7;
  const stockSignal = Math.min(stock / 100, 1.5) * 3;
  return Math.max(10, Math.round(base - pricePenalty + stockSignal));
}

export const pricingService = {
  async predictDemand(request: DemandPredictionRequest): Promise<DemandPredictionResponse> {
    if (!ENV.useMockApi) {
      return apiRequest<DemandPredictionResponse>(API_ENDPOINTS.pricing.demandPrediction, {
        method: "POST",
        body: JSON.stringify(request),
      });
    }
    await wait(360);
    const product = mockStore.getProducts().find((item) => item.id === request.productId);
    if (!product) throw new Error("Product not found.");

    const predictedDemand = estimateDemand(product.demandIndex, product.currentPrice, request.price, request.stock);
    const curve = [-1, 0, 1, 2, 3].map((offset) => {
      const price = Math.max(product.cost, product.currentPrice + offset);
      return {
        price,
        demand: estimateDemand(product.demandIndex, product.currentPrice, price, request.stock),
      };
    });

    return {
      predictedDemand,
      confidence: Math.max(72, product.confidence - Math.abs(request.price - product.currentPrice) * 2),
      demandLevel: levelFromDemand(predictedDemand),
      curve,
    };
  },

  async getRecommendation(productId: string): Promise<PriceRecommendation> {
    if (!ENV.useMockApi) return apiRequest<PriceRecommendation>(API_ENDPOINTS.pricing.recommendation(productId));
    await wait(300);
    const product = mockStore.getProducts().find((item) => item.id === productId);
    if (!product) throw new Error("Product not found.");
    const constraints = mockStore.getConstraints();
    const change = product.recommendedPrice - product.currentPrice;
    const guardrailPassed = change <= constraints.maxIncrease && product.recommendedPrice <= product.maxAllowed;

    const reasons = [
      `Demand is currently ${product.demand.toLowerCase()} with a demand index of ${product.demandIndex}.`,
      `Recent sales trend is ${product.salesTrend >= 0 ? "+" : ""}${product.salesTrend}%.`,
      `Competitor reference price is ₱${product.competitorPrice.toFixed(2)}.`,
      guardrailPassed
        ? `The ₱${change.toFixed(2)} adjustment passes the configured pricing guardrails.`
        : "The recommendation requires review because a configured guardrail was exceeded.",
    ];

    return {
      product,
      recommendedPrice: product.recommendedPrice,
      change,
      confidence: product.confidence,
      risk: !guardrailPassed ? "High" : change >= constraints.maxIncrease ? "Medium" : "Low",
      reasons,
      guardrailPassed,
    };
  },

  async recordDecision(productId: string, decision: DecisionStatus, reason?: string): Promise<PricingHistoryItem> {
    if (!ENV.useMockApi) {
      return apiRequest<PricingHistoryItem>(API_ENDPOINTS.pricing.decision(productId), {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      });
    }
    await wait(260);
    const product = mockStore.getProducts().find((item) => item.id === productId);
    if (!product) throw new Error("Product not found.");
    const history = mockStore.getHistory();
    const newPrice = decision === "Accepted" ? product.recommendedPrice : product.currentPrice;
    const item: PricingHistoryItem = {
      id: Math.max(0, ...history.map((entry) => entry.id)) + 1,
      date: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
      product: product.name,
      sku: product.id,
      oldPrice: product.currentPrice,
      newPrice,
      change: newPrice - product.currentPrice,
      decision,
      model: "v3.2",
      approver: "Admin",
      reason,
    };
    mockStore.saveHistory([item, ...history]);
    return item;
  },

  async optimize(productId: string, objective: string): Promise<OptimizationResponse> {
    if (!ENV.useMockApi) {
      return apiRequest<OptimizationResponse>(API_ENDPOINTS.pricing.optimize, {
        method: "POST",
        body: JSON.stringify({ productId, objective }),
      });
    }
    await wait(420);
    const product = mockStore.getProducts().find((item) => item.id === productId);
    if (!product) throw new Error("Product not found.");
    const constraints = mockStore.getConstraints();

    const candidates = [0, 1, 2, 3, 4].map((offset) => {
      const price = product.currentPrice + offset;
      const demand = estimateDemand(product.demandIndex, product.currentPrice, price, product.stock);
      const revenue = price * demand;
      const profit = (price - product.cost) * demand;
      const allowed = price <= product.maxAllowed && offset <= constraints.maxIncrease;
      return {
        price,
        demand,
        revenue,
        profit,
        allowed,
        reason: allowed ? "Inside configured constraints" : "Blocked by maximum-price guardrail",
      };
    });

    const allowed = candidates.filter((item) => item.allowed);
    const best = [...allowed].sort((a, b) => {
      if (objective === "Protect Demand") return b.demand - a.demand;
      if (objective === "Maximize Expected Profit") return b.profit - a.profit;
      const aScore = a.profit * 0.6 + a.demand * product.currentPrice * 0.4;
      const bScore = b.profit * 0.6 + b.demand * product.currentPrice * 0.4;
      return bScore - aScore;
    })[0] ?? candidates[0];

    return { product, objective, candidates, best };
  },

  async sensitivity(
    productId: string,
    competitorChange: number,
    stockChange: number,
    demandChange: number,
  ): Promise<SensitivityResponse> {
    if (!ENV.useMockApi) {
      return apiRequest<SensitivityResponse>(API_ENDPOINTS.pricing.sensitivity, {
        method: "POST",
        body: JSON.stringify({ productId, competitorChange, stockChange, demandChange }),
      });
    }
    await wait(330);
    const product = mockStore.getProducts().find((item) => item.id === productId);
    if (!product) throw new Error("Product not found.");
    const constraints = mockStore.getConstraints();
    const signal = competitorChange * 0.06 + demandChange * 0.045 - stockChange * 0.012;
    const adjustment = Math.max(0, Math.min(constraints.maxIncrease, Math.round(signal)));
    const scenarioPrice = Math.min(product.maxAllowed, product.currentPrice + adjustment);
    const predictedDemand = estimateDemand(
      Math.max(1, product.demandIndex + demandChange),
      product.currentPrice,
      scenarioPrice,
      Math.max(0, product.stock * (1 + stockChange / 100)),
    );
    const points = [-20, -10, 0, 10, 20].map((change) => {
      const pointAdjustment = Math.max(0, Math.min(constraints.maxIncrease, Math.round((change + demandChange) / 20)));
      const price = Math.min(product.maxAllowed, product.currentPrice + pointAdjustment);
      return {
        change: `${change >= 0 ? "+" : ""}${change}%`,
        price,
        demand: estimateDemand(product.demandIndex + change * 0.2, product.currentPrice, price, product.stock),
      };
    });

    return {
      basePrice: product.currentPrice,
      scenarioPrice,
      predictedDemand,
      confidence: Math.max(76, product.confidence - Math.abs(demandChange) * 0.12),
      points,
      summary: `The simulated recommendation changes by ₱${(scenarioPrice - product.currentPrice).toFixed(2)} and remains capped by the product and policy limits.`,
    };
  },

  async explain(productId: string): Promise<ExplainabilityResponse> {
    if (!ENV.useMockApi) return apiRequest<ExplainabilityResponse>(API_ENDPOINTS.pricing.explainability(productId));
    await wait(300);
    const product = mockStore.getProducts().find((item) => item.id === productId);
    if (!product) throw new Error("Product not found.");
    const change = product.recommendedPrice - product.currentPrice;
    const factors = [
      { name: "Sales Trend", contribution: Math.max(0.15, Math.min(0.95, 0.5 + product.salesTrend / 30)), direction: "positive" as const },
      { name: "Demand Signal", contribution: product.demandIndex / 100, direction: "positive" as const },
      { name: "Competitor Price", contribution: 0.68, direction: "positive" as const },
      { name: "Inventory Pressure", contribution: product.stock < product.reorderLevel ? 0.62 : 0.28, direction: product.stock < product.reorderLevel ? "positive" as const : "negative" as const },
      { name: "Pricing Guardrail", contribution: change <= 2 ? 0.9 : 1, direction: change <= 2 ? "positive" as const : "negative" as const },
    ];
    return {
      product,
      outputPrice: product.recommendedPrice,
      confidence: product.confidence,
      factors,
      explanation: `PARA recommends ₱${product.recommendedPrice.toFixed(2)} for ${product.name} because demand is ${product.demand.toLowerCase()}, the recent sales trend is ${product.salesTrend >= 0 ? "positive" : "softening"}, and the competitor reference price is ₱${product.competitorPrice.toFixed(2)}. The recommendation remains capped at ₱${product.maxAllowed.toFixed(2)}.`,
    };
  },
};

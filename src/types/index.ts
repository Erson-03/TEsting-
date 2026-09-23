/* Shared domain types. Keeping these centralized makes the UI easier
   to connect to a Python/Node backend later. */

export type DemandLevel = "High" | "Medium" | "Low";
export type DecisionStatus = "Accepted" | "Rejected" | "Kept" | "Review";
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";
export type PricingRisk = "Low" | "Medium" | "High";

export interface Product {
  id: string;
  name: string;
  category: string;
  cost: number;
  currentPrice: number;
  recommendedPrice: number;
  maxAllowed: number;
  stock: number;
  reorderLevel: number;
  demand: DemandLevel;
  demandIndex: number;
  confidence: number;
  competitorPrice: number;
  salesTrend: number;
  active: boolean;
}

export interface PricingHistoryItem {
  id: number;
  date: string;
  product: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  decision: DecisionStatus;
  model: string;
  approver: string;
  reason?: string;
}

export interface SalesRow {
  id: number;
  date: string;
  product: string;
  sku: string;
  units: number;
  revenue: number;
  margin: number;
}

export interface ModelMetrics {
  version: string;
  accuracy: number;
  mae: number;
  rmse: number;
  dataDrift: number;
  modelDrift: number;
  approvalRate: number;
  constraintCompliance: number;
  lastUpdated: string;
  status: "Healthy" | "Watch" | "Degraded";
}

export interface PricingConstraints {
  maxIncrease: number;
  enforceSrp: boolean;
  enforceFairness: boolean;
  requireApproval: boolean;
  minimumMargin: number;
}

export interface AppSettings {
  currency: "PHP";
  recommendationAlerts: boolean;
  limitAlerts: boolean;
  weeklySummary: boolean;
  compactTables: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Analyst";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface DashboardData {
  totalRevenue: number;
  totalProfit: number;
  productsMonitored: number;
  averageAdjustment: number;
  acceptanceRate: number;
  fairnessScore: number;
  trend: Array<{ day: string; revenue: number; units: number; profit: number }>;
  demandDistribution: Array<{ name: DemandLevel; value: number; fill: string }>;
  recentDecisions: PricingHistoryItem[];
}

export interface DemandPredictionRequest {
  productId: string;
  price: number;
  stock: number;
  competitorPrice: number;
}

export interface DemandPredictionResponse {
  predictedDemand: number;
  confidence: number;
  demandLevel: DemandLevel;
  curve: Array<{ price: number; demand: number }>;
}

export interface PriceRecommendation {
  product: Product;
  recommendedPrice: number;
  change: number;
  confidence: number;
  risk: PricingRisk;
  reasons: string[];
  guardrailPassed: boolean;
}

export interface OptimizationCandidate {
  price: number;
  demand: number;
  revenue: number;
  profit: number;
  allowed: boolean;
  reason?: string;
}

export interface OptimizationResponse {
  product: Product;
  objective: string;
  candidates: OptimizationCandidate[];
  best: OptimizationCandidate;
}

export interface SensitivityResponse {
  basePrice: number;
  scenarioPrice: number;
  predictedDemand: number;
  confidence: number;
  points: Array<{ change: string; price: number; demand: number }>;
  summary: string;
}

export interface FairnessReport {
  score: number;
  passed: boolean;
  checks: Array<{ label: string; passed: boolean }>;
  productChecks: Array<{ product: Product; difference: number; passed: boolean }>;
}

export interface ExplainabilityFactor {
  name: string;
  contribution: number;
  direction: "positive" | "negative";
}

export interface ExplainabilityResponse {
  product: Product;
  outputPrice: number;
  confidence: number;
  factors: ExplainabilityFactor[];
  explanation: string;
}

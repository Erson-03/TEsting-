import type {
  AppSettings,
  ModelMetrics,
  PricingConstraints,
  PricingHistoryItem,
  Product,
  SalesRow,
} from "../types";

/* Seed data used only when VITE_USE_MOCK_API=true. */
export const initialProducts: Product[] = [
  { id:"SKU001", name:"Bottled Water", category:"Beverages", cost:16, currentPrice:20, recommendedPrice:21, maxAllowed:22, stock:37, reorderLevel:30, demand:"High", demandIndex:86, confidence:94, competitorPrice:21, salesTrend:12, active:true },
  { id:"SKU002", name:"Coffee", category:"Beverages", cost:29, currentPrice:35, recommendedPrice:36, maxAllowed:37, stock:82, reorderLevel:35, demand:"Medium", demandIndex:68, confidence:91, competitorPrice:36, salesTrend:7, active:true },
  { id:"SKU003", name:"Bread", category:"Food", cost:37, currentPrice:45, recommendedPrice:45, maxAllowed:47, stock:120, reorderLevel:50, demand:"Low", demandIndex:45, confidence:88, competitorPrice:45, salesTrend:-3, active:true },
  { id:"SKU004", name:"Milk", category:"Dairy", cost:61, currentPrice:70, recommendedPrice:71, maxAllowed:72, stock:24, reorderLevel:30, demand:"High", demandIndex:89, confidence:93, competitorPrice:71, salesTrend:10, active:true },
  { id:"SKU005", name:"Eggs", category:"Dairy", cost:4.5, currentPrice:6, recommendedPrice:6, maxAllowed:8, stock:200, reorderLevel:75, demand:"Low", demandIndex:38, confidence:90, competitorPrice:6, salesTrend:1, active:true },
  { id:"SKU006", name:"Instant Noodles", category:"Food", cost:12, currentPrice:15, recommendedPrice:16, maxAllowed:17, stock:68, reorderLevel:40, demand:"Medium", demandIndex:72, confidence:89, competitorPrice:16, salesTrend:5, active:true },
  { id:"SKU007", name:"Canned Tuna", category:"Food", cost:31, currentPrice:38, recommendedPrice:39, maxAllowed:40, stock:44, reorderLevel:35, demand:"Medium", demandIndex:65, confidence:90, competitorPrice:39, salesTrend:4, active:true },
  { id:"SKU008", name:"Orange Juice", category:"Beverages", cost:48, currentPrice:58, recommendedPrice:59, maxAllowed:60, stock:29, reorderLevel:25, demand:"High", demandIndex:81, confidence:92, competitorPrice:59, salesTrend:9, active:true },
];

export const initialPricingHistory: PricingHistoryItem[] = [
  { id:1, date:"Sep 15, 2026", product:"Bottled Water", sku:"SKU001", oldPrice:20, newPrice:21, change:1, decision:"Accepted", model:"v3.2", approver:"Admin", reason:"High demand with responsible +₱1 adjustment." },
  { id:2, date:"Sep 15, 2026", product:"Coffee", sku:"SKU002", oldPrice:35, newPrice:36, change:1, decision:"Accepted", model:"v3.2", approver:"Admin", reason:"Stable demand and competitor alignment." },
  { id:3, date:"Sep 14, 2026", product:"Bread", sku:"SKU003", oldPrice:45, newPrice:46, change:1, decision:"Rejected", model:"v3.2", approver:"Admin", reason:"Demand was too soft for an increase." },
  { id:4, date:"Sep 14, 2026", product:"Milk", sku:"SKU004", oldPrice:70, newPrice:72, change:2, decision:"Accepted", model:"v3.1", approver:"Admin", reason:"Low stock and strong demand." },
  { id:5, date:"Sep 13, 2026", product:"Eggs", sku:"SKU005", oldPrice:6, newPrice:6, change:0, decision:"Kept", model:"v3.1", approver:"Admin", reason:"High stock and low demand." },
];

export const initialSalesRows: SalesRow[] = [
  { id:1, date:"Sep 15, 2026", product:"Bottled Water", sku:"SKU001", units:186, revenue:3906, margin:24.1 },
  { id:2, date:"Sep 15, 2026", product:"Coffee", sku:"SKU002", units:82, revenue:2952, margin:19.4 },
  { id:3, date:"Sep 15, 2026", product:"Bread", sku:"SKU003", units:65, revenue:2925, margin:17.8 },
  { id:4, date:"Sep 15, 2026", product:"Milk", sku:"SKU004", units:47, revenue:3337, margin:14.1 },
  { id:5, date:"Sep 15, 2026", product:"Eggs", sku:"SKU005", units:124, revenue:744, margin:25.0 },
  { id:6, date:"Sep 14, 2026", product:"Instant Noodles", sku:"SKU006", units:96, revenue:1536, margin:22.0 },
];

export const revenueTrend = [
  { day:"Sep 9", revenue:11800, units:82, profit:980 },
  { day:"Sep 10", revenue:14300, units:96, profit:1080 },
  { day:"Sep 11", revenue:13750, units:94, profit:1010 },
  { day:"Sep 12", revenue:17450, units:128, profit:1195 },
  { day:"Sep 13", revenue:19700, units:142, profit:1280 },
  { day:"Sep 14", revenue:20550, units:153, profit:1340 },
  { day:"Sep 15", revenue:24120, units:186, profit:1510 },
];

export const initialModelMetrics: ModelMetrics = {
  version:"v3.2",
  accuracy:92.4,
  mae:0.73,
  rmse:7.31,
  dataDrift:2.1,
  modelDrift:1.4,
  approvalRate:87,
  constraintCompliance:100,
  lastUpdated:"Sep 15, 2026",
  status:"Healthy",
};

export const initialConstraints: PricingConstraints = {
  maxIncrease:2,
  enforceSrp:true,
  enforceFairness:true,
  requireApproval:true,
  minimumMargin:8,
};

export const initialSettings: AppSettings = {
  currency:"PHP",
  recommendationAlerts:true,
  limitAlerts:true,
  weeklySummary:true,
  compactTables:false,
};

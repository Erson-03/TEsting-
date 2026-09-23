/**
 * Single source of truth for backend routes used by the frontend.
 * If your backend route changes, update it here instead of editing pages.
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
  },
  assistant: {
    chat: "/assistant/chat",
  },
  products: {
    list: "/products",
    detail: (id: string) => `/products/${encodeURIComponent(id)}`,
  },
  inventory: {
    adjust: (id: string) => `/inventory/${encodeURIComponent(id)}/adjust`,
  },
  sales: {
    list: "/sales",
    import: "/sales/import",
  },
  analytics: {
    dashboard: "/analytics/dashboard",
    fairness: "/analytics/fairness",
  },
  pricing: {
    demandPrediction: "/pricing/demand-prediction",
    recommendation: (productId: string) => `/pricing/recommendations/${encodeURIComponent(productId)}`,
    decision: (productId: string) => `/pricing/recommendations/${encodeURIComponent(productId)}/decision`,
    optimize: "/pricing/optimize",
    sensitivity: "/pricing/sensitivity",
    explainability: (productId: string) => `/pricing/explainability/${encodeURIComponent(productId)}`,
    history: "/pricing/history",
  },
  models: {
    monitoring: "/models/monitoring",
  },
  settings: {
    pricingConstraints: "/settings/pricing-constraints",
    preferences: "/settings/preferences",
  },
} as const;

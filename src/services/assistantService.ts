import { ENV } from "../config/env";
import { initialModelMetrics, revenueTrend } from "../data/mockData";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantRequest = {
  message: string;
  page: string;
  history?: AssistantChatMessage[];
};

export type AssistantResponse = {
  message: string;
  suggestions?: string[];
};

const formatPeso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);

/**
 * Lightweight frontend fallback for PARA AI.
 * This keeps the assistant usable during frontend development while preserving
 * a clean API boundary for a future real assistant/backend model.
 */
function buildMockReply(request: AssistantRequest): AssistantResponse {
  const q = request.message.trim().toLowerCase();
  const products = mockStore.getProducts();
  const constraints = mockStore.getConstraints();
  const history = mockStore.getHistory();
  const latestTrend = revenueTrend.at(-1);

  const namedProduct = products.find((product) =>
    q.includes(product.name.toLowerCase()) || q.includes(product.id.toLowerCase()),
  );

  if (q.includes("low stock") || q.includes("reorder") || q.includes("inventory risk")) {
    const lowStock = products.filter((product) => product.stock <= product.reorderLevel);
    const summary = lowStock.length
      ? lowStock.map((product) => `${product.name} (${product.stock} units)`).join(", ")
      : "No products are currently below their reorder level";

    return {
      message: `Inventory check: ${summary}. Open Inventory for stock adjustments and reorder details.`,
      suggestions: ["Open Inventory", "Which product has highest demand?", "Check pricing limits"],
    };
  }

  if (namedProduct && (q.includes("why") || q.includes("recommend") || q.includes("price"))) {
    const change = namedProduct.recommendedPrice - namedProduct.currentPrice;
    return {
      message: `${namedProduct.name} is currently ${formatPeso(namedProduct.currentPrice)} and the demo recommendation is ${formatPeso(namedProduct.recommendedPrice)} (${change >= 0 ? "+" : ""}${formatPeso(change)}). Its demand is ${namedProduct.demand.toLowerCase()}, confidence is ${namedProduct.confidence}%, stock is ${namedProduct.stock} units, and the recommendation remains at or below the configured maximum of ${formatPeso(namedProduct.maxAllowed)}.`,
      suggestions: ["Is this recommendation fair?", "Show demand prediction", "Open Price Recommendation"],
    };
  }

  if (q.includes("fair") || q.includes("responsible") || q.includes("constraint") || q.includes("limit")) {
    return {
      message: `The current frontend policy allows a maximum increase of ${formatPeso(constraints.maxIncrease)} per item. SRP enforcement is ${constraints.enforceSrp ? "on" : "off"}, fairness enforcement is ${constraints.enforceFairness ? "on" : "off"}, and human approval is ${constraints.requireApproval ? "required" : "not required"}. These guardrails are checked before a pricing decision is approved.`,
      suggestions: ["Open Constraint Center", "Show fairness status", "Why require human approval?"],
    };
  }

  if (q.includes("fairness")) {
    return {
      message: "The demo fairness monitor checks excessive increases, policy compliance, comparable treatment across product groups, and human approval. Current demo pricing decisions are within the configured responsible-pricing rules.",
      suggestions: ["Open Fairness Monitor", "Check pricing limits", "Explain a recommendation"],
    };
  }

  if (q.includes("model") || q.includes("accuracy") || q.includes("drift") || q.includes("mae")) {
    return {
      message: `Model monitoring reports version ${initialModelMetrics.version}, ${initialModelMetrics.accuracy}% accuracy, MAE ${initialModelMetrics.mae}, data drift ${initialModelMetrics.dataDrift}%, model drift ${initialModelMetrics.modelDrift}%, and ${initialModelMetrics.constraintCompliance}% constraint compliance. Status: ${initialModelMetrics.status}.`,
      suggestions: ["Open Model Monitoring", "What does model drift mean?", "Explain confidence"],
    };
  }

  if (q.includes("revenue") || q.includes("sales") || q.includes("performance")) {
    return {
      message: latestTrend
        ? `Latest demo analytics show ${formatPeso(latestTrend.revenue)} revenue, ${latestTrend.units} units sold, and ${formatPeso(latestTrend.profit)} profit for ${latestTrend.day}. Use Sales Data or Dashboard for the full trend.`
        : "No revenue trend data is available in the demo dataset.",
      suggestions: ["Open Sales Data", "Open Dashboard", "Which products are high demand?"],
    };
  }

  if (q.includes("high demand") || q.includes("highest demand") || q.includes("demand")) {
    const ranked = [...products].sort((a, b) => b.demandIndex - a.demandIndex).slice(0, 3);
    return {
      message: `Highest demand signals in the current demo are ${ranked.map((p) => `${p.name} (${p.demandIndex})`).join(", ")}. Use Demand Prediction to test how candidate prices could affect expected demand.`,
      suggestions: ["Open Demand Prediction", "Why did Bottled Water increase?", "Show low stock products"],
    };
  }

  if (q.includes("history") || q.includes("approved") || q.includes("rejected")) {
    const accepted = history.filter((item) => item.decision === "Accepted").length;
    const rejected = history.filter((item) => item.decision === "Rejected").length;
    return {
      message: `The current demo audit trail contains ${history.length} pricing decisions: ${accepted} accepted, ${rejected} rejected, and ${history.length - accepted - rejected} kept/other. Pricing History shows model version, approver, reason, and price change.`,
      suggestions: ["Open Pricing History", "Why keep audit history?", "Show fairness status"],
    };
  }

  if (q.includes("help") || q.includes("what can you do") || q.includes("features")) {
    return {
      message: "I can explain price recommendations, summarize demand and sales signals, identify low-stock items, describe pricing guardrails, review fairness/model status, and take you to the relevant PARA screen. I use the same frontend demo data as the system while mock mode is enabled.",
      suggestions: ["Why did Bottled Water increase?", "Show low stock products", "Is the current pricing fair?"],
    };
  }

  return {
    message: `I can help with PARA's pricing, demand, inventory, fairness, model monitoring, sales, and audit data. You are currently on ${request.page}. Try asking why a product price changed, which items are low in stock, or whether a recommendation is within policy.`,
    suggestions: ["Why did Bottled Water increase?", "Show low stock products", "How is the model performing?"],
  };
}

export const assistantService = {
  async ask(request: AssistantRequest): Promise<AssistantResponse> {
    if (ENV.useMockApi) {
      await wait(380);
      return buildMockReply(request);
    }

    return apiRequest<AssistantResponse>(API_ENDPOINTS.assistant.chat, {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

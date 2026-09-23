import { ENV } from "../config/env";
import type { PricingHistoryItem } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export const historyService = {
  async list(): Promise<PricingHistoryItem[]> {
    if (!ENV.useMockApi) return apiRequest<PricingHistoryItem[]>(API_ENDPOINTS.pricing.history);
    await wait(220);
    return mockStore.getHistory();
  },
};

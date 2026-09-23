import { ENV } from "../config/env";
import type { AppSettings, PricingConstraints } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export const settingsService = {
  async getConstraints(): Promise<PricingConstraints> {
    if (!ENV.useMockApi) return apiRequest<PricingConstraints>(API_ENDPOINTS.settings.pricingConstraints);
    await wait(150);
    return mockStore.getConstraints();
  },

  async saveConstraints(value: PricingConstraints): Promise<PricingConstraints> {
    if (!ENV.useMockApi) {
      return apiRequest<PricingConstraints>(API_ENDPOINTS.settings.pricingConstraints, {
        method: "PUT",
        body: JSON.stringify(value),
      });
    }
    await wait(300);
    return mockStore.saveConstraints(value);
  },

  async getAppSettings(): Promise<AppSettings> {
    if (!ENV.useMockApi) return apiRequest<AppSettings>(API_ENDPOINTS.settings.preferences);
    await wait(150);
    return mockStore.getSettings();
  },

  async saveAppSettings(value: AppSettings): Promise<AppSettings> {
    if (!ENV.useMockApi) {
      return apiRequest<AppSettings>(API_ENDPOINTS.settings.preferences, {
        method: "PUT",
        body: JSON.stringify(value),
      });
    }
    await wait(300);
    return mockStore.saveSettings(value);
  },

  async resetDemoData(): Promise<void> {
    if (!ENV.useMockApi) throw new Error("Reset is only available while using the mock API.");
    await wait(180);
    mockStore.reset();
  },
};

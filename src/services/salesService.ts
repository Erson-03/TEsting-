import { ENV } from "../config/env";
import type { SalesRow } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export const salesService = {
  async list(): Promise<SalesRow[]> {
    if (!ENV.useMockApi) return apiRequest<SalesRow[]>(API_ENDPOINTS.sales.list);
    await wait(220);
    return mockStore.getSales();
  },

  async importRows(rows: Omit<SalesRow, "id">[]): Promise<SalesRow[]> {
    if (!ENV.useMockApi) {
      return apiRequest<SalesRow[]>(API_ENDPOINTS.sales.import, {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
    }
    await wait(380);
    const existing = mockStore.getSales();
    let nextId = Math.max(0, ...existing.map((row) => row.id)) + 1;
    const inserted = rows.map((row) => ({ ...row, id: nextId++ }));
    mockStore.saveSales([...inserted, ...existing]);
    return inserted;
  },
};

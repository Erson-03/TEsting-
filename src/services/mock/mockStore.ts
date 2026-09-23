import {
  initialConstraints,
  initialPricingHistory,
  initialProducts,
  initialSalesRows,
  initialSettings,
} from "../../data/mockData";
import type {
  AppSettings,
  PricingConstraints,
  PricingHistoryItem,
  Product,
  SalesRow,
} from "../../types";

/* ---------------------------------------------------------
   Tiny browser-side mock database.
   It deliberately mirrors what a backend repository/service
   would do, which keeps page components free from localStorage.
   --------------------------------------------------------- */

const KEYS = {
  products: "para.mock.products",
  history: "para.mock.history",
  sales: "para.mock.sales",
  constraints: "para.mock.constraints",
  settings: "para.mock.settings",
};

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return structuredClone(fallback);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return structuredClone(fallback);
  }
}

function write<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function wait(ms = 220): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export const mockStore = {
  getProducts(): Product[] {
    return read(KEYS.products, initialProducts);
  },

  saveProducts(products: Product[]): Product[] {
    return write(KEYS.products, products);
  },

  getHistory(): PricingHistoryItem[] {
    return read(KEYS.history, initialPricingHistory);
  },

  saveHistory(items: PricingHistoryItem[]): PricingHistoryItem[] {
    return write(KEYS.history, items);
  },

  getSales(): SalesRow[] {
    return read(KEYS.sales, initialSalesRows);
  },

  saveSales(items: SalesRow[]): SalesRow[] {
    return write(KEYS.sales, items);
  },

  getConstraints(): PricingConstraints {
    return read(KEYS.constraints, initialConstraints);
  },

  saveConstraints(value: PricingConstraints): PricingConstraints {
    return write(KEYS.constraints, value);
  },

  getSettings(): AppSettings {
    return read(KEYS.settings, initialSettings);
  },

  saveSettings(value: AppSettings): AppSettings {
    return write(KEYS.settings, value);
  },

  reset(): void {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

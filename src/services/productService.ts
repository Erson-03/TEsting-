import { ENV } from "../config/env";
import type { Product } from "../types";
import { apiRequest } from "./api/client";
import { API_ENDPOINTS } from "./api/endpoints";
import { mockStore, wait } from "./mock/mockStore";

export type ProductInput = Omit<Product, "id" | "confidence" | "recommendedPrice" | "demandIndex" | "salesTrend"> & {
  id?: string;
};

export const productService = {
  async list(): Promise<Product[]> {
    if (!ENV.useMockApi) return apiRequest<Product[]>(API_ENDPOINTS.products.list);
    await wait();
    return mockStore.getProducts();
  },

  async get(id: string): Promise<Product> {
    if (!ENV.useMockApi) return apiRequest<Product>(API_ENDPOINTS.products.detail(id));
    await wait(120);
    const product = mockStore.getProducts().find((item) => item.id === id);
    if (!product) throw new Error("Product not found.");
    return product;
  },

  async create(input: ProductInput): Promise<Product> {
    if (!ENV.useMockApi) {
      return apiRequest<Product>(API_ENDPOINTS.products.list, { method: "POST", body: JSON.stringify(input) });
    }
    await wait();
    const products = mockStore.getProducts();
    const numeric = products.reduce((max, p) => Math.max(max, Number(p.id.replace(/\D/g, "")) || 0), 0) + 1;
    const product: Product = {
      ...input,
      id: input.id?.trim() || `SKU${String(numeric).padStart(3, "0")}`,
      recommendedPrice: input.currentPrice,
      confidence: 0,
      demandIndex: 50,
      salesTrend: 0,
    };
    mockStore.saveProducts([product, ...products]);
    return product;
  },

  async update(id: string, patch: Partial<Product>): Promise<Product> {
    if (!ENV.useMockApi) {
      return apiRequest<Product>(API_ENDPOINTS.products.detail(id), { method: "PATCH", body: JSON.stringify(patch) });
    }
    await wait();
    const products = mockStore.getProducts();
    const index = products.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Product not found.");
    const updated = { ...products[index], ...patch, id };
    products[index] = updated;
    mockStore.saveProducts(products);
    return updated;
  },

  async adjustStock(id: string, delta: number): Promise<Product> {
    if (!ENV.useMockApi) {
      return apiRequest<Product>(API_ENDPOINTS.inventory.adjust(id), {
        method: "POST",
        body: JSON.stringify({ delta }),
      });
    }
    const product = await this.get(id);
    return this.update(id, { stock: Math.max(0, product.stock + delta) });
  },
};

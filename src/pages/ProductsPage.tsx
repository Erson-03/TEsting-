import { Edit3, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { productService, type ProductInput } from "../services/productService";
import type { DemandLevel, Product } from "../types";
import { peso } from "../utils/format";

type ProductForm = {
  id: string;
  name: string;
  category: string;
  cost: number;
  currentPrice: number;
  maxAllowed: number;
  stock: number;
  reorderLevel: number;
  demand: DemandLevel;
  competitorPrice: number;
  active: boolean;
};

const emptyForm: ProductForm = {
  id: "",
  name: "",
  category: "Beverages",
  cost: 0,
  currentPrice: 0,
  maxAllowed: 0,
  stock: 0,
  reorderLevel: 0,
  demand: "Medium",
  competitorPrice: 0,
  active: true,
};

export default function ProductsPage() {
  useDocumentTitle("Products");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await productService.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products]);
  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.id} ${product.category}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!category || product.category === category);
  }), [products, query, category]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      cost: product.cost,
      currentPrice: product.currentPrice,
      maxAllowed: product.maxAllowed,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      demand: product.demand,
      competitorPrice: product.competitorPrice,
      active: product.active,
    });
    setModalOpen(true);
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return showToast("Product name is required.", "error");
    if (form.currentPrice < form.cost) return showToast("Current price should not be below product cost.", "error");
    if (form.maxAllowed < form.currentPrice) return showToast("Maximum allowed price must be at least the current price.", "error");

    setSaving(true);
    try {
      if (editingId) {
        await productService.update(editingId, {
          name: form.name.trim(),
          category: form.category.trim(),
          cost: form.cost,
          currentPrice: form.currentPrice,
          maxAllowed: form.maxAllowed,
          stock: form.stock,
          reorderLevel: form.reorderLevel,
          demand: form.demand,
          competitorPrice: form.competitorPrice,
          active: form.active,
        });
        showToast("Product updated successfully.");
      } else {
        const payload: ProductInput = {
          id: form.id.trim() || undefined,
          name: form.name.trim(),
          category: form.category.trim(),
          cost: form.cost,
          currentPrice: form.currentPrice,
          maxAllowed: form.maxAllowed,
          stock: form.stock,
          reorderLevel: form.reorderLevel,
          demand: form.demand,
          competitorPrice: form.competitorPrice,
          active: form.active,
        };
        await productService.create(payload);
        showToast("Product created successfully.");
      }
      setModalOpen(false);
      await load();
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to save product.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading product catalog..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        eyebrow="CATALOG"
        title="Products"
        description="Maintain the product master data used by inventory, demand forecasting, and pricing recommendations."
        actions={<Button icon={<Plus size={17} />} onClick={openCreate}>Add Product</Button>}
      />

      <Card>
        <div className="filter-bar">
          <label className="input-with-icon">
            <Search size={17} />
            <input placeholder="Search product, SKU, or category" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All Categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </Card>

      <Card title="Product Catalog" subtitle={`${filtered.length} product${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Cost</th><th>Current</th><th>Recommended</th><th>Max</th><th>Stock</th><th>Demand</th><th>Status</th><th /></tr></thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><small>{product.id}</small></td>
                    <td>{product.category}</td>
                    <td>{peso(product.cost)}</td>
                    <td>{peso(product.currentPrice)}</td>
                    <td className="success-text">{peso(product.recommendedPrice)}</td>
                    <td>{peso(product.maxAllowed)}</td>
                    <td>{product.stock}</td>
                    <td><Badge tone={product.demand === "High" ? "danger" : product.demand === "Medium" ? "warning" : "success"}>{product.demand}</Badge></td>
                    <td><Badge tone={product.active ? "success" : "neutral"}>{product.active ? "Active" : "Inactive"}</Badge></td>
                    <td><Button variant="ghost" icon={<Edit3 size={16} />} onClick={() => openEdit(product)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState description="No products match the current filters." />}
      </Card>


      <Modal open={modalOpen} title={editingId ? "Edit Product" : "Add Product"} onClose={() => !saving && setModalOpen(false)}>
        <form onSubmit={saveProduct}>
          <div className="form-grid">
            <label className="form-field"><span>SKU {editingId ? "" : "(optional)"}</span><input value={form.id} disabled={Boolean(editingId)} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} placeholder="SKU009" /></label>
            <label className="form-field"><span>Product Name</span><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="form-field"><span>Category</span><input required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></label>
            <label className="form-field"><span>Demand Level</span><select value={form.demand} onChange={(event) => setForm((current) => ({ ...current, demand: event.target.value as DemandLevel }))}><option>High</option><option>Medium</option><option>Low</option></select></label>
            <label className="form-field"><span>Cost</span><input type="number" min={0} step="0.01" value={form.cost} onChange={(event) => setForm((current) => ({ ...current, cost: Number(event.target.value) }))} /></label>
            <label className="form-field"><span>Current Price</span><input type="number" min={0} step="0.01" value={form.currentPrice} onChange={(event) => setForm((current) => ({ ...current, currentPrice: Number(event.target.value) }))} /></label>
            <label className="form-field"><span>Maximum Allowed</span><input type="number" min={0} step="0.01" value={form.maxAllowed} onChange={(event) => setForm((current) => ({ ...current, maxAllowed: Number(event.target.value) }))} /></label>
            <label className="form-field"><span>Competitor Price</span><input type="number" min={0} step="0.01" value={form.competitorPrice} onChange={(event) => setForm((current) => ({ ...current, competitorPrice: Number(event.target.value) }))} /></label>
            <label className="form-field"><span>Stock</span><input type="number" min={0} step="1" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))} /></label>
            <label className="form-field"><span>Reorder Level</span><input type="number" min={0} step="1" value={form.reorderLevel} onChange={(event) => setForm((current) => ({ ...current, reorderLevel: Number(event.target.value) }))} /></label>
          </div>
          <div className="setting-row"><div><strong>Active Product</strong><span>Include this product in monitoring and pricing.</span></div><label className="switch"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} /><span /></label></div>
          <div className="button-row modal-actions"><Button type="submit" loading={saving}>{editingId ? "Save Changes" : "Create Product"}</Button><Button type="button" variant="secondary" disabled={saving} onClick={() => setModalOpen(false)}>Cancel</Button></div>
        </form>
      </Modal>
    </>
  );
}

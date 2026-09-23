import { Minus, Plus, Search, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { productService } from "../services/productService";
import type { Product } from "../types";

export default function InventoryPage() {
  useDocumentTitle("Inventory");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await productService.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.id}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const totalUnits = useMemo(() => products.reduce((sum, product) => sum + product.stock, 0), [products]);
  const lowStock = useMemo(() => products.filter((product) => product.stock <= product.reorderLevel), [products]);
  const outOfStock = useMemo(() => products.filter((product) => product.stock === 0), [products]);

  function openAdjust(product: Product, nextMode: "add" | "remove") {
    setSelected(product);
    setMode(nextMode);
    setQuantity(1);
  }

  async function adjust() {
    if (!selected || quantity <= 0) return;
    setSaving(true);
    try {
      const delta = mode === "add" ? quantity : -quantity;
      const updated = await productService.adjustStock(selected.id, delta);
      setProducts((current) => current.map((product) => product.id === updated.id ? updated : product));
      showToast(`${updated.name} stock updated to ${updated.stock} units.`);
      setSelected(null);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to update stock.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading inventory..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="STOCK CONTROL" title="Inventory" description="Monitor on-hand stock and update inventory quantities used by demand and pricing decisions." />

      <div className="stats-grid three">
        <StatCard label="Total Units" value={String(totalUnits)} helper="Across all products" icon={<Warehouse />} trend="neutral" />
        <StatCard label="Low Stock" value={String(lowStock.length)} helper="At or below reorder level" icon={<Minus />} trend={lowStock.length ? "down" : "neutral"} />
        <StatCard label="Out of Stock" value={String(outOfStock.length)} helper="Needs replenishment" icon={<Minus />} trend={outOfStock.length ? "down" : "neutral"} />
      </div>

      <Card>
        <label className="input-with-icon">
          <Search size={17} />
          <input placeholder="Search product or SKU" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>

      <Card title="Inventory Levels" subtitle={`${filtered.length} product${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Reorder Level</th><th>Status</th><th>Demand</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((product) => {
                  const status = product.stock === 0 ? "Out of Stock" : product.stock <= product.reorderLevel ? "Low Stock" : "Healthy";
                  return (
                    <tr key={product.id}>
                      <td><strong>{product.name}</strong><small>{product.id}</small></td>
                      <td><strong>{product.stock}</strong> units</td>
                      <td>{product.reorderLevel} units</td>
                      <td><Badge tone={status === "Healthy" ? "success" : status === "Low Stock" ? "warning" : "danger"}>{status}</Badge></td>
                      <td><Badge tone={product.demand === "High" ? "danger" : product.demand === "Medium" ? "warning" : "success"}>{product.demand}</Badge></td>
                      <td>
                        <div className="button-row compact">
                          <Button variant="secondary" icon={<Plus size={15} />} onClick={() => openAdjust(product, "add")}>Add</Button>
                          <Button variant="ghost" icon={<Minus size={15} />} disabled={product.stock === 0} onClick={() => openAdjust(product, "remove")}>Remove</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState description="No inventory item matches your search." />}
      </Card>


      <Modal open={Boolean(selected)} title={mode === "add" ? "Add Stock" : "Remove Stock"} onClose={() => !saving && setSelected(null)}>
        {selected && (
          <>
            <div className="modal-grid">
              <div><span>Product</span><strong>{selected.name}</strong></div>
              <div><span>Current Stock</span><strong>{selected.stock} units</strong></div>
              <div><span>Reorder Level</span><strong>{selected.reorderLevel} units</strong></div>
              <div><span>Mode</span><strong>{mode === "add" ? "Stock In" : "Stock Out"}</strong></div>
            </div>
            <label className="form-field mt-16"><span>Quantity</span><input type="number" min={1} max={mode === "remove" ? selected.stock : undefined} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
            <div className="button-row modal-actions"><Button loading={saving} onClick={() => void adjust()}>{mode === "add" ? "Add Stock" : "Remove Stock"}</Button><Button variant="secondary" disabled={saving} onClick={() => setSelected(null)}>Cancel</Button></div>
          </>
        )}
      </Modal>
    </>
  );
}

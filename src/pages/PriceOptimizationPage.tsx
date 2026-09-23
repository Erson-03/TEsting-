import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { pricingService } from "../services/pricingService";
import { productService } from "../services/productService";
import type { OptimizationResponse, Product } from "../types";
import { number, peso } from "../utils/format";

const objectives = ["Maximize Expected Profit", "Balance Profit and Demand", "Protect Demand"];

export default function PriceOptimizationPage() {
  useDocumentTitle("Price Optimization");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [objective, setObjective] = useState(objectives[0]);
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => products.find((product) => product.id === selectedId) ?? null, [products, selectedId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await productService.list();
      setProducts(rows);
      setSelectedId(rows[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function optimize() {
    if (!selectedId) return;
    setRunning(true);
    try {
      const response = await pricingService.optimize(selectedId, objective);
      setResult(response);
      showToast("Price optimization completed.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Optimization failed.", "error");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    setResult(null);
  }, [selectedId, objective]);

  if (loading) return <LoadingState label="Loading optimization workspace..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="ANALYTICAL PRICING" title="Price Optimization" description="Compare candidate prices and select the best permitted option for the chosen business objective." />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Optimization Inputs" subtitle="Compare candidate prices using the selected objective and pricing rules">
          <label className="form-field">
            <span>Product</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Objective</span>
            <select value={objective} onChange={(event) => setObjective(event.target.value)}>
              {objectives.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          {selected && (
            <div className="key-value-list">
              <div><span>Current Price</span><strong>{peso(selected.currentPrice)}</strong></div>
              <div><span>Maximum Allowed</span><strong>{peso(selected.maxAllowed)}</strong></div>
              <div><span>Product Cost</span><strong>{peso(selected.cost)}</strong></div>
              <div><span>Demand Level</span><strong>{selected.demand}</strong></div>
            </div>
          )}
          <Button fullWidth loading={running} icon={<Sparkles size={17} />} onClick={() => void optimize()}>Run Optimization</Button>
        </Card>

        <Card title="Optimization Result" subtitle={result ? result.objective : "Run optimization to calculate candidates"}>
          {result ? (
            <div className="optimization-result">
              <Sparkles size={28} />
              <span>Best Allowed Price</span>
              <strong>{peso(result.best.price)}</strong>
              <p>{result.best.reason}</p>
              <div className="key-value-list full-width">
                <div><span>Predicted Demand</span><strong>{number(result.best.demand)} units</strong></div>
                <div><span>Expected Revenue</span><strong>{peso(result.best.revenue)}</strong></div>
                <div><span>Expected Profit</span><strong>{peso(result.best.profit)}</strong></div>
              </div>
            </div>
          ) : <div className="state-panel compact-state"><strong>No optimization result yet.</strong><p>Choose an objective and run the calculation.</p></div>}
        </Card>
      </div>

      <Card title="Candidate Price Evaluation" subtitle="Blocked candidates remain visible so users understand why they were not selected">
        {result ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Price</th><th>Demand</th><th>Revenue</th><th>Profit</th><th>Status</th><th>Reason</th></tr></thead>
              <tbody>
                {result.candidates.map((candidate) => (
                  <tr key={candidate.price} className={candidate.price === result.best.price ? "highlight-row" : ""}>
                    <td><strong>{peso(candidate.price)}</strong>{candidate.price === result.best.price && <small>Selected candidate</small>}</td>
                    <td>{candidate.demand} units</td>
                    <td>{peso(candidate.revenue)}</td>
                    <td>{peso(candidate.profit)}</td>
                    <td><Badge tone={candidate.allowed ? "success" : "danger"}>{candidate.allowed ? "ALLOWED" : "BLOCKED"}</Badge></td>
                    <td>{candidate.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="state-panel compact-state"><strong>Candidate prices will appear here.</strong></div>}
      </Card>

    </>
  );
}

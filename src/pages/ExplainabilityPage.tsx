import { BrainCircuit } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { pricingService } from "../services/pricingService";
import { productService } from "../services/productService";
import type { ExplainabilityResponse, Product } from "../types";
import { percent, peso } from "../utils/format";

export default function ExplainabilityPage() {
  useDocumentTitle("Explainability");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<ExplainabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setResultLoading(true);
    pricingService.explain(selectedId)
      .then((response) => active && setResult(response))
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Unable to explain the recommendation."))
      .finally(() => active && setResultLoading(false));
    return () => { active = false; };
  }, [selectedId]);

  if (loading) return <LoadingState label="Loading explainability workspace..." />;
  if (error && !products.length) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="EXPLAINABLE AI" title="Explainability" description="Make every recommendation understandable by showing the factors that increased or reduced the suggested price." />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Recommendation Explanation">
          <label className="form-field">
            <span>Product</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
            </select>
          </label>

          {resultLoading ? <LoadingState label="Building explanation..." /> : result ? (
            <div className="explain-output">
              <BrainCircuit size={28} />
              <span>Recommended Price</span>
              <strong>{peso(result.outputPrice)}</strong>
              <Badge tone="info">{percent(result.confidence)} confidence</Badge>
            </div>
          ) : <div className="state-panel compact-state"><strong>No explanation available.</strong></div>}
        </Card>

        <Card title="Factor Contributions" subtitle="Direction and relative contribution">
          {result ? (
            <div className="factor-list">
              {result.factors.map((factor) => (
                <div className="factor-row" key={factor.name}>
                  <div>
                    <div className="factor-label"><strong>{factor.name}</strong><span>{factor.direction === "positive" ? "Increasing" : "Reducing"}</span></div>
                    <div className="factor-track"><span className={factor.direction} style={{ width: `${Math.min(100, Math.abs(factor.contribution) * 100)}%` }} /></div>
                  </div>
                  <b className={factor.direction === "positive" ? "success-text" : "danger-text"}>{factor.direction === "positive" ? "+" : "−"}{factor.contribution.toFixed(2)}</b>
                </div>
              ))}
            </div>
          ) : <p className="muted-text">Select a product to load factors.</p>}
        </Card>
      </div>

      <Card title="Human-readable Explanation" subtitle="Plain-language explanation shown to the reviewer">
        <p className="human-explanation">{result?.explanation ?? "No explanation loaded."}</p>
      </Card>
    </>
  );
}

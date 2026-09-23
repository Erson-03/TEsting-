import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
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
import type { PriceRecommendation, Product } from "../types";
import { percent, peso } from "../utils/format";

export default function PriceRecommendationPage() {
  useDocumentTitle("Price Recommendation");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [recommendation, setRecommendation] = useState<PriceRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => products.find((product) => product.id === selectedId) ?? null, [products, selectedId]);

  const loadProducts = useCallback(async () => {
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

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setRecommendationLoading(true);
    pricingService.getRecommendation(selectedId)
      .then((result) => active && setRecommendation(result))
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Unable to load recommendation."))
      .finally(() => active && setRecommendationLoading(false));
    return () => { active = false; };
  }, [selectedId]);

  async function submitDecision(decision: "Accepted" | "Rejected" | "Kept") {
    if (!recommendation) return;
    setDecisionLoading(true);
    try {
      await pricingService.recordDecision(
        recommendation.product.id,
        decision,
        decision === "Accepted"
          ? "Recommendation approved after review."
          : decision === "Rejected"
            ? "Recommendation rejected after human review."
            : "Current price retained after review.",
      );
      showToast(`Decision saved: ${decision}.`);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to save decision.", "error");
    } finally {
      setDecisionLoading(false);
    }
  }

  if (loading) return <LoadingState label="Loading pricing recommendations..." />;
  if (error && !products.length) return <ErrorState message={error} onRetry={() => void loadProducts()} />;

  return (
    <>
      <PageHeader
        eyebrow="DECISION SUPPORT"
        title="Price Recommendation"
        description="Review the suggested price, confidence, rationale, and guardrail status before approving a change."
      />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Recommendation Workspace" subtitle="The page reads recommendations through pricingService">
          <label className="form-field">
            <span>Select Product</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
            </select>
          </label>

          {recommendationLoading ? <LoadingState label="Calculating recommendation..." /> : recommendation ? (
            <>
              <div className="recommendation-price-panel">
                <span>Recommended Price</span>
                <strong>{peso(recommendation.recommendedPrice)}</strong>
                <div>
                  <Badge tone={recommendation.change > 0 ? "success" : "neutral"}>{recommendation.change >= 0 ? "+" : ""}{peso(recommendation.change)} change</Badge>
                  <Badge tone="info">{percent(recommendation.confidence)} confidence</Badge>
                  <Badge tone={recommendation.risk === "Low" ? "success" : recommendation.risk === "Medium" ? "warning" : "danger"}>{recommendation.risk} Risk</Badge>
                </div>
              </div>

              <div className="mini-metrics">
                <div><span>Current Price</span><strong>{peso(recommendation.product.currentPrice)}</strong></div>
                <div><span>Product Cost</span><strong>{peso(recommendation.product.cost)}</strong></div>
                <div><span>Inventory</span><strong>{recommendation.product.stock} units</strong></div>
                <div><span>Competitor</span><strong>{peso(recommendation.product.competitorPrice)}</strong></div>
              </div>

              <div className="explain-box">
                <div className="explain-title"><strong>Why did PARA recommend this?</strong><Badge tone={recommendation.guardrailPassed ? "success" : "danger"}>{recommendation.guardrailPassed ? "Guardrails Passed" : "Review Required"}</Badge></div>
                <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </div>

              <div className="button-row">
                <Button variant="success" loading={decisionLoading} icon={<CheckCircle2 size={17} />} onClick={() => void submitDecision("Accepted")}>Approve Recommendation</Button>
                <Button variant="danger" disabled={decisionLoading} icon={<XCircle size={17} />} onClick={() => void submitDecision("Rejected")}>Reject</Button>
                <Button variant="secondary" disabled={decisionLoading} onClick={() => void submitDecision("Kept")}>Keep Current Price</Button>
              </div>
            </>
          ) : <div className="state-panel compact-state"><strong>No recommendation available.</strong></div>}
        </Card>

        <div className="stacked-cards">
          <Card title="Responsible Pricing Check">
            {recommendation ? (
              <>
                <div className="guardrail-value-row"><span>Adjustment</span><strong>{recommendation.change >= 0 ? "+" : ""}{peso(recommendation.change)}</strong></div>
                <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, recommendation.change / 2 * 100))}%` }} /></div>
                <div className="check-list">
                  <div><ShieldCheck /> Recommendation ≤ product maximum ({peso(recommendation.product.maxAllowed)})</div>
                  <div><ShieldCheck /> Human approval remains required</div>
                  <div><ShieldCheck /> Rationale is visible before decision</div>
                </div>
              </>
            ) : <p className="muted-text">Select a product to load the guardrail result.</p>}
          </Card>

          <Card title="Selected Product">
            {selected ? (
              <div className="key-value-list">
                <div><span>SKU</span><strong>{selected.id}</strong></div>
                <div><span>Category</span><strong>{selected.category}</strong></div>
                <div><span>Demand</span><strong>{selected.demand}</strong></div>
                <div><span>Demand Index</span><strong>{selected.demandIndex}/100</strong></div>
              </div>
            ) : <p className="muted-text">No product selected.</p>}
          </Card>
        </div>
      </div>

    </>
  );
}

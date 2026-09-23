import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { analyticsService } from "../services/analyticsService";
import type { FairnessReport } from "../types";
import { peso } from "../utils/format";

export default function FairnessMonitorPage() {
  useDocumentTitle("Fairness Monitor");
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await analyticsService.fairness());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load fairness report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingState label="Loading fairness checks..." />;
  if (error || !report) return <ErrorState message={error || "Fairness report is unavailable."} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="RESPONSIBLE PRICING" title="Fairness Monitor" description="Review pricing consistency, policy compliance, and product-level fairness checks before decisions are approved." />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Overall Fairness Score" subtitle="Current pricing-policy assessment">
          <div className="score-layout">
            <div className="score-ring" style={{ background: `conic-gradient(#13964a 0 ${report.score}%, #dfe8e2 ${report.score}%)` }}>
              <span>{report.score}%</span>
            </div>
            <div className="check-list">
              {report.checks.map((check) => (
                <div key={check.label}>
                  {check.passed ? <CheckCircle2 /> : <XCircle className="danger-text" />}
                  {check.label}
                </div>
              ))}
            </div>
          </div>
          <div className={`info-banner ${report.passed ? "" : "warning-banner"}`}>
            <ShieldCheck size={17} /> {report.passed ? "Current pricing decisions meet the configured fairness threshold." : "Some fairness checks require review."}
          </div>
        </Card>

        <Card title="Governance Principles">
          <div className="key-value-list">
            <div><span>Minimum target score</span><strong>90%</strong></div>
            <div><span>Human review</span><strong>Required</strong></div>
            <div><span>Price-change visibility</span><strong>Enabled</strong></div>
            <div><span>Audit trail</span><strong>Enabled</strong></div>
          </div>
          <p className="muted-text">Fairness checks should be reviewed together with pricing limits before a final price is approved.</p>
        </Card>
      </div>

      <Card title="Product Fairness Checks" subtitle="Comparison of recommendation changes against the configured maximum">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Current</th><th>Recommended</th><th>Difference</th><th>Result</th></tr></thead>
            <tbody>
              {report.productChecks.map(({ product, difference, passed }) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><small>{product.id}</small></td>
                  <td>{product.category}</td>
                  <td>{peso(product.currentPrice)}</td>
                  <td>{peso(product.recommendedPrice)}</td>
                  <td>{difference >= 0 ? "+" : ""}{peso(difference)}</td>
                  <td><Badge tone={passed ? "success" : "danger"}>{passed ? "PASS" : "REVIEW"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </>
  );
}

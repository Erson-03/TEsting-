import { Activity, ChartNoAxesCombined, CircleCheck, Gauge } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { analyticsService } from "../services/analyticsService";
import type { ModelMetrics } from "../types";
import { percent } from "../utils/format";

export default function ModelMonitoringPage() {
  useDocumentTitle("Model Monitoring");
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMetrics(await analyticsService.modelMetrics());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load model metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingState label="Loading model monitoring metrics..." />;
  if (error || !metrics) return <ErrorState message={error || "Model metrics are unavailable."} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="MODEL HEALTH" title="Model Monitoring" description="Monitor prediction quality, drift, approval rate, and constraint compliance without mixing model logic into page components." />

      <div className="stats-grid">
        <StatCard label="Model Version" value={metrics.version} helper={`Updated ${metrics.lastUpdated}`} icon={<ChartNoAxesCombined />} trend="neutral" />
        <StatCard label="Prediction Accuracy" value={percent(metrics.accuracy, 1)} helper="Current evaluation dataset" icon={<CircleCheck />} />
        <StatCard label="MAE" value={metrics.mae.toFixed(2)} helper="Mean absolute error" icon={<Gauge />} trend="neutral" />
        <StatCard label="Constraint Compliance" value={percent(metrics.constraintCompliance)} helper="Policy checks passed" icon={<Activity />} />
      </div>

      <div className="two-column">
        <Card title="Demand Model Metrics">
          <div className="key-value-list">
            <div><span>Accuracy</span><strong>{percent(metrics.accuracy, 1)}</strong></div>
            <div><span>MAE</span><strong>{metrics.mae.toFixed(2)}</strong></div>
            <div><span>RMSE</span><strong>{metrics.rmse.toFixed(2)}</strong></div>
            <div><span>Data Drift</span><strong>{percent(metrics.dataDrift, 1)}</strong></div>
            <div><span>Model Drift</span><strong>{percent(metrics.modelDrift, 1)}</strong></div>
          </div>
          <p className="health-chip"><span /> {metrics.status}</p>
        </Card>

        <Card title="Pricing Decision Metrics">
          <div className="key-value-list">
            <div><span>Approval Rate</span><strong>{percent(metrics.approvalRate)}</strong></div>
            <div><span>Constraint Compliance</span><strong>{percent(metrics.constraintCompliance)}</strong></div>
            <div><span>Current Version</span><strong>{metrics.version}</strong></div>
            <div><span>Last Updated</span><strong>{metrics.lastUpdated}</strong></div>
          </div>
          <p className="health-chip"><span /> Monitoring feed healthy</p>
        </Card>
      </div>

    </>
  );
}

import { Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { pricingService } from "../services/pricingService";
import { productService } from "../services/productService";
import type { Product, SensitivityResponse } from "../types";
import { percent, peso } from "../utils/format";

export default function SensitivityAnalysisPage() {
  useDocumentTitle("Sensitivity Analysis");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [competitorChange, setCompetitorChange] = useState(0);
  const [stockChange, setStockChange] = useState(0);
  const [demandChange, setDemandChange] = useState(0);
  const [result, setResult] = useState<SensitivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
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
  useEffect(() => { setResult(null); }, [selectedId]);

  async function runScenario() {
    if (!selectedId) return;
    setRunning(true);
    try {
      const response = await pricingService.sensitivity(selectedId, competitorChange, stockChange, demandChange);
      setResult(response);
      showToast("Sensitivity scenario calculated.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Scenario calculation failed.", "error");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading sensitivity analysis..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="WHAT-IF ANALYSIS" title="Sensitivity Analysis" description="Test how changes in market signals may affect the recommended price and predicted demand." />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Scenario Controls" subtitle="Adjust the signals, then run the scenario">
          <label className="form-field">
            <span>Product</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
            </select>
          </label>
          <Range label="Competitor Price Change" value={competitorChange} setValue={setCompetitorChange} min={-10} max={10} />
          <Range label="Stock Change" value={stockChange} setValue={setStockChange} min={-50} max={50} />
          <Range label="Demand Signal Change" value={demandChange} setValue={setDemandChange} min={-20} max={20} />
          <Button fullWidth loading={running} icon={<Play size={17} />} onClick={() => void runScenario()}>Run Scenario</Button>
        </Card>

        <Card title="Scenario Result" subtitle={result ? "Calculated what-if result" : "No scenario has been run yet"}>
          {result ? (
            <>
              <div className="key-value-list">
                <div><span>Base Price</span><strong>{peso(result.basePrice)}</strong></div>
                <div><span>Scenario Price</span><strong className="success-text">{peso(result.scenarioPrice)}</strong></div>
                <div><span>Predicted Demand</span><strong>{result.predictedDemand} units</strong></div>
                <div><span>Confidence</span><strong>{percent(result.confidence)}</strong></div>
              </div>
              <div className="info-banner">{result.summary}</div>
            </>
          ) : <div className="state-panel compact-state"><strong>Move the controls and run a scenario.</strong></div>}
        </Card>
      </div>

      <Card title="Price Response" subtitle="Scenario response across demand changes">
        {result ? (
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eee8" />
                <XAxis dataKey="change" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#149a4b" strokeWidth={3} name="Price" />
                <Line type="monotone" dataKey="demand" stroke="#3f7bdc" strokeWidth={2} name="Demand" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="state-panel compact-state"><strong>Scenario chart will appear here.</strong></div>}
      </Card>

    </>
  );
}

function Range({ label, value, setValue, min, max }: { label: string; value: number; setValue: (value: number) => void; min: number; max: number }) {
  return (
    <label className="range-control">
      <div><strong>{label}</strong><span>{value >= 0 ? "+" : ""}{value}%</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} />
    </label>
  );
}

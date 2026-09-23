import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import type { DemandPredictionResponse, Product } from "../types";
import { percent, peso } from "../utils/format";

export default function DemandPredictionPage() {
  useDocumentTitle("Demand Prediction");
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [testPrice, setTestPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [competitorPrice, setCompetitorPrice] = useState(0);
  const [prediction, setPrediction] = useState<DemandPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => products.find((product) => product.id === selectedId) ?? null, [products, selectedId]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await productService.list();
      setProducts(data);
      const first = data[0];
      if (first) {
        setSelectedId(first.id);
        setTestPrice(first.currentPrice);
        setStock(first.stock);
        setCompetitorPrice(first.competitorPrice);
      }
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
    if (!selected) return;
    setTestPrice(selected.currentPrice);
    setStock(selected.stock);
    setCompetitorPrice(selected.competitorPrice);
    setPrediction(null);
  }, [selected]);

  async function runPrediction() {
    if (!selected) return;
    setRunning(true);
    try {
      const result = await pricingService.predictDemand({
        productId: selected.id,
        price: testPrice,
        stock,
        competitorPrice,
      });
      setPrediction(result);
      showToast("Demand prediction completed.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Prediction failed.", "error");
    } finally {
      setRunning(false);
    }
  }

  function resetInputs() {
    if (!selected) return;
    setTestPrice(selected.currentPrice);
    setStock(selected.stock);
    setCompetitorPrice(selected.competitorPrice);
    setPrediction(null);
  }

  if (loading) return <LoadingState label="Loading demand prediction workspace..." />;
  if (error) return <ErrorState message={error} onRetry={() => void loadProducts()} />;

  return (
    <>
      <PageHeader
        eyebrow="ANALYTICS"
        title="Demand Prediction"
        description="Estimate how product demand could respond to a candidate price before making a pricing decision."
      />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Prediction Inputs" subtitle="Values sent to the demand-prediction service">
          <label className="form-field">
            <span>Product</span>
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
            </select>
          </label>

          <div className="form-grid">
            <label className="form-field">
              <span>Test Price</span>
              <input type="number" min={0} step="0.25" value={testPrice} onChange={(event) => setTestPrice(Number(event.target.value))} />
            </label>
            <label className="form-field">
              <span>Current Stock</span>
              <input type="number" min={0} step="1" value={stock} onChange={(event) => setStock(Number(event.target.value))} />
            </label>
            <label className="form-field">
              <span>Competitor Price</span>
              <input type="number" min={0} step="0.25" value={competitorPrice} onChange={(event) => setCompetitorPrice(Number(event.target.value))} />
            </label>
            <label className="form-field">
              <span>Current Price</span>
              <input value={selected ? peso(selected.currentPrice) : "—"} readOnly />
            </label>
          </div>

          <div className="button-row">
            <Button loading={running} icon={<Play size={17} />} onClick={() => void runPrediction()}>Run Prediction</Button>
            <Button variant="secondary" icon={<RotateCcw size={17} />} onClick={resetInputs}>Reset Inputs</Button>
          </div>
        </Card>

        <Card title="Prediction Result" subtitle={prediction ? "Latest prediction" : "Run a prediction to see results"}>
          {prediction ? (
            <>
              <div className="prediction-display">
                <span>Predicted Demand</span>
                <strong>{prediction.predictedDemand} units</strong>
                <Badge tone={prediction.demandLevel === "High" ? "danger" : prediction.demandLevel === "Medium" ? "warning" : "success"}>{prediction.demandLevel} Demand</Badge>
              </div>
              <div className="key-value-list">
                <div><span>Model Confidence</span><strong>{percent(prediction.confidence)}</strong></div>
                <div><span>Candidate Price</span><strong>{peso(testPrice)}</strong></div>
                <div><span>Competitor Price</span><strong>{peso(competitorPrice)}</strong></div>
                <div><span>Input Stock</span><strong>{stock} units</strong></div>
              </div>
            </>
          ) : (
            <div className="state-panel compact-state"><strong>No prediction yet</strong><p>Choose a product, adjust the inputs, and run the prediction.</p></div>
          )}
        </Card>
      </div>

      <Card title="Demand Curve" subtitle="Predicted demand across candidate prices">
        {prediction ? (
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prediction.curve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eee8" />
                <XAxis dataKey="price" tickFormatter={(value) => `₱${value}`} />
                <YAxis />
                <Tooltip formatter={(value, name) => name === "demand" ? [`${value} units`, "Demand"] : [value, name]} labelFormatter={(value) => `Price: ₱${value}`} />
                <Line type="monotone" dataKey="demand" stroke="#149a4b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="state-panel compact-state"><strong>Demand curve will appear here.</strong></div>}
      </Card>
    </>
  );
}

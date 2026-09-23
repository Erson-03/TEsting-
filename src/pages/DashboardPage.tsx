import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { analyticsService } from "../services/analyticsService";
import { pricingService } from "../services/pricingService";
import { productService } from "../services/productService";
import type {
  DashboardData,
  FairnessReport,
  ModelMetrics,
  PriceRecommendation,
  Product,
} from "../types";
import { number, percent, peso } from "../utils/format";

type DashboardState = {
  dashboard: DashboardData;
  products: Product[];
  recommendation: PriceRecommendation | null;
  fairness: FairnessReport;
  model: ModelMetrics;
};

export default function DashboardPage() {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [state, setState] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, products, fairness, model] = await Promise.all([
        analyticsService.dashboard(),
        productService.list(),
        analyticsService.fairness(),
        analyticsService.modelMetrics(),
      ]);
      const first = products.find((product) => product.active) ?? products[0];
      const recommendation = first ? await pricingService.getRecommendation(first.id) : null;
      setState({ dashboard, products, fairness, model, recommendation });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unexpected dashboard error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(decision: "Accepted" | "Kept") {
    if (!state?.recommendation) return;
    setDecisionLoading(true);
    try {
      await pricingService.recordDecision(
        state.recommendation.product.id,
        decision,
        decision === "Accepted" ? "Approved from dashboard." : "Current price retained from dashboard.",
      );
      showToast(decision === "Accepted" ? "Recommendation approved." : "Current price retained.");
      const dashboard = await analyticsService.dashboard();
      setState((current) => current ? { ...current, dashboard } : current);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to save the decision.", "error");
    } finally {
      setDecisionLoading(false);
    }
  }

  const recommendationRows = useMemo(() => state?.products.slice(0, 5) ?? [], [state]);

  if (loading) return <LoadingState label="Loading PARA dashboard..." />;
  if (error || !state) return <ErrorState message={error || "Dashboard data is unavailable."} onRetry={() => void load()} />;

  const { dashboard, recommendation, fairness, model } = state;
  const currentDate = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <PageHeader
        title="Pricing Intelligence Dashboard"
        description="Monitor pricing performance, demand signals, recommendations, fairness, and model health from one screen."
        actions={
          <div className="date-display">
            <strong>{currentDate}</strong>
            <span>Data-driven pricing. Responsible decisions.</span>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total Revenue" value={peso(dashboard.totalRevenue)} helper="Sales records in current dataset" icon={<Coins />} />
        <StatCard label="Estimated Profit" value={peso(dashboard.totalProfit)} helper="Based on recorded margins" icon={<CircleDollarSign />} />
        <StatCard label="Products Monitored" value={number(dashboard.productsMonitored)} helper="Active products" icon={<Boxes />} />
        <StatCard label="Average Price Adjustment" value={`${dashboard.averageAdjustment >= 0 ? "+" : ""}${peso(dashboard.averageAdjustment)}`} helper="Across active products" icon={<TrendingUp />} trend="neutral" />
      </div>

      <div className="dashboard-grid dashboard-grid-top">
        <Card title="Revenue & Demand Trend" subtitle="Latest analytics window">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.trend}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#149a4b" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#149a4b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eee8" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => peso(Number(value))} />
                <Area type="monotone" dataKey="revenue" stroke="#149a4b" fill="url(#dashboardRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Demand Distribution" subtitle="Product demand mix">
          <div className="donut-layout">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard.demandDistribution} dataKey="value" innerRadius={62} outerRadius={87} paddingAngle={2}>
                    {dashboard.demandDistribution.map((item) => <Cell key={item.name} fill={item.fill} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center"><strong>{dashboard.productsMonitored}</strong><span>Products</span></div>
            </div>
            <div className="legend-stack">
              {dashboard.demandDistribution.map((item) => (
                <div key={item.name}>
                  <span><i style={{ background: item.fill }} />{item.name}</span>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid dashboard-grid-middle">
        <Card
          title="Featured Price Recommendation"
          subtitle="Human review required before applying any price change"
          action={<Button variant="ghost" icon={<ArrowRight size={16} />} onClick={() => navigate("/price-recommendation")}>View All</Button>}
        >
          {recommendation ? (
            <>
              <div className="recommendation-hero">
                <div className="product-illustration">{recommendation.product.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                <div className="recommendation-main">
                  <div className="recommendation-title-row">
                    <div>
                      <h3>{recommendation.product.name}</h3>
                      <p>{recommendation.product.id} · {recommendation.product.category}</p>
                    </div>
                    <Badge tone={recommendation.guardrailPassed ? "success" : "danger"}>{recommendation.risk} Risk</Badge>
                  </div>
                  <div className="price-comparison">
                    <div><span>Current Price</span><strong>{peso(recommendation.product.currentPrice)}</strong></div>
                    <ArrowRight size={22} />
                    <div><span>Recommended Price</span><strong className="success-text">{peso(recommendation.recommendedPrice)}</strong></div>
                  </div>
                  <div className="mini-metrics">
                    <div><span>Cost</span><strong>{peso(recommendation.product.cost)}</strong></div>
                    <div><span>Maximum</span><strong>{peso(recommendation.product.maxAllowed)}</strong></div>
                    <div><span>Adjustment</span><strong className="success-text">{recommendation.change >= 0 ? "+" : ""}{peso(recommendation.change)}</strong></div>
                    <div><span>Inventory</span><strong>{recommendation.product.stock} units</strong></div>
                  </div>
                </div>
              </div>
              <div className="explain-box">
                <div className="explain-title"><strong>Why this recommendation?</strong><Badge tone="info">{percent(recommendation.confidence)} confidence</Badge></div>
                <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </div>
              <div className="button-row">
                <Button variant="success" loading={decisionLoading} icon={<ShieldCheck size={17} />} onClick={() => void decide("Accepted")}>Accept Recommendation</Button>
                <Button variant="secondary" disabled={decisionLoading} onClick={() => void decide("Kept")}>Keep Current Price</Button>
              </div>
            </>
          ) : <p className="muted-text">No active product is available for a recommendation.</p>}
        </Card>

        <div className="stacked-cards">
          <Card title="Responsible Pricing Guardrail">
            <div className="guardrail-value-row"><span>Featured recommendation</span><strong>{recommendation ? `${recommendation.change >= 0 ? "+" : ""}${peso(recommendation.change)}` : "—"}</strong></div>
            <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, ((recommendation?.change ?? 0) / 2) * 100))}%` }} /></div>
            <div className="guardrail-summary">
              <span>Current policy example: <strong>up to ₱2.00 adjustment</strong></span>
              <p><ShieldCheck size={17} /> {recommendation?.guardrailPassed ? "Within configured pricing limits" : "Requires additional review"}</p>
            </div>
          </Card>

          <Card title="Pricing Performance">
            <div className="key-value-list">
              <div><span>Acceptance Rate</span><strong>{percent(dashboard.acceptanceRate)}</strong></div>
              <div><span>Fairness Score</span><strong className="success-text">{percent(fairness.score)}</strong></div>
              <div><span>Model Accuracy</span><strong>{percent(model.accuracy, 1)}</strong></div>
              <div><span>Constraint Compliance</span><strong>{percent(model.constraintCompliance)}</strong></div>
            </div>
          </Card>
        </div>
      </div>

      <div className="two-column">
        <Card title="Top Product Recommendations" subtitle="Current product pricing state">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Product</th><th>Current</th><th>Recommended</th><th>Change</th><th>Demand</th></tr></thead>
              <tbody>
                {recommendationRows.map((product) => {
                  const change = product.recommendedPrice - product.currentPrice;
                  return (
                    <tr key={product.id}>
                      <td><strong>{product.name}</strong><small>{product.id}</small></td>
                      <td>{peso(product.currentPrice)}</td>
                      <td className="success-text">{peso(product.recommendedPrice)}</td>
                      <td>{change >= 0 ? "+" : ""}{peso(change)}</td>
                      <td><Badge tone={product.demand === "High" ? "danger" : product.demand === "Medium" ? "warning" : "success"}>{product.demand}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Recent Decisions" subtitle="Latest audit records">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Product</th><th>Change</th><th>Decision</th></tr></thead>
              <tbody>
                {dashboard.recentDecisions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td><strong>{item.product}</strong><small>{item.sku}</small></td>
                    <td>{item.change >= 0 ? "+" : ""}{peso(item.change)}</td>
                    <td><Badge tone={item.decision === "Accepted" ? "success" : item.decision === "Rejected" ? "danger" : "neutral"}>{item.decision}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { historyService } from "../services/historyService";
import type { PricingHistoryItem } from "../types";
import { peso } from "../utils/format";

export default function PricingHistoryPage() {
  useDocumentTitle("Pricing History");
  const [rows, setRows] = useState<PricingHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await historyService.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load pricing history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => rows.filter((item) => {
    const text = `${item.product} ${item.sku} ${item.approver}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (!decision || item.decision === decision);
  }), [rows, query, decision]);

  if (loading) return <LoadingState label="Loading pricing audit trail..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="AUDIT TRAIL" title="Pricing History" description="Trace previous recommendations, final decisions, model versions, approvers, and recorded reasons." />

      <Card>
        <div className="filter-bar">
          <label className="input-with-icon">
            <Search size={17} />
            <input placeholder="Search product, SKU, or approver" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="">All Decisions</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Kept">Kept</option>
            <option value="Review">Review</option>
          </select>
        </div>
      </Card>

      <Card title="Decision Records" subtitle={`${filtered.length} record${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Product</th><th>Old</th><th>New</th><th>Change</th><th>Decision</th><th>Model</th><th>Approved By</th><th>Reason</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td><strong>{item.product}</strong><small>{item.sku}</small></td>
                    <td>{peso(item.oldPrice)}</td>
                    <td>{peso(item.newPrice)}</td>
                    <td>{item.change >= 0 ? "+" : ""}{peso(item.change)}</td>
                    <td><Badge tone={item.decision === "Accepted" ? "success" : item.decision === "Rejected" ? "danger" : item.decision === "Review" ? "warning" : "neutral"}>{item.decision}</Badge></td>
                    <td>{item.model}</td>
                    <td>{item.approver}</td>
                    <td>{item.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState description="Try another search term or decision filter." />}
      </Card>

    </>
  );
}

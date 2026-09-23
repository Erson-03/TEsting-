import { BarChart3, Download, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { salesService } from "../services/salesService";
import type { SalesRow } from "../types";
import { parseSalesCsv, salesToCsv } from "../utils/csv";
import { peso } from "../utils/format";

export default function SalesDataPage() {
  useDocumentTitle("Sales Data");
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await salesService.list());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load sales data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, number>();
    rows.forEach((row) => grouped.set(row.product, (grouped.get(row.product) ?? 0) + row.revenue));
    return Array.from(grouped, ([product, revenue]) => ({ product, revenue }));
  }, [rows]);

  async function importCsv(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseSalesCsv(text);
      const inserted = await salesService.importRows(parsed);
      setRows((current) => [...inserted, ...current]);
      showToast(`${inserted.length} sales row${inserted.length === 1 ? "" : "s"} imported.`);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to import CSV.", "error");
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function exportCsv() {
    const csv = salesToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `para-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Sales CSV exported.");
  }

  if (loading) return <LoadingState label="Loading sales data..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        eyebrow="DATA INPUT"
        title="Sales Data"
        description="Review and import sales records that feed pricing analytics and future demand forecasting models."
        actions={
          <div className="button-row compact">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
            <Button variant="secondary" loading={importing} icon={<Upload size={17} />} onClick={() => inputRef.current?.click()}>Import CSV</Button>
            <Button icon={<Download size={17} />} onClick={exportCsv}>Export CSV</Button>
          </div>
        }
      />

      <Card title="Revenue by Product" subtitle="Aggregated from the currently loaded sales records">
        {chartData.length ? (
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5eee8" />
                <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value) => peso(Number(value))} />
                <Bar dataKey="revenue" fill="#149a4b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState description="Import sales records to populate the chart." />}
      </Card>

      <Card title="Sales Records" subtitle={`${rows.length} row${rows.length === 1 ? "" : "s"}`}>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Units</th><th>Revenue</th><th>Margin</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td><strong>{row.product}</strong></td>
                    <td>{row.sku}</td>
                    <td>{row.units}</td>
                    <td>{peso(row.revenue)}</td>
                    <td>{row.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No sales records" description="Import a CSV file to add sales data." />}
        <div className="info-banner"><BarChart3 size={17} /> Required CSV columns: <strong>date, product, sku, units, revenue, margin</strong>.</div>
      </Card>

    </>
  );
}

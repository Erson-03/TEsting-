import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { settingsService } from "../services/settingsService";
import type { PricingConstraints } from "../types";
import { peso } from "../utils/format";

const defaults: PricingConstraints = {
  maxIncrease: 2,
  enforceSrp: true,
  enforceFairness: true,
  requireApproval: true,
  minimumMargin: 8,
};

export default function ConstraintCenterPage() {
  useDocumentTitle("Constraint Center");
  const { showToast } = useToast();
  const [constraints, setConstraints] = useState<PricingConstraints>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setConstraints(await settingsService.getConstraints());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load pricing constraints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const checks = useMemo(() => [
    { name: "Maximum price increase", rule: `≤ ${peso(constraints.maxIncrease)}`, pass: constraints.maxIncrease > 0 && constraints.maxIncrease <= 2 },
    { name: "SRP enforcement", rule: constraints.enforceSrp ? "Enabled" : "Disabled", pass: constraints.enforceSrp },
    { name: "Minimum margin", rule: `≥ ${constraints.minimumMargin}%`, pass: constraints.minimumMargin >= 0 },
    { name: "Fairness enforcement", rule: constraints.enforceFairness ? "Enabled" : "Disabled", pass: constraints.enforceFairness },
    { name: "Human approval", rule: constraints.requireApproval ? "Required" : "Optional", pass: constraints.requireApproval },
  ], [constraints]);

  async function save() {
    setSaving(true);
    try {
      const saved = await settingsService.saveConstraints(constraints);
      setConstraints(saved);
      showToast("Pricing constraints saved successfully.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to save constraints.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading pricing constraints..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader
        eyebrow="GUARDRAILS"
        title="Constraint Center"
        description="Configure the business and responsible-pricing rules that every recommendation should satisfy before human review."
      />

      <div className="dashboard-grid dashboard-grid-middle">
        <Card title="Current Constraint Check" subtitle="Review the active rules applied to pricing recommendations">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Constraint</th><th>Configured Rule</th><th>Result</th></tr></thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.name}>
                    <td><strong>{check.name}</strong></td>
                    <td>{check.rule}</td>
                    <td><Badge tone={check.pass ? "success" : "danger"}>{check.pass ? "PASS" : "REVIEW"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Policy Controls" subtitle="Saved through settingsService">
          <label className="form-field">
            <span>Maximum Price Increase (₱)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={constraints.maxIncrease}
              onChange={(event) => setConstraints((current) => ({ ...current, maxIncrease: Number(event.target.value) }))}
            />
          </label>
          <label className="form-field">
            <span>Minimum Margin (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={constraints.minimumMargin}
              onChange={(event) => setConstraints((current) => ({ ...current, minimumMargin: Number(event.target.value) }))}
            />
          </label>

          <div className="settings-list">
            <Toggle label="SRP Enforcement" desc="Keep recommendations within suggested retail policy." value={constraints.enforceSrp} onChange={(value) => setConstraints((current) => ({ ...current, enforceSrp: value }))} />
            <Toggle label="Fairness Enforcement" desc="Require fairness checks before approval." value={constraints.enforceFairness} onChange={(value) => setConstraints((current) => ({ ...current, enforceFairness: value }))} />
            <Toggle label="Require Human Approval" desc="Prevent automatic price application from the UI." value={constraints.requireApproval} onChange={(value) => setConstraints((current) => ({ ...current, requireApproval: value }))} />
          </div>

          <Button fullWidth loading={saving} icon={<Save size={17} />} onClick={() => void save()}>Save Pricing Policy</Button>
        </Card>
      </div>

    </>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="setting-row">
      <div><strong>{label}</strong><span>{desc}</span></div>
      <label className="switch">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        <span />
      </label>
    </div>
  );
}

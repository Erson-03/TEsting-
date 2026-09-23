import { RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { ENV } from "../config/env";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { settingsService } from "../services/settingsService";
import type { AppSettings } from "../types";

const defaults: AppSettings = {
  currency: "PHP",
  recommendationAlerts: true,
  limitAlerts: true,
  weeklySummary: true,
  compactTables: false,
};

export default function SettingsPage() {
  useDocumentTitle("Settings");
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSettings(await settingsService.getAppSettings());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load application settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      setSettings(await settingsService.saveAppSettings(settings));
      showToast("Application settings saved.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function resetDemo() {
    if (!ENV.useMockApi) {
      showToast("Sample data reset is unavailable in the current system mode.", "info");
      return;
    }
    setResetting(true);
    try {
      await settingsService.resetDemoData();
      setSettings(defaults);
      showToast("Sample workspace data restored.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "Unable to restore sample data.", "error");
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <LoadingState label="Loading application settings..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <>
      <PageHeader eyebrow="PREFERENCES" title="Settings" description="Configure UI preferences while keeping system pricing rules in the separate Constraint Center." />

      <div className="two-column">
        <Card title="General Preferences">
          <label className="form-field">
            <span>Default Currency</span>
            <select value={settings.currency} onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value as "PHP" }))}>
              <option value="PHP">PHP · Philippine Peso</option>
            </select>
          </label>
          <div className="setting-row">
            <div><strong>Compact Tables</strong><span>Reduce row spacing on data-heavy pages.</span></div>
            <Toggle checked={settings.compactTables} onChange={(value) => setSettings((current) => ({ ...current, compactTables: value }))} />
          </div>
        </Card>

        <Card title="Notifications">
          <div className="settings-list">
            <SettingToggle label="Price Recommendation Alerts" desc="Notify reviewers when new recommendations are available." value={settings.recommendationAlerts} onChange={(value) => setSettings((current) => ({ ...current, recommendationAlerts: value }))} />
            <SettingToggle label="Approaching Pricing Limit" desc="Highlight recommendations near the maximum allowed change." value={settings.limitAlerts} onChange={(value) => setSettings((current) => ({ ...current, limitAlerts: value }))} />
            <SettingToggle label="Weekly Analytics Summary" desc="Enable the preference for a future weekly summary workflow." value={settings.weeklySummary} onChange={(value) => setSettings((current) => ({ ...current, weeklySummary: value }))} />
          </div>
        </Card>
      </div>

      <Card title="Workspace Data" subtitle="Manage the sample workspace data used for review and presentation">
        <div className="button-row">
          <Button loading={saving} icon={<Save size={17} />} onClick={() => void save()}>Save Preferences</Button>
          <Button variant="secondary" loading={resetting} disabled={!ENV.useMockApi} icon={<RotateCcw size={17} />} onClick={() => void resetDemo()}>Restore Sample Data</Button>
        </div>
      </Card>

    </>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span /></label>;
}

function SettingToggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="setting-row"><div><strong>{label}</strong><span>{desc}</span></div><Toggle checked={value} onChange={onChange} /></div>;
}

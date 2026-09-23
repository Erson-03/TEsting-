import type { ReactNode } from "react";
interface Props { label:string; value:string; helper:string; icon:ReactNode; trend?:"up"|"down"|"neutral"; }
export default function StatCard({ label, value, helper, icon, trend="up" }: Props) {
  return <article className="stat-card"><div className="stat-icon">{icon}</div><div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className={`stat-helper trend-${trend}`}>{helper}</span></div></article>;
}

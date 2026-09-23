import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({ title = "No data found", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="state-panel"><Inbox size={28} /><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}

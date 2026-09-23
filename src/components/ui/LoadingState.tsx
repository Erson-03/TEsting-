import { LoaderCircle } from "lucide-react";

export default function LoadingState({ label = "Loading data..." }: { label?: string }) {
  return <div className="state-panel"><LoaderCircle className="spin" size={24} /><strong>{label}</strong></div>;
}

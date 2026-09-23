import { CircleAlert, RefreshCw } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-panel state-error">
      <CircleAlert size={26} />
      <div><strong>Unable to load this section</strong><p>{message}</p></div>
      {onRetry && <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={onRetry}>Retry</Button>}
    </div>
  );
}

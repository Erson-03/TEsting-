import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; icon?: ReactNode; loading?: boolean; fullWidth?: boolean;
}

// Reusable button so every action feels consistent and polished.
export default function Button({ children, variant="primary", icon, loading=false, fullWidth=false, className="", disabled, ...props }: Props) {
  return (
    <button className={`btn btn-${variant} ${fullWidth ? "btn-full" : ""} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle size={17} className="spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}

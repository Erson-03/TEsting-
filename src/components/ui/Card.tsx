import type { ReactNode } from "react";
interface Props { title?:string; subtitle?:string; action?:ReactNode; children:ReactNode; className?:string; }

// Shared card wrapper for analytics, forms, tables, and summaries.
export default function Card({ title, subtitle, action, children, className="" }: Props) {
  return <section className={`card ${className}`}>
    {(title || action) && <div className="card-header"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    <div className="card-body">{children}</div>
  </section>;
}

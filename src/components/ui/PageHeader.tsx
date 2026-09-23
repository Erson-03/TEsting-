import type { ReactNode } from "react";
interface Props { eyebrow?:string; title:string; description:string; actions?:ReactNode; }
export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return <div className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

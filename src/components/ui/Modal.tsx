import type { ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";
interface Props { open:boolean; title:string; children:ReactNode; onClose:()=>void; }
export default function Modal({ open, title, children, onClose }: Props) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e)=>e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><Button variant="ghost" icon={<X size={17}/>} onClick={onClose}>Close</Button></div><div className="modal-content">{children}</div></div></div>;
}

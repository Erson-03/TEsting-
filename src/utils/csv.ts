import type { SalesRow } from "../types";

/* Simple CSV helpers for the frontend demo. A backend should perform
   final validation before accepting imported records. */
export function salesToCsv(rows: SalesRow[]): string {
  const header = "date,product,sku,units,revenue,margin";
  const body = rows.map((row) => [
    row.date,
    row.product,
    row.sku,
    row.units,
    row.revenue,
    row.margin,
  ].map(escapeCsv).join(","));
  return [header, ...body].join("\n");
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function parseSalesCsv(text: string): Omit<SalesRow, "id">[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV file does not contain any data rows.");
  const header = lines[0].split(",").map((value) => value.trim().toLowerCase());
  const required = ["date", "product", "sku", "units", "revenue", "margin"];
  required.forEach((field) => {
    if (!header.includes(field)) throw new Error(`Missing required CSV column: ${field}`);
  });

  return lines.slice(1).map((line, index) => {
    const cells = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    const get = (field: string) => cells[header.indexOf(field)] ?? "";
    const units = Number(get("units"));
    const revenue = Number(get("revenue"));
    const margin = Number(get("margin"));
    if (![units, revenue, margin].every(Number.isFinite)) {
      throw new Error(`Invalid numeric value on CSV row ${index + 2}.`);
    }
    return {
      date: get("date"),
      product: get("product"),
      sku: get("sku"),
      units,
      revenue,
      margin,
    };
  });
}

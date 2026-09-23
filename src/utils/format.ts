export function peso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function number(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

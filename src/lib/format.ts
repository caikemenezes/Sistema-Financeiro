export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: Date): string {
  return value.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function parseCurrencyInput(value: FormDataEntryValue | null): number {
  if (!value) return 0;
  return Number(String(value).replace(",", "."));
}

export function parseDateInput(value: FormDataEntryValue | null): Date {
  return new Date(`${String(value)}T00:00:00Z`);
}

export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseMesParam(mes: string | undefined): Date {
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [ano, mesNum] = mes.split("-").map(Number);
    return new Date(Date.UTC(ano, mesNum - 1, 1));
  }
  return new Date();
}

export function formatMesParam(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export function diasAte(data: Date): number {
  const hoje = new Date();
  const msPorDia = 24 * 60 * 60 * 1000;
  return Math.ceil((data.getTime() - hoje.getTime()) / msPorDia);
}

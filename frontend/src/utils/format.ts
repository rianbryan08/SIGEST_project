// Converte horas em texto legível: 4 -> "4 horas", 24 -> "1 dia", 30 -> "1 dia e 6 h".
export function formatHours(hours: number): string {
  if (hours < 24) return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  const dayText = `${days} ${days === 1 ? "dia" : "dias"}`;
  return rest === 0 ? dayText : `${dayText} e ${rest} h`;
}

export const priorityLabels = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
} as const;

// Extrai a mensagem de erro devolvida pela API (ou usa um texto padrão).
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
  return firstFieldError ?? data?.message ?? fallback;
}

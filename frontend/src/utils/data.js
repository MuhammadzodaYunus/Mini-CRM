export function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function extractApiError(error, fallback) {
  const payload = error.response?.data;
  if (!payload) return "Ба сервер пайваст шудан нашуд.";
  if (typeof payload === "string") return payload;
  if (typeof payload.detail === "string") return payload.detail;

  const messages = [];
  Object.entries(payload).forEach(([field, value]) => {
    if (Array.isArray(value)) messages.push(`${field}: ${value.join(" ")}`);
    else if (typeof value === "string") messages.push(`${field}: ${value}`);
    else if (value && typeof value === "object") messages.push(`${field}: ${JSON.stringify(value)}`);
  });

  return messages.join(" | ") || fallback;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tg-TJ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value) {
  return value ? String(value).slice(0, 5) : "—";
}

export function displayUsername(profile) {
  return profile?.user?.username || profile?.username || `ID ${profile?.id ?? "—"}`;
}

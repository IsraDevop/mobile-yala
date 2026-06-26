const COLORS = [
  "#7C3AED", "#EA580C", "#0284C7", "#16A34A", "#DC2626",
  "#7C3AED", "#D97706", "#0891B2", "#9333EA", "#059669",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

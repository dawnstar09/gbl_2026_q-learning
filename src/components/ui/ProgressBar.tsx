export function ProgressBar({ value, colorVar = "var(--accent-lavender)" }: { value: number; colorVar?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="w-full h-2 rounded-full bg-bg-panel-2 border border-border-soft overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: colorVar }}
      />
    </div>
  );
}

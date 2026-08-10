import { ReactNode } from "react";

const ACCENTS = {
  blue: "var(--accent-blue)",
  neutral: "var(--border-soft)",
  green: "var(--accent-green)",
  purple: "var(--accent-purple)",
} as const;

export function ScreenFrame({
  children,
  accent = "neutral",
  wide = false,
}: {
  children: ReactNode;
  accent?: keyof typeof ACCENTS;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-deep px-4 py-8">
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-[28px] bg-bg-panel shadow-xl shadow-black/10 overflow-hidden transition-[border-color,max-width] duration-700`}
        style={{ border: `2px solid ${ACCENTS[accent]}` }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px] transition-colors duration-700"
          style={{ background: ACCENTS[accent] }}
        />
        <div className="px-6 py-8 sm:px-8 sm:py-10 min-h-[560px] flex flex-col">{children}</div>
      </div>
    </div>
  );
}

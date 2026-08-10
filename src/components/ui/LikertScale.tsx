"use client";

// 7점 척도. 왼쪽(그렇다)은 초록, 오른쪽(그렇지 않다)은 보라 계열로 그라데이션.
// 크기는 양 끝이 크고 가운데로 갈수록 작아지는 형태 (스크린샷 참고).
const STEPS = 7;
const SIZES = [22, 18, 14, 11, 14, 18, 22];
const COLORS = [
  "#3fcf7f", "#5fd39a", "#8fd7ab",
  "#9a92c9",
  "#a887e6", "#9a6ee8", "#8a54e6",
];

export function LikertScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full">
      <span className="text-xs text-accent-green font-semibold shrink-0 w-9">그렇다</span>
      <div className="flex items-center justify-between flex-1 px-1">
        {Array.from({ length: STEPS }, (_, i) => {
          const selected = value === i;
          const size = SIZES[i];
          const color = COLORS[i];
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}점`}
              onClick={() => onChange(i)}
              className="group flex items-center justify-center transition-transform duration-150 hover:scale-110"
              style={{ width: 28, height: 28 }}
            >
              <span
                className="rounded-full transition-all duration-150"
                style={{
                  width: selected ? size + 6 : size,
                  height: selected ? size + 6 : size,
                  border: `2px solid ${color}`,
                  background: selected ? color : "transparent",
                  boxShadow: selected ? `0 0 12px ${color}80` : "none",
                }}
              />
            </button>
          );
        })}
      </div>
      <span className="text-xs text-accent-purple font-semibold shrink-0 w-16 text-right">그렇지 않다</span>
    </div>
  );
}

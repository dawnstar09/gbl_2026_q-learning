"use client";

export function TitleScreen({ onStart, onDuel }: { onStart: () => void; onDuel: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="죄수의 딜레마 — 나만 살 것인가, 함께 살 것인가?" className="w-full max-w-[280px] animate-float" />

        <button
          onClick={onStart}
          className="mt-4 w-full rounded-full bg-[#b9c8f6] py-[18px] text-lg font-extrabold text-[#0d0d14]
                     transition-all duration-200 hover:bg-[#a6b9f2] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          게임 시작
        </button>

        <button
          onClick={onDuel}
          className="mt-3 w-full rounded-full border-2 border-[#0d0d14] py-[15px] text-base font-extrabold text-[#0d0d14]
                     transition-all duration-200 hover:bg-[#0d0d14] hover:text-white hover:-translate-y-0.5 active:scale-[0.98]"
        >
          둘이서 대결
        </button>

        <p className="mt-6 text-[11px] text-[#6b7280] max-w-xs leading-relaxed">
          성격 → 보상 함수 → Q-learning 학습 → 전략 창발 → 토너먼트
        </p>
      </div>
    </div>
  );
}

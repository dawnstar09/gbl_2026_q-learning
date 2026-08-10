"use client";

import { LogoMark } from "../ui/LogoMark";

export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm flex flex-col items-center text-center animate-fade-in-up">
        <div className="animate-float">
          <LogoMark size={220} />
        </div>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#0d0d14]">죄수의 딜레마</h1>
        <p className="mt-2 text-[15px] font-medium text-[#0d0d14]">나만 살 것인가, 함께 살 것인가?</p>

        <button
          onClick={onStart}
          className="mt-8 w-full rounded-full bg-[#b9c8f6] py-[18px] text-lg font-extrabold text-[#0d0d14]
                     transition-all duration-200 hover:bg-[#a6b9f2] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          게임 시작
        </button>

        <p className="mt-6 text-[11px] text-[#6b7280] max-w-xs leading-relaxed">
          성격 → 보상 함수 → Q-learning 학습 → 전략 창발 → 토너먼트
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { IconDilemma, IconPersonalityToAgent, IconSteps } from "../ui/TutorialIcons";
import { Button } from "../ui/Button";

const SLIDES = [
  {
    Icon: IconDilemma,
    title: "죄수의 딜레마란?",
    body: "같은 상대와 반복해서 마주치는 게임이에요. 매 라운드 협력할지 배신할지 선택하는데, 둘 다 협력하면 함께 이득이지만 상대를 배신하면 혼자 더 큰 점수를 가져갈 수도 있어요.",
  },
  {
    Icon: IconPersonalityToAgent,
    title: "성격이 전략을 만들어요",
    body: "짧은 성격 설문(공감·경쟁심·위험회피·용서·단기이익)에 답하면, 그 성격을 그대로 물려받은 AI 요원이 만들어져요. 협력할지 배신할지는 사람이 정하지 않고, AI가 스스로 학습해서 결정해요.",
  },
  {
    Icon: IconSteps,
    title: "진행 순서는 이래요",
    body: "① 성격 설문에 답한다  →  ② 내 AI 요원이 학습한다  →  ③ 다른 전략들과 대결한 결과(협력률·전략 유형)를 확인한다. 이 세 단계만 따라오면 돼요.",
  },
];

export function TutorialScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 py-10">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div key={step} className="animate-fade-in-up flex flex-col items-center">
          <div className="mb-2">
            <slide.Icon size={104} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#0d0d14]">{slide.title}</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#3a3d4a]">{slide.body}</p>
        </div>

        <div className="flex items-center gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                background: i === step ? "#3b5bdb" : "#dcdfe6",
              }}
            />
          ))}
        </div>

        <div className="w-full flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button variant="ghost" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              이전
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
          >
            {isLast ? "시작하기" : "다음"}
          </Button>
        </div>

        {!isLast && (
          <button
            onClick={onDone}
            className="mt-4 text-xs text-[#8a8d9a] hover:text-[#3a3d4a] transition-colors"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}

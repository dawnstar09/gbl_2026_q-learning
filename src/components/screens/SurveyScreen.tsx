"use client";

import { useMemo, useState } from "react";
import { MascotAvatar } from "../ui/Mascot";
import { Button } from "../ui/Button";
import { LikertScale } from "../ui/LikertScale";
import { PillField } from "../ui/PillField";
import { ProgressBar } from "../ui/ProgressBar";
import { ScreenFrame } from "../ui/ScreenFrame";
import { computeTraits, DIM_LABELS, SCALE_ITEMS, TRAIT_KEYS, Traits } from "@/lib/engine";

export function SurveyScreen({
  participantIndex,
  totalParticipants,
  onComplete,
}: {
  participantIndex: number;
  totalParticipants: number;
  onComplete: (traits: Traits) => void;
}) {
  const [stage, setStage] = useState<"name" | number>("name");
  const [name, setName] = useState("");
  const [responses, setResponses] = useState<(number | null)[]>(
    () => new Array(SCALE_ITEMS.length).fill(null)
  );

  const dimGroups = useMemo(() => {
    return TRAIT_KEYS.map((key) => ({
      key,
      label: DIM_LABELS[key],
      indices: SCALE_ITEMS.map((it, i) => (it.dim === key ? i : -1)).filter((i) => i >= 0),
    }));
  }, []);

  const totalDims = dimGroups.length;

  if (stage === "name") {
    return (
      <ScreenFrame accent="neutral">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-text-faint">
            참가자 {participantIndex + 1}/{totalParticipants}
          </span>
          <MascotAvatar size={40} />
        </div>
        <div className="flex-1 flex flex-col justify-center gap-6 animate-fade-in-up">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold">참가자 정보</h2>
            <p className="text-xs text-text-muted">
              성격 설문 {SCALE_ITEMS.length}문항을 통해 에이전트의 보상 함수를 만듭니다.
            </p>
          </div>
          <PillField
            label="이름 또는 별명"
            type="text"
            placeholder={`참가자${participantIndex + 1}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full sm:w-full"
          />
        </div>
        <Button className="w-full mt-6" onClick={() => setStage(0)}>
          설문 시작
        </Button>
      </ScreenFrame>
    );
  }

  const dimIdx = stage as number;
  const group = dimGroups[dimIdx];
  const answeredAll = group.indices.every((i) => responses[i] !== null);
  const progress = (dimIdx + 1) / totalDims;

  const setAnswer = (qIndex: number, value: number) => {
    setResponses((prev) => {
      const next = [...prev];
      next[qIndex] = value;
      return next;
    });
  };

  const goNext = () => {
    if (dimIdx + 1 < totalDims) {
      setStage(dimIdx + 1);
    } else {
      const finalName = name.trim() || `참가자${participantIndex + 1}`;
      const traits = computeTraits(finalName, responses as number[]);
      onComplete(traits);
    }
  };

  return (
    <ScreenFrame accent="purple">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-text-faint">
          {name || `참가자${participantIndex + 1}`} · {dimIdx + 1}/{totalDims}
        </span>
        <MascotAvatar size={40} />
      </div>

      <div className="mb-5">
        <ProgressBar value={progress} colorVar="var(--accent-purple)" />
      </div>

      <div className="flex-1 flex flex-col gap-7 overflow-y-auto pr-1 animate-fade-in-up" key={dimIdx}>
        <h2 className="text-base font-bold text-text-primary">▶ {group.label}</h2>
        {group.indices.map((qIndex) => (
          <div key={qIndex} className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-text-primary">{SCALE_ITEMS[qIndex].question}</p>
            <LikertScale value={responses[qIndex]} onChange={(v) => setAnswer(qIndex, v)} />
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        {dimIdx > 0 && (
          <Button variant="ghost" className="flex-1" onClick={() => setStage(dimIdx - 1)}>
            이전
          </Button>
        )}
        <Button className="flex-1" disabled={!answeredAll} onClick={goNext}>
          {dimIdx + 1 < totalDims ? "다음" : "설문 완료"}
        </Button>
      </div>
    </ScreenFrame>
  );
}

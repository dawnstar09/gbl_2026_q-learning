"use client";

import { useState } from "react";
import { MascotAvatar } from "../ui/Mascot";
import { Button } from "../ui/Button";
import { PillField } from "../ui/PillField";
import { ScreenFrame } from "../ui/ScreenFrame";

export interface ExperimentSettings {
  nPeople: number;
  episodes: number;
  rounds: number;
  prefix: string;
}

export function SettingsScreen({
  onNext,
}: {
  onNext: (settings: ExperimentSettings) => void;
}) {
  const [nPeople, setNPeople] = useState("2");
  const [episodes, setEpisodes] = useState("3000");
  const [rounds, setRounds] = useState("200");
  const [prefix, setPrefix] = useState("ql_result");

  const nPeopleNum = Math.max(1, parseInt(nPeople) || 2);
  const canProceed = nPeopleNum >= 1;

  return (
    <ScreenFrame accent="neutral">
      <div className="flex justify-end mb-2">
        <MascotAvatar size={40} />
      </div>

      <div className="flex-1 flex flex-col gap-7 animate-fade-in-up">
        <h2 className="text-lg font-bold">[실험 설정]</h2>

        <div className="flex flex-col gap-5">
          <PillField
            label="참가 인원 수"
            type="number"
            min={1}
            max={12}
            placeholder="숫자를 적어주세요."
            value={nPeople}
            onChange={(e) => setNPeople(e.target.value)}
          />
          <PillField
            label="학습 에피소드 수"
            hint="기본 3000, 많을수록 정교함"
            type="number"
            min={100}
            step={100}
            placeholder="숫자를 적어주세요."
            value={episodes}
            onChange={(e) => setEpisodes(e.target.value)}
          />
          <PillField
            label="토너먼트 라운드 수"
            hint="기본 200"
            type="number"
            min={10}
            step={10}
            placeholder="숫자를 적어주세요."
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
          />
          <PillField
            label="결과 파일 이름"
            hint="기본 'ql_result'"
            type="text"
            placeholder="숫자를 적어주세요."
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
      </div>

      <Button
        disabled={!canProceed}
        onClick={() =>
          onNext({
            nPeople: nPeopleNum,
            episodes: Math.max(100, parseInt(episodes) || 3000),
            rounds: Math.max(10, parseInt(rounds) || 200),
            prefix: prefix.trim() || "ql_result",
          })
        }
        className="w-full mt-6"
      >
        다음
      </Button>
    </ScreenFrame>
  );
}

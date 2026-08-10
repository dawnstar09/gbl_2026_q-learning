"use client";

import { useEffect, useRef, useState } from "react";
import { MascotAvatar } from "../ui/Mascot";
import { ProgressBar } from "../ui/ProgressBar";
import { ScreenFrame } from "../ui/ScreenFrame";
import { QLearningAgent, trainAgent, TrainProgress } from "@/lib/engine";

interface AgentProgress {
  id: string;
  name: string;
  status: "pending" | "training" | "done";
  progress: TrainProgress | null;
}

export function TrainingScreen({
  agents,
  episodes,
  onComplete,
}: {
  agents: QLearningAgent[];
  episodes: number;
  onComplete: () => void;
}) {
  const [rows, setRows] = useState<AgentProgress[]>(
    agents.map((a) => ({ id: a.id, name: a.name, status: "pending", progress: null }))
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      for (let i = 0; i < agents.length; i++) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "training" } : r)));
        await trainAgent(agents[i], episodes, 100, (p) => {
          setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, progress: p } : r)));
        });
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "done" } : r)));
      }
      onComplete();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallDone = rows.filter((r) => r.status === "done").length;

  return (
    <ScreenFrame accent="blue">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold">학습 중...</h2>
          <p className="text-xs text-text-muted mt-1">
            에이전트가 성격 기반 보상으로 전략을 스스로 학습하고 있어요
          </p>
        </div>
        <MascotAvatar size={44} />
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
        {rows.map((row, i) => {
          const pct = row.progress ? row.progress.episode / row.progress.episodes : 0;
          const active = row.status === "training";
          return (
            <div key={row.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-between items-baseline mb-2">
                <span className={`text-sm font-semibold ${active ? "text-text-primary" : "text-text-muted"}`}>
                  {row.status === "done" ? "✓ " : ""}
                  {row.name}
                </span>
                <span className="text-[11px] text-text-faint">
                  {row.status === "pending" && "대기 중"}
                  {row.status === "training" && row.progress && (
                    <>
                      {row.progress.episode}/{row.progress.episodes} · ε={row.progress.eps.toFixed(2)} · 평균
                      {row.progress.recentAvg.toFixed(0)}점
                    </>
                  )}
                  {row.status === "done" && "학습 완료"}
                </span>
              </div>
              <ProgressBar
                value={pct}
                colorVar={row.status === "done" ? "var(--accent-green)" : "var(--accent-blue)"}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center text-xs text-text-faint">
        전체 진행 {overallDone}/{agents.length}
      </div>
    </ScreenFrame>
  );
}

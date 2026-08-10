"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MascotAvatar } from "../ui/Mascot";
import { Button } from "../ui/Button";
import { ScreenFrame } from "../ui/ScreenFrame";
import {
  Agent,
  BASELINE_CLASSES,
  buildResultsCSV,
  classify,
  downloadCSV,
  QLearningAgent,
  TournamentResult,
  traitCorrelations,
} from "@/lib/engine";

export function ResultsScreen({
  agents,
  summary,
  prefix,
  onRestart,
}: {
  agents: Agent[];
  summary: Record<string, TournamentResult>;
  prefix: string;
  onRestart: () => void;
}) {
  const qlAgents = useMemo(() => agents.filter((a): a is QLearningAgent => a instanceof QLearningAgent), [agents]);

  const ranked = useMemo(
    () => Object.entries(summary).sort((a, b) => b[1].avgScore - a[1].avgScore),
    [summary]
  );

  const chartData = useMemo(
    () =>
      ranked.map(([id, d]) => ({
        id,
        name: d.name,
        coopRate: Math.round(d.coopRate * 1000) / 10,
        avgScore: Math.round(d.avgScore * 100) / 100,
        isQL: agents.find((a) => a.id === id) instanceof QLearningAgent,
      })),
    [ranked, agents]
  );

  const correlations = useMemo(() => traitCorrelations(qlAgents), [qlAgents]);

  const colorFor = (isQL: boolean, kind: "coop" | "score") =>
    isQL ? (kind === "coop" ? "#3b5bdb" : "#7c3aed") : "#c2c6d1";

  return (
    <ScreenFrame accent="green" wide>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold">토너먼트 결과</h2>
          <p className="text-xs text-text-muted mt-1">
            QL 에이전트 {qlAgents.length}명 · 기준 전략 {BASELINE_CLASSES.length}종
          </p>
        </div>
        <MascotAvatar size={44} />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-8">
        {/* 순위표 */}
        <section className="animate-fade-in-up">
          <h3 className="text-sm font-bold text-text-primary mb-3">순위표</h3>
          <div className="overflow-x-auto rounded-2xl border border-border-soft">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-panel-2 text-text-muted">
                  <th className="text-left px-3 py-2 font-medium">에이전트</th>
                  <th className="text-right px-3 py-2 font-medium">평균점수</th>
                  <th className="text-right px-3 py-2 font-medium">협력률</th>
                  <th className="text-right px-3 py-2 font-medium">전략분류</th>
                  <th className="text-right px-3 py-2 font-medium">Q(C)&gt;Q(D)</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(([id, d]) => {
                  const agent = agents.find((a) => a.id === id)!;
                  const isQL = agent instanceof QLearningAgent;
                  return (
                    <tr key={id} className="border-t border-border-soft/60">
                      <td className="px-3 py-2 font-medium text-text-primary">
                        {isQL && <span className="text-accent-lavender mr-1">★</span>}
                        {d.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.avgScore.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(d.coopRate * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right text-text-muted">{classify(d.coopRate)}</td>
                      <td className="px-3 py-2 text-right text-text-muted">
                        {isQL ? `${(agent as QLearningAgent).qSummary().statesPreferC}/64` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-text-faint mt-2">★ = QL 에이전트 (학습됨)</p>
        </section>

        {/* 차트 */}
        <section className="animate-fade-in-up grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-3">협력률 (%)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} interval={0} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#ffffff", border: "1px solid #e2e2e6", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#0d0d14" }}
                  />
                  <Bar dataKey="coopRate" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={colorFor(d.isQL, "coop")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary mb-3">라운드당 평균 점수</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} interval={0} angle={-35} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{ background: "#ffffff", border: "1px solid #e2e2e6", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#0d0d14" }}
                  />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={colorFor(d.isQL, "score")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Q-table 분석 */}
        {qlAgents.length > 0 && (
          <section className="animate-fade-in-up">
            <h3 className="text-sm font-bold text-text-primary mb-3">Q-table 전략 분석</h3>
            <div className="overflow-x-auto rounded-2xl border border-border-soft">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-bg-panel-2 text-text-muted">
                    <th className="text-left px-3 py-2 font-medium">이름</th>
                    <th className="text-right px-3 py-2 font-medium">Q(C) 평균</th>
                    <th className="text-right px-3 py-2 font-medium">Q(D) 평균</th>
                    <th className="text-right px-3 py-2 font-medium">선호 전략</th>
                  </tr>
                </thead>
                <tbody>
                  {qlAgents.map((ag) => {
                    const qs = ag.qSummary();
                    const prefer = qs.avgQC > qs.avgQD ? "협력" : "배신";
                    return (
                      <tr key={ag.id} className="border-t border-border-soft/60">
                        <td className="px-3 py-2 font-medium text-text-primary">{ag.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{qs.avgQC.toFixed(3)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{qs.avgQD.toFixed(3)}</td>
                        <td
                          className="px-3 py-2 text-right font-medium"
                          style={{ color: prefer === "협력" ? "var(--accent-blue)" : "var(--accent-purple)" }}
                        >
                          {prefer}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 성격-협력률 상관 */}
        {qlAgents.length >= 2 && (
          <section className="animate-fade-in-up">
            <h3 className="text-sm font-bold text-text-primary mb-3">성격-협력률 상관 (피어슨 r)</h3>
            <div className="flex flex-col gap-2.5">
              {correlations.map((c) => {
                const width = Math.min(100, Math.abs(c.r) * 100);
                const positive = c.r >= 0;
                return (
                  <div key={c.key} className="flex items-center gap-3 text-xs">
                    <span className="w-24 shrink-0 text-text-muted">{c.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-bg-panel-2 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-border-soft" />
                      <div
                        className="absolute inset-y-0 rounded-full"
                        style={{
                          width: `${width / 2}%`,
                          left: positive ? "50%" : `${50 - width / 2}%`,
                          background: positive ? "var(--accent-blue)" : "var(--accent-purple)",
                        }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right tabular-nums text-text-faint">
                      {c.r >= 0 ? "+" : ""}
                      {c.r.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="ghost" className="flex-1" onClick={onRestart}>
          다시 하기
        </Button>
        <Button
          className="flex-1"
          onClick={() => downloadCSV(`${prefix}_결과.csv`, buildResultsCSV(summary, agents))}
        >
          CSV 다운로드
        </Button>
      </div>
    </ScreenFrame>
  );
}

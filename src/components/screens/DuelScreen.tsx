"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { Action, PAYOFF } from "@/lib/engine";
import {
  sfxBetrayWin,
  sfxBetrayed,
  sfxCountBeep,
  sfxDraw,
  sfxDrumroll,
  sfxLock,
  sfxMutualCoop,
  sfxMutualDefect,
  sfxSelect,
  sfxTick,
  sfxTickUrgent,
  sfxVictory,
  setMuted,
  unlockAudio,
} from "@/lib/sfx";

type Stage = "setup" | "handoff" | "choose" | "reveal" | "round" | "final";

const CHOICE_SECONDS = 8;

interface RoundLog {
  round: number;
  a: Action;
  b: Action;
  pa: number;
  pb: number;
}

/** 화면 공통 셸. 렌더 중 컴포넌트가 새로 생성되지 않도록 모듈 최상위에 둔다. */
function DuelShell({
  children,
  shake,
  flash,
  showHud,
  round,
  nRounds,
  scores,
  labels,
  muted,
  onToggleMute,
  onExit,
}: {
  children: ReactNode;
  shake: boolean;
  flash: boolean;
  showHud: boolean;
  round: number;
  nRounds: number;
  scores: [number, number];
  labels: [string, string];
  muted: boolean;
  onToggleMute: () => void;
  onExit: () => void;
}) {
  return (
    <div
      className={`min-h-screen w-full bg-[#0b0e1a] text-[#f3f4fb] flex flex-col ${
        shake ? "animate-duel-shake" : ""
      }`}
    >
      {flash && <div className="fixed inset-0 bg-[#ff4d4d] pointer-events-none z-50 animate-duel-flash" />}

      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button onClick={onExit} className="text-xs text-white/45 hover:text-white/80 transition-colors">
          ← 나가기
        </button>
        {showHud && (
          <div className="text-xs tracking-[0.25em] text-white/45">
            ROUND {round} / {nRounds}
          </div>
        )}
        <button onClick={onToggleMute} className="text-xs text-white/45 hover:text-white/80 transition-colors">
          {muted ? "소리 켜기" : "소리 끄기"}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">{children}</div>

      {showHud && (
        <div className="flex border-t border-white/10">
          {([0, 1] as const).map((i) => (
            <div key={i} className={`flex-1 px-5 py-3 text-center ${i === 0 ? "border-r border-white/10" : ""}`}>
              <div className="text-[11px] text-white/40 truncate">{labels[i]}</div>
              <div className="text-xl font-black tabular-nums">{scores[i]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DuelScreen({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [names, setNames] = useState(["", ""]);
  const [totalRounds, setTotalRounds] = useState("10");

  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [picks, setPicks] = useState<[Action | null, Action | null]>([null, null]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [log, setLog] = useState<RoundLog[]>([]);
  const [left, setLeft] = useState(CHOICE_SECONDS);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [muted, setMutedState] = useState(false);

  const nRounds = Math.max(1, Math.min(50, parseInt(totalRounds) || 10));
  const label = useCallback((i: 0 | 1) => names[i].trim() || `${i + 1}P`, [names]);
  const labels: [string, string] = [label(0), label(1)];

  const commit = useCallback(
    (choice: Action) => {
      sfxSelect();
      setPicks((prev) => {
        const next: [Action | null, Action | null] = [prev[0], prev[1]];
        next[turn] = choice;
        return next;
      });
      window.setTimeout(() => {
        sfxLock();
        if (turn === 0) {
          setTurn(1);
          setStage("handoff");
        } else {
          setCountdown(3);
          setStage("reveal");
        }
      }, 260);
    },
    [turn]
  );

  // ── 선택 제한시간 ───────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "choose") return;
    const deadline = Date.now() + CHOICE_SECONDS * 1000;
    let shown = CHOICE_SECONDS;
    const id = window.setInterval(() => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remain !== shown) {
        shown = remain;
        setLeft(remain);
        if (remain > 0) (remain <= 3 ? sfxTickUrgent : sfxTick)();
      }
      if (remain <= 0) {
        window.clearInterval(id);
        commit("D"); // 시간 초과는 자백으로 처리
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [stage, turn, round, commit]);

  // ── 공개 카운트다운 ─────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "reveal") return;
    sfxDrumroll(3.0);
    sfxCountBeep(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n > 0) sfxCountBeep(n);
      else window.clearInterval(id);
    }, 900);
    return () => window.clearInterval(id);
  }, [stage]);

  // ── 카운트다운 종료 → 결과 확정 ─────────────────────────────────
  useEffect(() => {
    if (stage !== "reveal" || countdown !== 0) return;
    const id = window.setTimeout(() => {
      const a = picks[0] as Action;
      const b = picks[1] as Action;
      const [pa, pb] = PAYOFF[`${a},${b}`];

      setScores(([x, y]) => [x + pa, y + pb]);
      setLog((l) => [...l, { round, a, b, pa, pb }]);

      if (a === "C" && b === "C") {
        sfxMutualCoop();
      } else if (a === "D" && b === "D") {
        sfxMutualDefect();
        setShake(true);
      } else {
        sfxBetrayed();
        sfxBetrayWin();
        setFlash(true);
        setShake(true);
      }
      window.setTimeout(() => {
        setFlash(false);
        setShake(false);
      }, 620);
      setStage("round");
    }, 700);
    return () => window.clearTimeout(id);
  }, [countdown, stage, picks, round]);

  const beginChoosing = () => {
    unlockAudio();
    setLeft(CHOICE_SECONDS);
    setStage("choose");
  };

  const nextRound = () => {
    if (round >= nRounds) {
      const [x, y] = scores;
      if (x === y) sfxDraw();
      else sfxVictory();
      setStage("final");
      return;
    }
    setRound((r) => r + 1);
    setPicks([null, null]);
    setTurn(0);
    setStage("handoff");
  };

  const restart = () => {
    setRound(1);
    setTurn(0);
    setPicks([null, null]);
    setScores([0, 0]);
    setLog([]);
    setStage("handoff");
  };

  const toggleMute = () => {
    const v = !muted;
    setMutedState(v);
    setMuted(v);
  };

  const shell = (children: ReactNode, showHud = true) => (
    <DuelShell
      shake={shake}
      flash={flash}
      showHud={showHud}
      round={round}
      nRounds={nRounds}
      scores={scores}
      labels={labels}
      muted={muted}
      onToggleMute={toggleMute}
      onExit={onExit}
    >
      {children}
    </DuelShell>
  );

  // ── 설정 ────────────────────────────────────────────────────────
  if (stage === "setup") {
    return shell(
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.3em] text-[#b9c8f6] mb-3">INTERROGATION ROOM</div>
          <h1 className="text-3xl font-black">둘이서 대결</h1>
          <p className="mt-3 text-[13px] text-white/55 leading-relaxed">
            한 대의 기기를 번갈아 넘기며 진행합니다.
            <br />
            차례가 아닌 사람은 화면을 보지 마세요.
          </p>
        </div>

        <div className="space-y-3">
          {([0, 1] as const).map((i) => (
            <input
              key={i}
              value={names[i]}
              onChange={(e) =>
                setNames((n) => (i === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))
              }
              placeholder={`${i + 1}P 이름`}
              className="w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-sm
                         outline-none transition-colors focus:border-[#b9c8f6] placeholder:text-white/30"
            />
          ))}
          <label className="flex items-center justify-between gap-3 pt-1">
            <span className="text-sm text-white/70">라운드 수</span>
            <input
              type="number"
              min={1}
              max={50}
              value={totalRounds}
              onChange={(e) => setTotalRounds(e.target.value)}
              className="w-24 rounded-xl bg-white/[0.06] border border-white/15 px-3 py-2 text-sm text-center
                         outline-none transition-colors focus:border-[#b9c8f6]"
            />
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-white/12 bg-white/[0.04] p-4 text-[12px] leading-relaxed text-white/60">
          <div className="font-bold text-white/80 mb-1.5">규칙</div>
          둘 다 침묵 <b className="text-[#7fe0a8]">+3점씩</b> · 둘 다 자백{" "}
          <b className="text-white/80">+1점씩</b>
          <br />
          혼자 자백하면 <b className="text-[#ff8f8f]">자백 5점 / 침묵 0점</b>
          <br />
          제한시간 {CHOICE_SECONDS}초를 넘기면 자동으로 <b className="text-[#ff8f8f]">자백</b> 처리됩니다.
        </div>

        <button
          onClick={() => {
            unlockAudio();
            sfxLock();
            setStage("handoff");
          }}
          className="mt-6 w-full rounded-full bg-[#b9c8f6] py-4 text-base font-extrabold text-[#0d0d14]
                     transition-all hover:bg-[#a6b9f2] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          대결 시작
        </button>
      </div>,
      false
    );
  }

  // ── 기기 전달 ───────────────────────────────────────────────────
  if (stage === "handoff") {
    return shell(
      <div className="text-center animate-duel-pop">
        <div className="text-[11px] tracking-[0.3em] text-white/35 mb-4">PASS THE DEVICE</div>
        <div className="text-5xl font-black text-[#b9c8f6] mb-3">{label(turn)}</div>
        <p className="text-sm text-white/55">님에게 기기를 넘겨주세요</p>
        <p className="mt-2 text-xs text-white/35">상대는 화면을 보면 안 됩니다</p>
        <button
          onClick={beginChoosing}
          className="mt-9 rounded-full bg-white/10 border border-white/20 px-10 py-3.5 text-sm font-bold
                     transition-all hover:bg-white/16 active:scale-[0.97]"
        >
          준비됐어요
        </button>
      </div>
    );
  }

  // ── 선택 ────────────────────────────────────────────────────────
  if (stage === "choose") {
    const urgent = left <= 3;
    return shell(
      <div className="w-full max-w-sm text-center">
        <div className="text-xs text-white/40 mb-1">{label(turn)}의 선택</div>

        <div
          className={`mx-auto my-5 w-24 h-24 rounded-full border-4 flex items-center justify-center ${
            urgent ? "border-[#ff5a5a] animate-duel-ring" : "border-white/25"
          }`}
        >
          <span className={`text-4xl font-black tabular-nums ${urgent ? "text-[#ff5a5a]" : "text-white"}`}>
            {left}
          </span>
        </div>

        <p className="text-sm text-white/55 mb-7">형사가 당신을 보고 있습니다</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => commit("C")}
            className="rounded-2xl border-2 border-[#3f9e6a] bg-[#3f9e6a]/10 px-4 py-7
                       transition-all hover:bg-[#3f9e6a]/22 hover:-translate-y-1 active:scale-[0.97]"
          >
            <div className="text-2xl font-black text-[#7fe0a8]">침묵</div>
            <div className="mt-1.5 text-[11px] text-white/45">동료를 믿는다</div>
          </button>
          <button
            onClick={() => commit("D")}
            className="rounded-2xl border-2 border-[#c0453f] bg-[#c0453f]/10 px-4 py-7
                       transition-all hover:bg-[#c0453f]/22 hover:-translate-y-1 active:scale-[0.97]"
          >
            <div className="text-2xl font-black text-[#ff8f8f]">자백</div>
            <div className="mt-1.5 text-[11px] text-white/45">먼저 살아남는다</div>
          </button>
        </div>
      </div>
    );
  }

  // ── 공개 ────────────────────────────────────────────────────────
  if (stage === "reveal") {
    return shell(
      <div className="text-center">
        {countdown > 0 ? (
          <>
            <p className="text-sm text-white/50 mb-6">두 사람의 진술을 공개합니다</p>
            <div key={countdown} className="text-[8rem] leading-none font-black text-[#b9c8f6] animate-duel-pop">
              {countdown}
            </div>
          </>
        ) : (
          <div className="text-3xl font-black text-white/70 animate-duel-pop">공개!</div>
        )}
      </div>
    );
  }

  // ── 라운드 결과 ─────────────────────────────────────────────────
  if (stage === "round") {
    const a = picks[0] as Action;
    const b = picks[1] as Action;
    const [pa, pb] = PAYOFF[`${a},${b}`];
    const verdict =
      a === "C" && b === "C"
        ? { t: "둘 다 침묵했다", d: "서로를 믿은 대가로 함께 이득을 얻는다", c: "#7fe0a8" }
        : a === "D" && b === "D"
        ? { t: "둘 다 자백했다", d: "서로를 못 믿어 둘 다 손해를 봤다", c: "#c9ccd8" }
        : { t: `${label(a === "D" ? 0 : 1)}의 배신`, d: "한 사람만 살아남았다", c: "#ff8f8f" };

    return shell(
      <div className="w-full max-w-sm text-center">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([0, 1] as const).map((i) => {
            const act = i === 0 ? a : b;
            const gained = i === 0 ? pa : pb;
            const coop = act === "C";
            return (
              <div
                key={i}
                className="rounded-2xl border-2 px-3 py-6 animate-duel-flip"
                style={{
                  borderColor: coop ? "#3f9e6a" : "#c0453f",
                  background: coop ? "rgba(63,158,106,0.12)" : "rgba(192,69,63,0.12)",
                  animationDelay: `${i * 0.14}s`,
                }}
              >
                <div className="text-[11px] text-white/45 truncate mb-1">{label(i)}</div>
                <div className={`text-2xl font-black ${coop ? "text-[#7fe0a8]" : "text-[#ff8f8f]"}`}>
                  {coop ? "침묵" : "자백"}
                </div>
                <div className="mt-2 text-lg font-bold tabular-nums">+{gained}</div>
              </div>
            );
          })}
        </div>

        <div className="text-xl font-black mb-1.5" style={{ color: verdict.c }}>
          {verdict.t}
        </div>
        <p className="text-[13px] text-white/50">{verdict.d}</p>

        <button
          onClick={nextRound}
          className="mt-9 w-full rounded-full bg-[#b9c8f6] py-3.5 text-sm font-extrabold text-[#0d0d14]
                     transition-all hover:bg-[#a6b9f2] active:scale-[0.98]"
        >
          {round >= nRounds ? "최종 결과 보기" : "다음 라운드"}
        </button>
      </div>
    );
  }

  // ── 최종 결과 ───────────────────────────────────────────────────
  const [x, y] = scores;
  const winner = x === y ? null : x > y ? 0 : 1;
  const coopCount = log.filter((l) => l.a === "C" && l.b === "C").length;

  return shell(
    <div className="w-full max-w-sm text-center animate-fade-in-up">
      <div className="text-[11px] tracking-[0.3em] text-white/35 mb-3">FINAL VERDICT</div>
      {winner === null ? (
        <div className="text-3xl font-black text-[#b9c8f6] mb-2">무승부</div>
      ) : (
        <>
          <div className="text-4xl font-black text-[#b9c8f6] mb-1 animate-duel-pop">
            {label(winner as 0 | 1)}
          </div>
          <div className="text-sm text-white/55 mb-2">승리</div>
        </>
      )}
      <div className="text-2xl font-black tabular-nums mb-6">
        {x} <span className="text-white/30">:</span> {y}
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-left text-[12px] text-white/60 mb-4">
        <div className="flex justify-between py-0.5">
          <span>총 라운드</span>
          <span className="text-white/85">{log.length}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>둘 다 침묵한 라운드</span>
          <span className="text-[#7fe0a8]">{coopCount}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>합계 점수</span>
          <span className="text-white/85">{x + y}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 text-[11px] leading-relaxed text-white/45">
          매 라운드 둘 다 침묵했다면 각자 {log.length * 3}점씩 얻을 수 있었습니다.
        </div>
      </div>

      <div className="max-h-32 overflow-y-auto rounded-2xl border border-white/12 mb-6">
        <table className="w-full text-[11px]">
          <thead className="bg-white/[0.06] text-white/45 sticky top-0">
            <tr>
              <th className="py-1.5 font-medium">R</th>
              <th className="py-1.5 font-medium truncate">{label(0)}</th>
              <th className="py-1.5 font-medium truncate">{label(1)}</th>
              <th className="py-1.5 font-medium">점수</th>
            </tr>
          </thead>
          <tbody>
            {log.map((l) => (
              <tr key={l.round} className="border-t border-white/8">
                <td className="py-1 text-white/40">{l.round}</td>
                <td className={`py-1 ${l.a === "C" ? "text-[#7fe0a8]" : "text-[#ff8f8f]"}`}>
                  {l.a === "C" ? "침묵" : "자백"}
                </td>
                <td className={`py-1 ${l.b === "C" ? "text-[#7fe0a8]" : "text-[#ff8f8f]"}`}>
                  {l.b === "C" ? "침묵" : "자백"}
                </td>
                <td className="py-1 tabular-nums text-white/60">
                  {l.pa}:{l.pb}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={restart}
          className="flex-1 rounded-full border border-white/20 py-3.5 text-sm font-bold text-white/75
                     transition-all hover:bg-white/10 active:scale-[0.98]"
        >
          다시 대결
        </button>
        <button
          onClick={onExit}
          className="flex-1 rounded-full bg-[#b9c8f6] py-3.5 text-sm font-extrabold text-[#0d0d14]
                     transition-all hover:bg-[#a6b9f2] active:scale-[0.98]"
        >
          처음으로
        </button>
      </div>
    </div>
  );
}

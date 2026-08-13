/**
 * 보고서용 수치 산출 실험 하니스
 *
 * 웹앱이 실제로 사용하는 src/lib/engine.ts 를 그대로 컴파일해서 불러온다.
 * (paper/build/engine.js — tsc 로 생성)
 *
 * 재현성을 위해 Math.random 을 시드 기반 PRNG(mulberry32)로 교체한다.
 */
const E = require("./build/engine.js");
const fs = require("fs");

// ─── 시드 기반 PRNG ────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function setSeed(seed) {
  Math.random = mulberry32(seed);
}

// ─── 공통 설정 ─────────────────────────────────────────────────────
const EPISODES = 3000;
const ROUNDS_PER_EP = 100;
const TOURNEY_ROUNDS = 200;

function makeTraits(name, o) {
  return {
    name,
    empathy: o.empathy ?? 0.5,
    risk_aversion: o.risk_aversion ?? 0.5,
    competitiveness: o.competitiveness ?? 0.5,
    forgiveness: o.forgiveness ?? 0.5,
    short_term: o.short_term ?? 0.5,
  };
}

// 학습은 비동기 청크 콜백 없이 동기적으로 수행 (trainAgent 은 await 필요)
async function trainOne(agent) {
  await E.trainAgent(agent, EPISODES, ROUNDS_PER_EP);
}

/** QL 에이전트 1명을 5개 기준 전략과만 대전시켜 평가 (통제 실험용) */
function evalAgainstBaselines(agent) {
  const baselines = E.BASELINE_CLASSES.map((C) => new C());
  const summary = E.runTournament([agent, ...baselines], TOURNEY_ROUNDS);
  const mine = summary[agent.id];
  const qs = agent.qSummary();
  return {
    coopRate: mine.coopRate,
    avgScore: mine.avgScore,
    avgQC: qs.avgQC,
    avgQD: qs.avgQD,
    statesPreferC: qs.statesPreferC,
    statesPreferD: qs.statesPreferD,
  };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

// ══════════════════════════════════════════════════════════════════
// 실험 A: 통제 실험 — 한 번에 한 특성만 변화, 나머지는 0.5 고정
// ══════════════════════════════════════════════════════════════════
async function experimentA() {
  const TRAITS = ["empathy", "competitiveness", "risk_aversion", "forgiveness", "short_term"];
  const LEVELS = [0.0, 0.25, 0.5, 0.75, 1.0];
  const REPS = 3;

  const results = {};
  for (const trait of TRAITS) {
    results[trait] = [];
    for (const level of LEVELS) {
      const runs = [];
      for (let rep = 0; rep < REPS; rep++) {
        setSeed(1000 + rep * 7919 + LEVELS.indexOf(level) * 131 + TRAITS.indexOf(trait) * 17);
        const traits = makeTraits(`${trait}=${level}`, { [trait]: level });
        const agent = new E.QLearningAgent(traits.name, traits);
        await trainOne(agent);
        runs.push(evalAgainstBaselines(agent));
      }
      results[trait].push({
        level,
        coopRate: mean(runs.map((r) => r.coopRate)),
        coopRateSD: Math.sqrt(
          mean(runs.map((r) => (r.coopRate - mean(runs.map((x) => x.coopRate))) ** 2))
        ),
        avgScore: mean(runs.map((r) => r.avgScore)),
        avgQC: mean(runs.map((r) => r.avgQC)),
        avgQD: mean(runs.map((r) => r.avgQD)),
        statesPreferC: mean(runs.map((r) => r.statesPreferC)),
      });
      process.stderr.write(`  A: ${trait}=${level} done\n`);
    }
  }
  return results;
}

// ══════════════════════════════════════════════════════════════════
// 실험 B: 모의 참가자 코호트 — 무작위 성격 20명 + 기준전략 5종 전체 토너먼트
// ══════════════════════════════════════════════════════════════════
async function experimentB() {
  const N = 20;
  setSeed(20260813);
  const rnd = Math.random;

  const cohort = [];
  for (let i = 0; i < N; i++) {
    cohort.push(
      makeTraits(`P${String(i + 1).padStart(2, "0")}`, {
        empathy: Math.round(rnd() * 100) / 100,
        risk_aversion: Math.round(rnd() * 100) / 100,
        competitiveness: Math.round(rnd() * 100) / 100,
        forgiveness: Math.round(rnd() * 100) / 100,
        short_term: Math.round(rnd() * 100) / 100,
      })
    );
  }

  const agents = [];
  for (let i = 0; i < N; i++) {
    setSeed(50000 + i * 3571);
    const a = new E.QLearningAgent(cohort[i].name, cohort[i]);
    await trainOne(a);
    agents.push(a);
    process.stderr.write(`  B: trained ${cohort[i].name}\n`);
  }

  setSeed(777);
  const baselines = E.BASELINE_CLASSES.map((C) => new C());
  const all = [...agents, ...baselines];
  const summary = E.runTournament(all, TOURNEY_ROUNDS);

  const rows = agents.map((a) => {
    const s = summary[a.id];
    const qs = a.qSummary();
    return {
      name: a.name,
      traits: a.traits,
      coopRate: s.coopRate,
      avgScore: s.avgScore,
      avgQC: qs.avgQC,
      avgQD: qs.avgQD,
      statesPreferC: qs.statesPreferC,
      classify: E.classify(s.coopRate),
    };
  });

  const baseRows = baselines.map((b) => {
    const s = summary[b.id];
    return { name: b.name, coopRate: s.coopRate, avgScore: s.avgScore };
  });

  const corr = E.traitCorrelations(agents);

  return { rows, baseRows, corr };
}

// ══════════════════════════════════════════════════════════════════
// 부록: 수식 검증용 소규모 계산
// ══════════════════════════════════════════════════════════════════
function appendix() {
  // (1) 문항 구성
  const counts = {};
  for (const it of E.SCALE_ITEMS) {
    counts[it.dim] = counts[it.dim] || { total: 0, reverse: 0 };
    counts[it.dim].total += 1;
    if (it.reverse) counts[it.dim].reverse += 1;
  }

  // (2) 예시 참가자 응답 (0~6 인덱스 = 리커트 1~7점)
  //     모든 문항에 "그렇다" 쪽으로 응답한 가상의 참가자
  const exampleRaw = E.SCALE_ITEMS.map((_, i) => [5, 1, 4, 5, 4, 2, 3, 2, 3, 4, 4, 5, 5, 1, 4, 2, 5, 4, 1, 5, 2, 4, 1, 5, 3, 1, 5][i]);
  const exampleTraits = E.computeTraits("예시참가자", exampleRaw);

  // 차원별 상세 계산 내역
  const detail = {};
  E.SCALE_ITEMS.forEach((it, i) => {
    const raw = exampleRaw[i];
    const adj = it.reverse ? 6 - raw : raw;
    const norm = adj / 6;
    detail[it.dim] = detail[it.dim] || [];
    detail[it.dim].push({ idx: i + 1, q: it.question, reverse: it.reverse, raw, adj, norm });
  });

  // (3) 예시 참가자의 보상함수 값 (4가지 결과 × 직전행동 유무)
  const outcomes = [
    ["C", "C"],
    ["C", "D"],
    ["D", "C"],
    ["D", "D"],
  ];
  const rewards = [];
  for (const [my, opp] of outcomes) {
    for (const prev of [null, "D"]) {
      rewards.push({
        my,
        opp,
        prev,
        base: E.PAYOFF[`${my},${opp}`][0],
        oppBase: E.PAYOFF[`${my},${opp}`][1],
        reward: E.shapedReward(my, opp, prev, exampleTraits),
      });
    }
  }

  // (4) 상태 인코딩 예시
  const stateExamples = [
    { my: [], opp: [] },
    { my: ["C", "D", "C"], opp: ["C", "C", "D"] },
    { my: ["D", "D", "D"], opp: ["D", "D", "D"] },
    { my: ["C", "C", "D"], opp: ["D", "C", "C"] },
  ].map((e) => ({ ...e, state: E.encodeState(e.my, e.opp) }));

  // (5) ε 감소 도달 시점
  const epsDecay = 0.9995;
  const nToFloor = Math.log(0.05 / 1.0) / Math.log(epsDecay);

  return {
    counts,
    exampleRaw,
    exampleTraits,
    detail,
    rewards,
    stateExamples,
    nToFloor,
    nStates: E.N_STATES,
    memory: E.MEMORY,
    payoff: E.PAYOFF,
  };
}

// ══════════════════════════════════════════════════════════════════
(async () => {
  const t0 = Date.now();
  const out = {};

  out.appendix = appendix();
  process.stderr.write("appendix done\n");

  out.experimentA = await experimentA();
  process.stderr.write(`experimentA done (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);

  out.experimentB = await experimentB();
  process.stderr.write(`experimentB done (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);

  out.config = { EPISODES, ROUNDS_PER_EP, TOURNEY_ROUNDS };

  fs.writeFileSync(__dirname + "/results.json", JSON.stringify(out, null, 2), "utf-8");
  console.log("wrote results.json in", ((Date.now() - t0) / 1000).toFixed(1), "s");
})();

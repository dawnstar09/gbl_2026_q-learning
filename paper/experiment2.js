/**
 * 보고서용 본실험 하니스 (v2)
 *
 *  실험 A  통제 실험 : 한 번에 한 특성만 0→1 로 변화 (반복 15회)
 *  실험 B  코호트     : 무작위 성격 40명 + 기준전략 5종 전체 토너먼트 → 상관분석
 *  실험 C  계수 재조정: 공감 계수 κ_e 를 2.0(현행)→8.0 으로 올리며 협력 창발 검증
 *
 * 웹앱이 실제 사용하는 src/lib/engine.ts 를 컴파일한 build/engine.js 를 그대로 쓴다.
 * 재현성을 위해 Math.random 을 mulberry32 로 교체한다.
 */
const E = require("./build/engine.js");
const fs = require("fs");

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
const setSeed = (s) => (Math.random = mulberry32(s));

const EPISODES = 3000;
const ROUNDS_PER_EP = 100;
const TOURNEY_ROUNDS = 200;
const REPS_A = 15;
const N_B = 40;
const REPS_C = 10;

const makeTraits = (name, o) => ({
  name,
  empathy: o.empathy ?? 0.5,
  risk_aversion: o.risk_aversion ?? 0.5,
  competitiveness: o.competitiveness ?? 0.5,
  forgiveness: o.forgiveness ?? 0.5,
  short_term: o.short_term ?? 0.5,
});

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const pearson = (xs, ys) => {
  const mx = mean(xs), my = mean(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  return den > 1e-12 ? num / den : 0;
};

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
  };
}

// ─── 실험 A ────────────────────────────────────────────────────────
async function experimentA() {
  const TRAITS = ["empathy", "competitiveness", "risk_aversion", "forgiveness", "short_term"];
  const LEVELS = [0.0, 0.25, 0.5, 0.75, 1.0];
  const out = {};

  for (const trait of TRAITS) {
    const perLevel = [];
    const allX = [], allY = [];
    for (const level of LEVELS) {
      const runs = [];
      for (let rep = 0; rep < REPS_A; rep++) {
        setSeed(100003 + rep * 7919 + LEVELS.indexOf(level) * 1301 + TRAITS.indexOf(trait) * 104729);
        const t = makeTraits(`${trait}=${level}`, { [trait]: level });
        const agent = new E.QLearningAgent(t.name, t);
        await E.trainAgent(agent, EPISODES, ROUNDS_PER_EP);
        const r = evalAgainstBaselines(agent);
        runs.push(r);
        allX.push(level);
        allY.push(r.coopRate);
      }
      const cr = runs.map((r) => r.coopRate);
      perLevel.push({
        level,
        n: REPS_A,
        coopRate: mean(cr),
        coopSD: sd(cr),
        coopSEM: sd(cr) / Math.sqrt(REPS_A),
        avgScore: mean(runs.map((r) => r.avgScore)),
        avgQC: mean(runs.map((r) => r.avgQC)),
        avgQD: mean(runs.map((r) => r.avgQD)),
        statesPreferC: mean(runs.map((r) => r.statesPreferC)),
      });
      process.stderr.write(`  A ${trait}=${level}\n`);
    }
    out[trait] = { perLevel, r: pearson(allX, allY), n: allX.length };
  }
  return out;
}

// ─── 실험 B ────────────────────────────────────────────────────────
async function experimentB() {
  setSeed(20260813);
  const rnd = Math.random;
  const cohort = [];
  for (let i = 0; i < N_B; i++) {
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
  for (let i = 0; i < N_B; i++) {
    setSeed(500009 + i * 35719);
    const a = new E.QLearningAgent(cohort[i].name, cohort[i]);
    await E.trainAgent(a, EPISODES, ROUNDS_PER_EP);
    agents.push(a);
    process.stderr.write(`  B ${cohort[i].name}\n`);
  }

  setSeed(777);
  const baselines = E.BASELINE_CLASSES.map((C) => new C());
  const summary = E.runTournament([...agents, ...baselines], TOURNEY_ROUNDS);

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
  const baseRows = baselines.map((b) => ({
    name: b.name,
    coopRate: summary[b.id].coopRate,
    avgScore: summary[b.id].avgScore,
  }));

  return { rows, baseRows, corr: E.traitCorrelations(agents) };
}

// ─── 실험 C : 공감 계수 κ_e 재조정 ────────────────────────────────
// engine 의 shapedReward 를 κ_e 만 바꿔 재현한 변형 보상함수
function shapedRewardK(my, opp, prevMy, t, kappaE) {
  const [myS, oppS] = E.PAYOFF[`${my},${opp}`];
  let r = myS;
  if (my === "C" && opp === "C") r += t.empathy * kappaE;
  if (my === "C" && opp === "D") r -= t.empathy * 1.0;
  r += t.competitiveness * (myS - oppS) * 0.8;
  r *= 1.0 + t.short_term * 0.4;
  if (myS === 0) r -= t.risk_aversion * 2.0;
  if (prevMy === "D" && my === "C") r += t.forgiveness * 1.5;
  return r;
}

function playEpisodeK(agent, opp, rounds, kappaE) {
  agent.resetGame();
  opp.resetGame();
  const my = [], op = [];
  for (let i = 0; i < rounds; i++) {
    const prevState = E.encodeState(my, op);
    const prevMy = my.length ? my[my.length - 1] : null;
    const a = agent.decide();
    const b = opp.decide();
    const rew = shapedRewardK(a, b, prevMy, agent.traits, kappaE);
    agent.update(a, b);
    opp.update(b, a);
    my.push(a);
    op.push(b);
    agent.learn(prevState, a, rew, E.encodeState(my, op));
  }
}

function trainAgentK(agent, kappaE) {
  const opponents = E.BASELINE_CLASSES.map((C) => new C());
  for (let ep = 0; ep < EPISODES; ep++) {
    const opp =
      Math.random() < 0.4
        ? agent.clone()
        : opponents[Math.floor(Math.random() * opponents.length)];
    playEpisodeK(agent, opp, ROUNDS_PER_EP, kappaE);
  }
  agent.isTraining = false;
}

function experimentC() {
  const KAPPAS = [2.0, 4.0, 6.0, 8.0];
  const out = [];
  for (const k of KAPPAS) {
    const runs = [];
    for (let rep = 0; rep < REPS_C; rep++) {
      setSeed(900007 + rep * 6151 + Math.round(k * 10) * 97);
      // 공감 최대·경쟁심 최소 조건에서 검증 (T−R = 2 + 4c − κ_e·e 가 최소가 되는 지점)
      const t = makeTraits(`k=${k}`, { empathy: 1.0, competitiveness: 0.0 });
      const agent = new E.QLearningAgent(t.name, t);
      trainAgentK(agent, k);
      runs.push(evalAgainstBaselines(agent));
    }
    const cr = runs.map((r) => r.coopRate);
    out.push({
      kappaE: k,
      // 성형 보수행렬에서의 T−R (e=1, c=0)
      TminusR: 5 + 4 * 0.0 - (3 + k * 1.0),
      n: REPS_C,
      coopRate: mean(cr),
      coopSD: sd(cr),
      coopSEM: sd(cr) / Math.sqrt(REPS_C),
      avgScore: mean(runs.map((r) => r.avgScore)),
      avgQC: mean(runs.map((r) => r.avgQC)),
      avgQD: mean(runs.map((r) => r.avgQD)),
      statesPreferC: mean(runs.map((r) => r.statesPreferC)),
    });
    process.stderr.write(`  C kappa=${k}\n`);
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
(async () => {
  const t0 = Date.now();
  const out = { config: { EPISODES, ROUNDS_PER_EP, TOURNEY_ROUNDS, REPS_A, N_B, REPS_C } };

  out.experimentC = experimentC();
  process.stderr.write(`C done ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);

  out.experimentA = await experimentA();
  process.stderr.write(`A done ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);

  out.experimentB = await experimentB();
  process.stderr.write(`B done ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);

  fs.writeFileSync(__dirname + "/results2.json", JSON.stringify(out, null, 2), "utf-8");
  console.log("done", ((Date.now() - t0) / 1000).toFixed(1), "s");
})();

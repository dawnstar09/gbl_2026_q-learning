// 죄수의 딜레마 Q-learning 성격 에이전트 시뮬레이터
// dilemma_ql_agent.py 의 TypeScript 포팅

export type Action = "C" | "D";

export const PAYOFF: Record<string, [number, number]> = {
  "C,C": [3, 3],
  "C,D": [0, 5],
  "D,C": [5, 0],
  "D,D": [1, 1],
};

export const ACTIONS: Action[] = ["C", "D"];

export interface Traits {
  name: string;
  empathy: number;
  risk_aversion: number;
  competitiveness: number;
  forgiveness: number;
  short_term: number;
}

export const TRAIT_KEYS = [
  "empathy",
  "risk_aversion",
  "competitiveness",
  "forgiveness",
  "short_term",
] as const;
export type TraitKey = (typeof TRAIT_KEYS)[number];

export const DIM_LABELS: Record<TraitKey, string> = {
  empathy: "공감 능력",
  risk_aversion: "위험 회피",
  competitiveness: "경쟁심",
  forgiveness: "용서 성향",
  short_term: "단기 이익 선호",
};

export interface ScaleItem {
  dim: TraitKey;
  question: string;
  reverse: boolean;
}

export const SCALE_ITEMS: ScaleItem[] = [
  // 공감 능력
  { dim: "empathy", question: "친구가 힘들어 보일 때 먼저 다가가는 편이다", reverse: false },
  { dim: "empathy", question: "낯선 사람이 어려움을 겪어도 그냥 지나치는 경우가 많다", reverse: true },
  { dim: "empathy", question: "다른 사람의 감정이 나에게 전해지는 경험을 자주 한다", reverse: false },
  { dim: "empathy", question: "누군가 공개적으로 비난받는 장면을 보면 불편하다", reverse: false },
  { dim: "empathy", question: "상대방 입장에서 생각하는 것이 어렵지 않다", reverse: false },
  { dim: "empathy", question: "갈등 상황에서 상대의 감정보다 사실 관계에 더 집중한다", reverse: true },

  // 위험 회피
  { dim: "risk_aversion", question: "결과가 확실하지 않으면 행동하기를 꺼린다", reverse: false },
  { dim: "risk_aversion", question: "기대 이익이 높아도 손실 가능성이 있으면 피한다", reverse: false },
  { dim: "risk_aversion", question: "새로운 도전보다 검증된 방법을 선택하는 편이다", reverse: false },
  { dim: "risk_aversion", question: "손실은 같은 크기의 이익보다 훨씬 크게 느껴진다", reverse: false },
  { dim: "risk_aversion", question: "큰 보상이 기대되면 불확실해도 기꺼이 시도한다", reverse: true },

  // 경쟁심
  { dim: "competitiveness", question: "게임이나 시험에서 지면 꼭 이기고 싶다는 생각이 든다", reverse: false },
  { dim: "competitiveness", question: "내가 남보다 더 나은 결과를 냈을 때 만족감이 크다", reverse: false },
  { dim: "competitiveness", question: "승패보다 과정이 더 중요하다고 생각한다", reverse: true },
  { dim: "competitiveness", question: "경쟁 상황에서 긴장감이 오히려 동기부여가 된다", reverse: false },
  { dim: "competitiveness", question: "반드시 이겨야 한다는 압박감을 잘 느끼지 않는다", reverse: true },
  { dim: "competitiveness", question: "상대가 앞서가고 있다는 걸 알면 더 열심히 하게 된다", reverse: false },

  // 용서 성향
  { dim: "forgiveness", question: "나에게 잘못한 사람을 대부분 용서할 수 있다", reverse: false },
  { dim: "forgiveness", question: "한 번 배신당한 상대는 다시 신뢰하기 어렵다", reverse: true },
  { dim: "forgiveness", question: "갈등 후에 먼저 화해를 제안하는 편이다", reverse: false },
  { dim: "forgiveness", question: "나에게 상처를 준 사람에 대한 감정이 오래 남는다", reverse: true },
  { dim: "forgiveness", question: "관계가 회복 가능하다면 과거는 덮어둘 수 있다", reverse: false },

  // 단기 이익 선호
  { dim: "short_term", question: "나중에 더 큰 보상보다 지금 당장의 적은 보상이 더 매력적이다", reverse: false },
  { dim: "short_term", question: "1년 뒤의 큰 이익을 위해 지금의 즐거움을 포기할 수 있다", reverse: true },
  { dim: "short_term", question: "계획을 세울 때 단기 목표에 집중하는 편이다", reverse: false },
  { dim: "short_term", question: "지금 당장의 이익보다 미래를 위한 투자가 더 중요하다", reverse: true },
  { dim: "short_term", question: "기다리는 것이 불편하고 빠른 결과를 원한다", reverse: false },
];

// 리커트 7점 척도(0~6) 응답을 0~1 정규화 점수로 변환 (역채점 반영)
export function scoreResponse(value0to6: number, reverse: boolean): number {
  const v = reverse ? 6 - value0to6 : value0to6;
  return v / 6;
}

export function computeTraits(name: string, responses: number[]): Traits {
  const sums: Record<TraitKey, number[]> = {
    empathy: [],
    risk_aversion: [],
    competitiveness: [],
    forgiveness: [],
    short_term: [],
  };
  SCALE_ITEMS.forEach((item, i) => {
    sums[item.dim].push(scoreResponse(responses[i], item.reverse));
  });
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0.5);
  return {
    name,
    empathy: avg(sums.empathy),
    risk_aversion: avg(sums.risk_aversion),
    competitiveness: avg(sums.competitiveness),
    forgiveness: avg(sums.forgiveness),
    short_term: avg(sums.short_term),
  };
}

// ─── 성격 기반 보상 함수 ───────────────────────────────────────────

export function shapedReward(
  myAction: Action,
  oppAction: Action,
  prevMyAction: Action | null,
  traits: Traits
): number {
  const [myScore, oppScore] = PAYOFF[`${myAction},${oppAction}`];
  let reward = myScore;

  const e = traits.empathy;
  const c = traits.competitiveness;
  const s = traits.short_term;
  const r = traits.risk_aversion;
  const f = traits.forgiveness;

  if (myAction === "C" && oppAction === "C") reward += e * 2.0;
  if (myAction === "C" && oppAction === "D") reward -= e * 1.0;

  const scoreDiff = myScore - oppScore;
  reward += c * scoreDiff * 0.8;

  reward *= 1.0 + s * 0.4;

  if (myScore === 0) reward -= r * 2.0;

  if (prevMyAction === "D" && myAction === "C") reward += f * 1.5;

  return reward;
}

// ─── 상태 인코딩 ───────────────────────────────────────────────────

export const MEMORY = 3;
export const N_STATES = 2 ** (2 * MEMORY); // 64

export function encodeState(myHist: Action[], oppHist: Action[]): number {
  const pad = (hist: Action[]) => {
    const filled: Action[] = new Array(MEMORY).fill("C");
    const combined = [...filled, ...hist];
    return combined.slice(-MEMORY);
  };
  const myPadded = pad(myHist);
  const oppPadded = pad(oppHist);
  const bits = [...myPadded, ...oppPadded].map((a) => (a === "C" ? 0 : 1));
  let state = 0;
  for (const b of bits) state = state * 2 + b;
  return state;
}

// ─── 에이전트 인터페이스 ───────────────────────────────────────────

// 이름은 참가자가 자유롭게 입력하므로 중복될 수 있다. 토너먼트 집계·React key 등
// 식별에는 항상 아래 id를 사용하고, name은 표시 전용으로만 사용한다.
let agentIdCounter = 0;
function nextAgentId(prefix: string): string {
  agentIdCounter += 1;
  return `${prefix}-${agentIdCounter}`;
}

export interface Agent {
  id: string;
  name: string;
  traits: Traits | Record<string, never>;
  decide(): Action;
  update(my: Action, opp: Action): void;
  resetGame(): void;
  coopRate(): number;
  totalScore: number;
  isTraining: boolean;
}

export class QLearningAgent implements Agent {
  id: string;
  name: string;
  traits: Traits;
  alpha: number;
  gamma: number;
  eps: number;
  epsEnd: number;
  epsDecay: number;
  Q: [number, number][];
  private myHist: Action[] = [];
  private oppHist: Action[] = [];
  totalScore = 0;
  isTraining = true;

  constructor(
    name: string,
    traits: Traits,
    opts: { alpha?: number; gamma?: number; epsStart?: number; epsEnd?: number; epsDecay?: number } = {}
  ) {
    this.id = nextAgentId("ql");
    this.name = name;
    this.traits = traits;
    this.alpha = opts.alpha ?? 0.1;
    this.gamma = opts.gamma ?? 0.95;
    this.eps = opts.epsStart ?? 1.0;
    this.epsEnd = opts.epsEnd ?? 0.05;
    this.epsDecay = opts.epsDecay ?? 0.9995;
    this.Q = Array.from({ length: N_STATES }, () => [0, 0] as [number, number]);
  }

  clone(): QLearningAgent {
    const copy = new QLearningAgent(this.name, this.traits, {
      alpha: this.alpha,
      gamma: this.gamma,
      epsStart: this.eps,
      epsEnd: this.epsEnd,
      epsDecay: this.epsDecay,
    });
    copy.Q = this.Q.map((row) => [row[0], row[1]] as [number, number]);
    copy.isTraining = false;
    return copy;
  }

  decide(): Action {
    const state = encodeState(this.myHist, this.oppHist);
    if (this.isTraining && Math.random() < this.eps) {
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    }
    const q = this.Q[state];
    return q[0] >= q[1] ? "C" : "D";
  }

  learn(prevState: number, action: Action, reward: number, nextState: number) {
    const aIdx = action === "C" ? 0 : 1;
    const qNow = this.Q[prevState][aIdx];
    const qNextMax = Math.max(this.Q[nextState][0], this.Q[nextState][1]);
    const tdTarget = reward + this.gamma * qNextMax;
    this.Q[prevState][aIdx] += this.alpha * (tdTarget - qNow);
    this.eps = Math.max(this.epsEnd, this.eps * this.epsDecay);
  }

  update(my: Action, opp: Action) {
    this.myHist.push(my);
    this.oppHist.push(opp);
  }

  resetGame() {
    this.myHist = [];
    this.oppHist = [];
  }

  coopRate(): number {
    return this.myHist.length ? this.myHist.filter((a) => a === "C").length / this.myHist.length : 0;
  }

  qSummary() {
    let totalC = 0;
    let totalD = 0;
    let preferC = 0;
    let preferD = 0;
    for (const row of this.Q) {
      totalC += row[0];
      totalD += row[1];
      if (row[0] > row[1]) preferC++;
      else if (row[1] > row[0]) preferD++;
    }
    return {
      avgQC: totalC / N_STATES,
      avgQD: totalD / N_STATES,
      statesPreferC: preferC,
      statesPreferD: preferD,
    };
  }
}

// ─── 기준 전략 ─────────────────────────────────────────────────────

abstract class BaselineAgent implements Agent {
  id: string;
  name: string;
  traits: Record<string, never> = {};
  totalScore = 0;
  isTraining = false;
  protected myHist: Action[] = [];
  protected oppHist: Action[] = [];

  constructor(name: string) {
    this.id = nextAgentId("bl");
    this.name = name;
  }

  abstract decide(): Action;

  update(my: Action, opp: Action) {
    this.myHist.push(my);
    this.oppHist.push(opp);
  }
  resetGame() {
    this.myHist = [];
    this.oppHist = [];
  }
  coopRate(): number {
    return this.myHist.length ? this.myHist.filter((a) => a === "C").length / this.myHist.length : 0;
  }
}

export class TitForTat extends BaselineAgent {
  constructor() {
    super("팃포탯");
  }
  decide(): Action {
    return this.oppHist.length === 0 ? "C" : this.oppHist[this.oppHist.length - 1];
  }
}

export class Grudger extends BaselineAgent {
  private grudge = false;
  constructor() {
    super("그루지");
  }
  decide(): Action {
    if (this.oppHist.includes("D")) this.grudge = true;
    return this.grudge ? "D" : "C";
  }
  resetGame() {
    super.resetGame();
    this.grudge = false;
  }
}

export class AlwaysCooperate extends BaselineAgent {
  constructor() {
    super("항상협력");
  }
  decide(): Action {
    return "C";
  }
}

export class AlwaysDefect extends BaselineAgent {
  constructor() {
    super("항상배신");
  }
  decide(): Action {
    return "D";
  }
}

export class RandomAgent extends BaselineAgent {
  constructor() {
    super("랜덤");
  }
  decide(): Action {
    return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  }
}

export const BASELINE_CLASSES = [TitForTat, Grudger, AlwaysCooperate, AlwaysDefect, RandomAgent];

// ─── 학습용 게임 ───────────────────────────────────────────────────

export function playTrainingEpisode(agent: QLearningAgent, opponent: Agent, rounds = 100): number {
  agent.resetGame();
  opponent.resetGame();
  let total = 0;

  const agentMy: Action[] = [];
  const agentOp: Action[] = [];

  for (let i = 0; i < rounds; i++) {
    const prevState = encodeState(agentMy, agentOp);
    const prevMy = agentMy.length ? agentMy[agentMy.length - 1] : null;

    const myAction = agent.decide();
    const oppAction = opponent.decide();

    const reward = shapedReward(myAction, oppAction, prevMy, agent.traits);
    const [myScore] = PAYOFF[`${myAction},${oppAction}`];
    total += myScore;

    agent.update(myAction, oppAction);
    opponent.update(oppAction, myAction);
    agentMy.push(myAction);
    agentOp.push(oppAction);

    const nextState = encodeState(agentMy, agentOp);
    agent.learn(prevState, myAction, reward, nextState);
  }

  return total;
}

export interface TrainProgress {
  episode: number;
  episodes: number;
  eps: number;
  recentAvg: number;
}

// episodes 를 청크 단위로 실행하고 진행률 콜백을 통해 UI 를 블로킹하지 않음
export async function trainAgent(
  agent: QLearningAgent,
  episodes = 3000,
  roundsPerEp = 100,
  onProgress?: (p: TrainProgress) => void
): Promise<number[]> {
  const opponents = BASELINE_CLASSES.map((Cls) => new Cls());
  const scoreLog: number[] = [];

  const CHUNK = 20;
  for (let ep = 0; ep < episodes; ep++) {
    let opp: Agent;
    if (Math.random() < 0.4) {
      opp = agent.clone();
    } else {
      opp = opponents[Math.floor(Math.random() * opponents.length)];
    }
    const score = playTrainingEpisode(agent, opp, roundsPerEp);
    scoreLog.push(score);

    if ((ep + 1) % CHUNK === 0 || ep === episodes - 1) {
      const window = scoreLog.slice(-500);
      const recentAvg = window.reduce((a, b) => a + b, 0) / window.length;
      onProgress?.({ episode: ep + 1, episodes, eps: agent.eps, recentAvg });
      // 메인 스레드 양보 (UI 애니메이션 유지)
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  agent.isTraining = false;
  return scoreLog;
}

// ─── 토너먼트 ─────────────────────────────────────────────────────

export function playMatch(a: Agent, b: Agent, rounds = 100): [number, number] {
  a.resetGame();
  b.resetGame();
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < rounds; i++) {
    const ac = a.decide();
    const bc = b.decide();
    const [pa, pb] = PAYOFF[`${ac},${bc}`];
    sa += pa;
    sb += pb;
    a.update(ac, bc);
    b.update(bc, ac);
  }
  return [sa, sb];
}

export interface TournamentResult {
  name: string;
  avgScore: number;
  coopRate: number;
}

// summary는 agent.id로 키를 잡는다 (참가자가 이름을 중복 입력할 수 있으므로 name은 표시 전용).
export function runTournament(agents: Agent[], rounds = 100): Record<string, TournamentResult> {
  const stats: Record<string, { score: number; rounds: number }> = {};
  agents.forEach((a) => (stats[a.id] = { score: 0, rounds: 0 }));

  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i];
      const b = agents[j];
      const [sa, sb] = playMatch(a, b, rounds);
      stats[a.id].score += sa;
      stats[a.id].rounds += rounds;
      stats[b.id].score += sb;
      stats[b.id].rounds += rounds;
    }
  }

  const summary: Record<string, TournamentResult> = {};
  for (const agent of agents) {
    const d = stats[agent.id];
    summary[agent.id] = {
      name: agent.name,
      avgScore: d.rounds ? d.score / d.rounds : 0,
      coopRate: agent.coopRate(),
    };
  }
  return summary;
}

// ─── 분석 ─────────────────────────────────────────────────────────

export function classify(cr: number): string {
  if (cr >= 0.8) return "협력형";
  if (cr >= 0.55) return "조건협력형";
  if (cr >= 0.3) return "기회주의형";
  return "배신형";
}

export function pearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0);
  const denX = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
  const denY = ys.reduce((sum, y) => sum + (y - my) ** 2, 0);
  const den = Math.sqrt(denX * denY);
  return den > 1e-9 ? num / den : 0;
}

export function traitCorrelations(qlAgents: QLearningAgent[]): { key: TraitKey; label: string; r: number }[] {
  return TRAIT_KEYS.map((key) => {
    const xs = qlAgents.map((a) => a.traits[key]);
    const ys = qlAgents.map((a) => a.coopRate());
    return { key, label: DIM_LABELS[key], r: pearsonCorrelation(xs, ys) };
  });
}

// ─── CSV 내보내기 ───────────────────────────────────────────────────

export function buildResultsCSV(summary: Record<string, TournamentResult>, agents: Agent[]): string {
  const header = [
    "이름", "평균점수", "협력률", "전략분류",
    "공감", "위험회피", "경쟁심", "용서", "단기이익",
    "Q(C)평균", "Q(D)평균", "협력선호상태수",
  ];
  const rows = [header];
  for (const [id, d] of Object.entries(summary)) {
    const agent = agents.find((a) => a.id === id)!;
    const tr = agent.traits as Partial<Traits>;
    let qData = ["", "", ""];
    if (agent instanceof QLearningAgent) {
      const qs = agent.qSummary();
      qData = [qs.avgQC.toFixed(3), qs.avgQD.toFixed(3), String(qs.statesPreferC)];
    }
    rows.push([
      d.name,
      d.avgScore.toFixed(3),
      d.coopRate.toFixed(3),
      classify(d.coopRate),
      tr.empathy?.toString() ?? "",
      tr.risk_aversion?.toString() ?? "",
      tr.competitiveness?.toString() ?? "",
      tr.forgiveness?.toString() ?? "",
      tr.short_term?.toString() ?? "",
      ...qData,
    ]);
  }
  return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Web Audio API로 합성하는 효과음.
 * 외부 오디오 파일 없이 브라우저에서 직접 파형을 만들기 때문에
 * 부스에서 오프라인으로 실행해도 소리가 그대로 난다.
 *
 * AudioContext는 사용자 제스처(버튼 클릭) 이후에만 재생 가능하므로
 * 첫 클릭 시 unlock()을 호출해 컨텍스트를 깨운다.
 */

let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

export function setMuted(v: boolean) {
  muted = v;
}

export function isMuted() {
  return muted;
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  at?: number;        // 시작 지연 (초)
  sweepTo?: number;   // 주파수 스윕 목표
}

function tone({ freq, dur, type = "sine", gain = 0.18, at = 0, sweepTo }: ToneOpts) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + at;

  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + dur);
  }

  // 클릭음 방지를 위한 짧은 어택 + 지수 감쇠
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.012, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur, gain = 0.12, at = 0, hp = 800 }: { dur: number; gain?: number; at?: number; hp?: number }) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + at;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = a.createBufferSource();
  src.buffer = buf;
  const filt = a.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = hp;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filt).connect(g).connect(a.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// ─── 개별 효과음 ────────────────────────────────────────────────────

/** 초읽기 일반 틱 */
export function sfxTick() {
  tone({ freq: 660, dur: 0.05, type: "square", gain: 0.07 });
}

/** 남은 시간이 얼마 없을 때의 다급한 틱 */
export function sfxTickUrgent() {
  tone({ freq: 1180, dur: 0.06, type: "square", gain: 0.13 });
}

/** 선택 버튼에 손이 닿을 때 */
export function sfxHover() {
  tone({ freq: 520, dur: 0.04, type: "triangle", gain: 0.05 });
}

/** 협력/배신을 고른 순간 */
export function sfxSelect() {
  tone({ freq: 420, dur: 0.13, type: "triangle", gain: 0.16, sweepTo: 860 });
}

/** 선택이 잠기고 다음 사람에게 넘어갈 때 */
export function sfxLock() {
  tone({ freq: 300, dur: 0.1, type: "square", gain: 0.14 });
  tone({ freq: 180, dur: 0.18, type: "square", gain: 0.14, at: 0.08 });
}

/** 공개 직전 드럼롤 */
export function sfxDrumroll(dur = 1.1) {
  const steps = Math.floor(dur / 0.045);
  for (let i = 0; i < steps; i++) {
    noise({ dur: 0.035, gain: 0.05 + (i / steps) * 0.11, at: i * 0.045, hp: 400 });
  }
}

/** 공개 카운트다운 3, 2, 1 */
export function sfxCountBeep(n: number) {
  const freq = n <= 1 ? 1046 : n === 2 ? 784 : 659;
  tone({ freq, dur: 0.16, type: "square", gain: 0.16 });
}

/** 둘 다 협력 — 따뜻한 장3화음 */
export function sfxMutualCoop() {
  tone({ freq: 523.25, dur: 0.5, type: "sine", gain: 0.16 });
  tone({ freq: 659.25, dur: 0.5, type: "sine", gain: 0.14, at: 0.04 });
  tone({ freq: 783.99, dur: 0.6, type: "sine", gain: 0.13, at: 0.08 });
}

/** 내가 배신당함 — 날카로운 하강 스팅 */
export function sfxBetrayed() {
  noise({ dur: 0.18, gain: 0.2, hp: 1800 });
  tone({ freq: 880, dur: 0.42, type: "sawtooth", gain: 0.18, sweepTo: 160 });
  tone({ freq: 622, dur: 0.42, type: "sawtooth", gain: 0.12, sweepTo: 110 });
}

/** 내가 배신에 성공 — 짧고 날카로운 상승 */
export function sfxBetrayWin() {
  tone({ freq: 300, dur: 0.16, type: "sawtooth", gain: 0.16, sweepTo: 720 });
  tone({ freq: 900, dur: 0.22, type: "square", gain: 0.1, at: 0.12 });
}

/** 둘 다 배신 — 낮고 둔탁한 울림 */
export function sfxMutualDefect() {
  tone({ freq: 150, dur: 0.55, type: "sawtooth", gain: 0.18, sweepTo: 88 });
  noise({ dur: 0.3, gain: 0.08, hp: 200 });
}

/** 최종 승리 팡파르 */
export function sfxVictory() {
  const seq = [523.25, 659.25, 783.99, 1046.5];
  seq.forEach((f, i) => tone({ freq: f, dur: 0.3, type: "triangle", gain: 0.17, at: i * 0.11 }));
  tone({ freq: 1318.5, dur: 0.6, type: "triangle", gain: 0.15, at: seq.length * 0.11 });
}

/** 무승부 */
export function sfxDraw() {
  tone({ freq: 440, dur: 0.35, type: "triangle", gain: 0.15 });
  tone({ freq: 440, dur: 0.45, type: "triangle", gain: 0.13, at: 0.2 });
}

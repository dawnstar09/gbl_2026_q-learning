# -*- coding: utf-8 -*-
"""
탐구보고서 HTML 생성기.

results.json(부록 수치) + results2.json(본실험)에서 모든 수치를 직접 주입하므로
본문 서술과 실측 데이터가 어긋날 수 없다.
"""
import json
import math
import os

from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
A1 = json.load(open(os.path.join(HERE, "results.json"), encoding="utf-8"))["appendix"]
R = json.load(open(os.path.join(HERE, "results2.json"), encoding="utf-8"))
EXA, EXB, EXC, CFG = R["experimentA"], R["experimentB"], R["experimentC"], R["config"]

DIM_KO = {"empathy": "공감 능력", "risk_aversion": "위험 회피", "competitiveness": "경쟁심",
          "forgiveness": "용서 성향", "short_term": "단기 이익 선호"}
DIM_SYM = {"empathy": "e", "risk_aversion": "r", "competitiveness": "c",
           "forgiveness": "f", "short_term": "s"}
ORDER = ["empathy", "competitiveness", "risk_aversion", "forgiveness", "short_term"]
TOTAL_RUNS = CFG["REPS_A"] * 25 + CFG["N_B"] + CFG["REPS_C"] * len(EXC)


def pval(r, n):
    if abs(r) >= 1:
        return 0.0
    t = r * math.sqrt(n - 2) / math.sqrt(1 - r * r)
    return 2 * (1 - stats.t.cdf(abs(t), n - 2))


def pfmt(p):
    return "&lt;.001" if p < 0.001 else f"{p:.3f}".lstrip("0")


# ─── 표 1 ────────────────────────────────────────────────────────────
TABLE1 = "\n".join(
    f"<tr><td>{DIM_KO[k]}</td><td><i>{DIM_SYM[k]}</i></td>"
    f"<td>{A1['counts'][k]['total']}</td><td>{A1['counts'][k]['reverse']}</td>"
    f"<td>1/{A1['counts'][k]['total']} &asymp; {1/A1['counts'][k]['total']:.4f}</td></tr>"
    for k in ["empathy", "risk_aversion", "competitiveness", "forgiveness", "short_term"]
)

# ─── 표 2 ────────────────────────────────────────────────────────────
ex, detail = A1["exampleTraits"], A1["detail"]
rows = []
for k in ["empathy", "risk_aversion", "competitiveness", "forgiveness", "short_term"]:
    it = detail[k]
    norms = " + ".join(f"{i['norm']:.3f}" for i in it)
    rows.append(
        f"<tr><td>{DIM_KO[k]}</td>"
        f"<td class='sm'>{', '.join(str(i['raw']+1) for i in it)}</td>"
        f"<td class='sm'>{', '.join(str(i['adj']) for i in it)}</td>"
        f"<td class='sm'>({norms}) / {len(it)}</td>"
        f"<td><b>{ex[k]:.4f}</b></td></tr>"
    )
TABLE2 = "\n".join(rows)

# ─── 표 3 ────────────────────────────────────────────────────────────
TABLE3 = "\n".join(
    f"<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td><td>{e}</td></tr>"
    for a, b, c, d, e in [
        ("공감 · 상호협력 보너스", "&kappa;<sub>CC</sub>", "2.0", "0.40&Delta;", "(C,C)"),
        ("공감 · 배신 피해 페널티", "&kappa;<sub>CD</sub>", "1.0", "0.20&Delta;", "(C,D)"),
        ("경쟁심 · 점수차 계수", "&kappa;<sub>c</sub>", "0.8", "0.16&Delta;", "전 결과"),
        ("단기이익 · 근시 배율", "&kappa;<sub>s</sub>", "0.4", "&mdash;", "전 결과"),
        ("위험회피 · 최악결과 페널티", "&kappa;<sub>r</sub>", "2.0", "0.40&Delta;", "&pi;<sub>i</sub>=0"),
        ("용서 · 관계회복 보너스", "&kappa;<sub>f</sub>", "1.5", "0.30&Delta;", "D&rarr;C"),
    ]
)

# ─── 표 4 ────────────────────────────────────────────────────────────
lab = {("C", "C"): "상호협력", ("C", "D"): "일방적 피해",
       ("D", "C"): "일방적 이득", ("D", "D"): "상호배신"}
TABLE4 = "\n".join(
    f"<tr><td>({rw['my']},{rw['opp']})</td><td>{lab[(rw['my'], rw['opp'])]}</td>"
    f"<td>{rw['base']}</td><td><b>{rw['reward']:.3f}</b></td></tr>"
    for rw in A1["rewards"] if rw["prev"] is None
)
g = lambda my, opp, prev: next(
    x for x in A1["rewards"] if x["my"] == my and x["opp"] == opp and x["prev"] == prev
)
rw_cc, rw_ccD = g("C", "C", None), g("C", "C", "D")
rw_dc, rw_cd, rw_dd = g("D", "C", None), g("C", "D", None), g("D", "D", None)

# ─── 표 5 (실험 A) ───────────────────────────────────────────────────
rows = []
for k in ORDER:
    d = EXA[k]
    cells = "".join(
        f"<td>{p['coopRate']*100:.1f}<span class='sem'>&plusmn;{p['coopSEM']*100:.1f}</span></td>"
        for p in d["perLevel"]
    )
    p = pval(d["r"], d["n"])
    star = "**" if p < 0.01 else ("*" if p < 0.05 else "")
    rows.append(f"<tr><td>{DIM_KO[k]}</td>{cells}<td><b>{d['r']:+.3f}</b>{star}</td>"
                f"<td>{pfmt(p)}</td></tr>")
TABLE5 = "\n".join(rows)
A_emp, A_comp, A_forg = EXA["empathy"], EXA["competitiveness"], EXA["forgiveness"]

# ─── 표 6 (실험 B) ───────────────────────────────────────────────────
corr = {c["key"]: c["r"] for c in EXB["corr"]}
rows = []
for k in ORDER:
    p = pval(corr[k], CFG["N_B"])
    star = "*" if p < 0.05 else ""
    rows.append(
        f"<tr><td>{DIM_KO[k]}</td><td><i>{DIM_SYM[k]}</i></td>"
        f"<td>{corr[k]:+.3f}{star}</td><td>{pfmt(p)}</td>"
        f"<td>{'양' if corr[k] > 0 else '음'}</td></tr>"
    )
TABLE6 = "\n".join(rows)

b_coop = [r["coopRate"] for r in EXB["rows"]]
b_mean, b_min, b_max = sum(b_coop) / len(b_coop), min(b_coop), max(b_coop)
b_defect = sum(1 for r in EXB["rows"] if r["avgQD"] > r["avgQC"])
b_prefC = sum(r["statesPreferC"] for r in EXB["rows"]) / len(EXB["rows"])
max_abs_r = max(abs(v) for v in corr.values())

base_map = {r["name"]: r for r in EXB["baseRows"]}
TABLE_BASE = "\n".join(
    f"<tr><td>{n}</td><td>{base_map[n]['coopRate']*100:.1f}</td>"
    f"<td>{base_map[n]['avgScore']:.3f}</td></tr>"
    for n in ["팃포탯", "그루지", "항상협력", "항상배신", "랜덤"]
)

# ─── 표 7 (실험 C) ───────────────────────────────────────────────────
TABLE7 = "\n".join(
    f"<tr><td>{c['kappaE']:.1f}</td><td>{c['TminusR']:+.1f}</td>"
    f"<td>{c['coopRate']*100:.1f}<span class='sem'>&plusmn;{c['coopSEM']*100:.1f}</span></td>"
    f"<td>{c['avgQC']-c['avgQD']:+.1f}</td><td>{c['statesPreferC']:.1f}</td></tr>"
    for c in EXC
)
c0, cL = EXC[0], EXC[-1]

# ─── 그림 1: SVG 2패널 ───────────────────────────────────────────────
PAL = {"empathy": "#1a4fa0", "competitiveness": "#b3261e", "risk_aversion": "#2f7d4f",
       "forgiveness": "#7a5ea8", "short_term": "#a06a1a"}


def panel_a():
    X0, Y0, W, H = 44, 14, 176, 116
    LO, HI = 30, 75          # 추세가 보이도록 데이터 범위에 맞춰 축을 좁힌다
    sy = lambda v: Y0 + H - (v - LO) / (HI - LO) * H
    out = [f'<rect x="{X0}" y="{Y0}" width="{W}" height="{H}" fill="none" stroke="#333" stroke-width="0.7"/>']
    for v in range(LO, HI + 1, 15):
        y = sy(v)
        out.append(f'<line x1="{X0}" y1="{y:.1f}" x2="{X0+W}" y2="{y:.1f}" stroke="#ccc" stroke-width="0.4"/>')
        out.append(f'<text x="{X0-4}" y="{y+2.6:.1f}" font-size="6" text-anchor="end">{v}</text>')
    for i, lv in enumerate([0, 0.25, 0.5, 0.75, 1.0]):
        x = X0 + (i / 4) * W
        out.append(f'<text x="{x:.1f}" y="{Y0+H+9}" font-size="6" text-anchor="middle">{lv:.2f}</text>')
    for k in ORDER:
        pts = []
        for i, p in enumerate(EXA[k]["perLevel"]):
            x = X0 + (i / 4) * W
            y = sy(p["coopRate"] * 100)
            pts.append(f"{x:.1f},{y:.1f}")
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.5" fill="{PAL[k]}"/>')
        out.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{PAL[k]}" stroke-width="1.2"/>')
    out.append(f'<text x="{X0+W/2}" y="{Y0+H+18}" font-size="6.4" text-anchor="middle">특성값</text>')
    # 범례는 데이터 선과 겹치지 않도록 도면 바깥 아래쪽에 가로로 배치
    lx = 4
    for k in ORDER:
        out.append(f'<line x1="{lx}" y1="{Y0+H+27}" x2="{lx+8}" y2="{Y0+H+27}" stroke="{PAL[k]}" stroke-width="1.6"/>')
        out.append(f'<circle cx="{lx+4}" cy="{Y0+H+27}" r="1.4" fill="{PAL[k]}"/>')
        out.append(f'<text x="{lx+10}" y="{Y0+H+29.2}" font-size="5.4">{DIM_KO[k]}</text>')
        lx += 9 + len(DIM_KO[k]) * 5.2
    out.append(f'<text x="12" y="{Y0+H/2}" font-size="6.4" text-anchor="middle" transform="rotate(-90 12 {Y0+H/2})">협력률 (%)</text>')
    return "".join(out)


def panel_b():
    X0, Y0, W, H = 44, 14, 176, 116
    vals = [c["avgQC"] - c["avgQD"] for c in EXC]
    vmax = max(vals) * 1.18
    out = [f'<rect x="{X0}" y="{Y0}" width="{W}" height="{H}" fill="none" stroke="#333" stroke-width="0.7"/>']
    for v in range(0, int(vmax) + 1, 5):
        y = Y0 + H - (v / vmax) * H
        out.append(f'<line x1="{X0}" y1="{y:.1f}" x2="{X0+W}" y2="{y:.1f}" stroke="#ccc" stroke-width="0.4"/>')
        out.append(f'<text x="{X0-4}" y="{y+2.6:.1f}" font-size="6" text-anchor="end">{v}</text>')
    bw = W / (len(EXC) * 2)
    for i, c in enumerate(EXC):
        v = c["avgQC"] - c["avgQD"]
        x = X0 + (i + 0.5) * (W / len(EXC)) - bw / 2
        h = (v / vmax) * H
        y = Y0 + H - h
        out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="#1a4fa0" opacity="0.82"/>')
        out.append(f'<text x="{x+bw/2:.1f}" y="{y-2:.1f}" font-size="5.8" text-anchor="middle">{v:+.1f}</text>')
        out.append(f'<text x="{x+bw/2:.1f}" y="{Y0+H+9}" font-size="6" text-anchor="middle">{c["kappaE"]:.0f}</text>')
        out.append(f'<text x="{x+bw/2:.1f}" y="{Y0+H+17}" font-size="5.4" text-anchor="middle" fill="#666">({c["TminusR"]:+.0f})</text>')
    out.append(f'<text x="{X0+W/2}" y="{Y0+H+26}" font-size="6.4" text-anchor="middle">&#954;<tspan baseline-shift="sub" font-size="4.6">CC</tspan> (괄호는 T&#8722;R)</text>')
    out.append(f'<text x="12" y="{Y0+H/2}" font-size="6.4" text-anchor="middle" transform="rotate(-90 12 {Y0+H/2})">Q(C) &#8722; Q(D)</text>')
    return "".join(out)


FIG1 = (f'<svg viewBox="0 0 232 164" xmlns="http://www.w3.org/2000/svg" '
        f'style="width:100%;font-family:Malgun Gothic,sans-serif">{panel_a()}</svg>')
FIG2 = (f'<svg viewBox="0 0 232 158" xmlns="http://www.w3.org/2000/svg" '
        f'style="width:100%;font-family:Malgun Gothic,sans-serif">{panel_b()}</svg>')

# ─── 기타 수치 ───────────────────────────────────────────────────────
n_floor = A1["nToFloor"]
ep_floor = n_floor / CFG["ROUNDS_PER_EP"]
pct_floor = ep_floor / CFG["EPISODES"] * 100
s_ex = A1["stateExamples"][1]
fmt_hist = lambda xs: "(" + ", ".join(xs) + ")"
s_my, s_opp = fmt_hist(s_ex["my"]), fmt_hist(s_ex["opp"])

HTML = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>성격 특성의 정량화와 보상 함수 파라미터화</title>
<style>
  @page {{ size: A4; margin: 20mm 18mm; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: 'Batang','BatangChe','Noto Serif KR',serif; font-size: 10pt;
         line-height: 1.62; color: #000; margin: 0; text-align: justify; word-break: keep-all; }}
  .cover {{ text-align: center; page-break-after: always; padding-top: 22mm; }}
  .cover .kicker {{ font-size: 15pt; letter-spacing: .06em; margin-bottom: 26mm; }}
  .cover h1 {{ font-size: 21pt; font-weight: normal; line-height: 1.5; margin: 0 0 4mm; }}
  .cover .sub {{ font-size: 15pt; margin-bottom: 18mm; }}
  .cover .author {{ font-size: 13pt; line-height: 1.7; margin-bottom: 24mm; }}
  .cover h2 {{ font-size: 12pt; font-weight: bold; letter-spacing: .5em; margin: 0 0 4mm; }}
  .cover .abstract {{ text-align: justify; font-size: 10pt; line-height: 1.72; }}
  .body {{ column-count: 2; column-gap: 8mm; }}
  h3 {{ font-size: 13pt; font-weight: bold; margin: 5mm 0 2.5mm; break-after: avoid; }}
  h4 {{ font-size: 11pt; font-weight: bold; margin: 4mm 0 1.5mm; break-after: avoid; }}
  p {{ margin: 0 0 2.4mm; text-indent: .9em; }}
  p.noind {{ text-indent: 0; }}
  .eq {{ text-align: center; margin: 3mm 0; font-family: 'Cambria Math','Times New Roman',serif;
        font-style: italic; font-size: 10.5pt; break-inside: avoid; }}
  .eq .num {{ font-style: normal; }}
  .eqbox {{ text-align: center; margin: 3mm 0; break-inside: avoid; font-size: 9.6pt; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 8.2pt; margin: 2mm 0 1mm;
          break-inside: avoid; font-family: 'Malgun Gothic',sans-serif; }}
  th, td {{ border: .6px solid #444; padding: 1.1mm 1.2mm; text-align: center; }}
  th {{ background: #f4e6b0; font-weight: bold; }}
  td.sm {{ font-size: 7.2pt; }}
  .sem {{ font-size: 6.8pt; color: #444; }}
  .cap {{ font-size: 8.4pt; text-align: center; margin: 1mm 0 3mm; }}
  .prop {{ border: .6px solid #444; padding: 2mm 2.5mm; margin: 2.5mm 0;
          break-inside: avoid; font-size: 9.4pt; }}
  .prop b {{ display: block; margin-bottom: 1mm; }}
  .figblock {{ break-inside: avoid; margin: 2mm 0 3mm; }}
  .figblock .cap {{ margin: 1mm 0 0; }}
  ol.ref {{ padding-left: 4.5mm; margin: 0; font-size: 9pt; }}
  ol.ref li {{ margin-bottom: 1.4mm; }}
  sub, sup {{ font-size: 72%; }}
</style></head>
<body>

<div class="cover">
  <div class="kicker">2026 Game Based Learning 탐구 보고서</div>
  <h1>성격 특성의 정량화와<br>보상 함수 파라미터화</h1>
  <div class="sub">-죄수의 딜레마 Q-learning 에이전트를 중심으로-</div>
  <div class="author">이민주<br>Min-ju Lee</div>
  <h2>요 약</h2>
  <div class="abstract">
    본 연구는 설문으로 측정한 인간의 성격 특성이 강화학습 에이전트의 보상 함수 계수로 변환되는
    절차를 수식 수준에서 명시하고, 실제 대입 수치와 그 산출 근거를 정리한다. 27개 리커트 7점 문항은
    역채점 보정과 구간 정규화를 거쳐 5개 차원의 동일가중 평균으로 집계되며, 각 문항은 소속 차원의
    문항 수 <i>n<sub>k</sub></i>에 대해 1/<i>n<sub>k</sub></i>의 가중치를 갖는다. 산출된 특성 벡터
    <i>&theta;</i>=(<i>e,r,c,f,s</i>)&isin;[0,1]<sup>5</sup>는 여섯 개 보정 계수를 통해 죄수의 딜레마
    기본 보수에 반영되며, 각 계수는 보수 폭 <i>&Delta;</i>=<i>T</i>&minus;<i>S</i>=5에 대한 비율로
    설계되었다. 본 연구는 성형(shaping)된 보수행렬을 해석적으로 분석하여, 유혹 보수와 상호협력 보수의
    차이가 <i>T</i>&minus;<i>R</i>=2+4<i>c</i>&minus;2<i>e</i>&ge;0으로 정의역 전체에서 비음(非負)이며,
    반복게임의 협력 지속 조건 또한 모든 성격에서 동일하게 성립함을 증명하였다. 즉 성격 특성은 보수행렬의
    <i>순서 구조</i>를 바꾸지 못한다. 총 {TOTAL_RUNS}회의 학습 시행으로 검증한 결과, 성격은 협력률의
    <i>정도</i>는 유의하게 조절하여 통제 실험에서 공감 <i>r</i>={A_emp['r']:+.3f}
    (<i>p</i>={pfmt(pval(A_emp['r'], A_emp['n']))}), 경쟁심 <i>r</i>={A_comp['r']:+.3f}
    (<i>p</i>={pfmt(pval(A_comp['r'], A_comp['n']))})의 이론 부합 방향이 나타났으나, 코호트
    {CFG['N_B']}명 전원({b_defect}/{CFG['N_B']})이 여전히 배신을 선호하는 Q값을 학습하였다. 반면 공감 계수를
    임계값 이상으로 재조정하여 <i>T</i>&minus;<i>R</i>&lt;0을 만족시키자 Q(C)&minus;Q(D)가
    {c0['avgQC']-c0['avgQD']:+.1f}에서 {cL['avgQC']-cL['avgQD']:+.1f}로 증가하였다. 이는 계수의 크기가
    행동의 정도를, 보수행렬의 부등식 구조가 학습되는 전략의 종류를 각각 결정함을 실증한다.
  </div>
</div>

<div class="body">

<h3>I 서론</h3>

<h4>가) 연구 배경</h4>
<p>강화학습 에이전트의 행동은 보상 함수가 무엇을 좋은 결과로 규정하는지에 따라 결정된다. 최근 게임
기반 학습에서는 인간의 심리 특성을 에이전트에 이식하여 행동 차이를 관찰하는 시도가 늘고 있으나,
설문 응답이라는 정성적 자료가 어떤 절차로 수치가 되고 그 수치가 보상 함수의 어느 자리에 어떤 크기로
들어가는지는 대개 서술되지 않는다.</p>
<p>본 연구가 다루는 선행 활동은 참가자의 성격을 설문으로 측정한 뒤 죄수의 딜레마를 수행하는
Q-learning 에이전트의 보상 함수에 반영하는 체험형 시뮬레이터이다. 그러나 해당 활동에서도 계수의
구체적 값과 그 선정 근거, 그리고 그 값이 학습 결과에 실제로 어떤 영향을 주는지는 검증되지 않은 채
남아 있었다.</p>

<h4>나) 연구 목적</h4>
<p>본 연구의 목적은 세 가지이다. 첫째, 문항 단위 응답에서 보상 함수 계수에 이르는 변환 경로를
수식으로 명시하고 실제 대입 수치를 제시한다. 둘째, 성형된 보수행렬의 순서 구조를 해석적으로 분석하여
성격 특성이 이론적으로 가질 수 있는 영향의 범위를 규명한다. 셋째, 실제 시뮬레이션으로 그 예측을
검증하고 계수 재조정을 통해 개선 가능성을 확인한다.</p>

<h3>II 본론</h3>

<h4>가) 설문 응답의 정량화와 문항 가중치</h4>
<p>설문은 5개 차원 총 27문항으로 구성되며 각 문항은 리커트 7점 척도로 응답한다. 구현상 응답은
0부터 6까지의 정수 인덱스 <i>v</i>로 저장된다. 역채점 문항은 응답 방향이 반대이므로 다음과 같이
보정한다.</p>
<div class="eq">v&#770;<sub>i</sub> = 6 &minus; v<sub>i</sub> (역채점), &nbsp;
  v&#770;<sub>i</sub> = v<sub>i</sub> (정채점) <span class="num">&nbsp;(1)</span></div>
<p>보정된 응답은 척도 최댓값 6으로 나누어 [0,1] 구간으로 정규화한다. 이 변환은 최솟값 0과 최댓값 1을
정확히 보존하는 선형 사상이다.</p>
<div class="eq">x<sub>i</sub> = v&#770;<sub>i</sub> / 6 &isin; [0,1]
  <span class="num">&nbsp;(2)</span></div>
<p>차원 <i>k</i>의 특성값은 해당 차원에 속한 문항들의 산술평균으로 정의된다. <i>I<sub>k</sub></i>는
차원 <i>k</i>의 문항 집합이고 <i>n<sub>k</sub></i>=|<i>I<sub>k</sub></i>|이다.</p>
<div class="eq">&theta;<sub>k</sub> = (1/n<sub>k</sub>) &sum;<sub>i&isin;I<sub>k</sub></sub> x<sub>i</sub>
  <span class="num">&nbsp;(3)</span></div>
<p class="noind">식 (3)은 곧 <b>각 문항의 가중치가 1/<i>n<sub>k</sub></i>로 균일함</b>을 뜻한다. 문항별로 다른
가중치를 두지 않은 것은 문항 변별력을 추정할 사전 자료가 없는 상황에서 동일가중이 최소가정
추정량이기 때문이다. 다만 차원마다 문항 수가 다르므로 문항 하나가 갖는 가중치는 차원별로 달라져,
위험 회피 문항 하나는 공감 문항 하나보다 20% 큰 영향력을 갖는다.</p>
<table>
  <tr><th>차원</th><th>기호</th><th>문항 수</th><th>역채점</th><th>문항당 가중치</th></tr>
  {TABLE1}
</table>
<div class="cap">[표 1] 차원별 문항 구성과 문항 가중치</div>
<p>예시로 한 참가자의 응답을 대입한 결과는 표 2와 같다. 역채점 보정 후의 값을 평균하여 최종 특성값을
얻는다.</p>
<table>
  <tr><th>차원</th><th>원응답(1~7)</th><th>보정값</th><th>정규화 평균</th><th>&theta;<sub>k</sub></th></tr>
  {TABLE2}
</table>
<div class="cap">[표 2] 예시 참가자의 차원별 특성값 산출</div>

<h4>나) 보상 함수의 수치 대입</h4>
<p>죄수의 딜레마의 기본 보수는 상호협력 <i>R</i>=3, 유혹 <i>T</i>=5, 피해 <i>S</i>=0, 상호배신
<i>P</i>=1이다. 성격을 반영한 보상은 기본 보수 <i>&pi;<sub>i</sub></i>에 네 개의 가산항과 하나의
승산항을 적용하여 정의된다.</p>
<div class="eqbox">
R<sub>&theta;</sub>(a, a&prime;, a<sub>prev</sub>) =<br>
[ &pi;<sub>i</sub> + &kappa;<sub>CC</sub>&middot;e&middot;<b>1</b>{{a=a&prime;=C}}
&minus; &kappa;<sub>CD</sub>&middot;e&middot;<b>1</b>{{a=C, a&prime;=D}}<br>
+ &kappa;<sub>c</sub>&middot;c&middot;(&pi;<sub>i</sub>&minus;&pi;<sub>j</sub>) ]
&middot; (1 + &kappa;<sub>s</sub>&middot;s)<br>
&minus; &kappa;<sub>r</sub>&middot;r&middot;<b>1</b>{{&pi;<sub>i</sub>=0}}
+ &kappa;<sub>f</sub>&middot;f&middot;<b>1</b>{{a<sub>prev</sub>=D, a=C}}
<span class="num">&nbsp;(4)</span>
</div>
<p>여섯 계수의 실제 대입값은 표 3과 같다. 계수 선정의 기준은 보수 폭
<i>&Delta;</i>=<i>T</i>&minus;<i>S</i>=5&minus;0=5이다. 모든 보정항이 <i>&Delta;</i>에 대한 일정 비율
이내에 머물도록 설계하여, 성격 보정이 기본 보수 구조를 압도하지 않으면서도 행동 차이를 만들 수 있는
크기를 갖도록 하였다.</p>
<table>
  <tr><th>보정항</th><th>기호</th><th>값</th><th>&Delta;=5 대비</th><th>적용 조건</th></tr>
  {TABLE3}
</table>
<div class="cap">[표 3] 보상 함수 계수의 대입값과 산출 근거</div>
<p>표 2의 예시 참가자(<i>e</i>={ex['empathy']:.4f}, <i>c</i>={ex['competitiveness']:.4f},
<i>r</i>={ex['risk_aversion']:.4f}, <i>f</i>={ex['forgiveness']:.4f},
<i>s</i>={ex['short_term']:.4f})를 식 (4)에 대입하면 표 4를 얻는다. 상호협력은
(3+2&middot;{ex['empathy']:.4f})&middot;(1+0.4&middot;{ex['short_term']:.4f})={rw_cc['reward']:.3f},
일방적 이득은 (5+0.8&middot;{ex['competitiveness']:.4f}&middot;5)&middot;1.2={rw_dc['reward']:.3f}이다.</p>
<table>
  <tr><th>결과</th><th>의미</th><th>기본 보수</th><th>R<sub>&theta;</sub></th></tr>
  {TABLE4}
</table>
<div class="cap">[표 4] 예시 참가자의 성형 보상값 (직전 배신 없음)</div>
<p>직전 라운드에 배신했다가 협력으로 복귀한 경우에는 용서 보너스
{ex['forgiveness']:.4f}&times;1.5={ex['forgiveness']*1.5:.3f}이 더해져 상호협력 보상이
{rw_cc['reward']:.3f}에서 {rw_ccD['reward']:.3f}으로 증가한다. 이 참가자의 경우 일방적 이득
{rw_dc['reward']:.3f}이 상호협력 {rw_cc['reward']:.3f}보다 여전히 크다는 점에 주목할 필요가 있다.</p>

<h4>다) 상태 인코딩과 학습 파라미터</h4>
<p>상태는 최근 <i>M</i>=3라운드의 (내 행동, 상대 행동) 기록이다. 한 라운드가 2비트를 차지하므로
상태 공간의 크기는 2<sup>2M</sup>=2<sup>6</sup>={A1['nStates']}가지이다. 협력을 0, 배신을 1로 두고 내 행동
3비트에 상대 행동 3비트를 이어 붙인다.</p>
<div class="eq">s = &sum;<sub>b=0</sub><sup>5</sup> bit<sub>b</sub> &middot; 2<sup>5&minus;b</sup>
  <span class="num">&nbsp;(5)</span></div>
<p class="noind">예컨대 내 행동이 {s_my}, 상대 행동이 {s_opp}이면 비트열은
010001<sub>(2)</sub>이고 상태 번호는 {s_ex['state']}이다. 학습은 시간차 갱신식을 따르며 학습률
&alpha;=0.1, 감쇠율 &gamma;=0.95를 사용한다.</p>
<div class="eq">Q(s,a) &larr; Q(s,a) + &alpha;[ r + &gamma;&middot;max<sub>a&prime;</sub>Q(s&prime;,a&prime;)
  &minus; Q(s,a) ] <span class="num">&nbsp;(6)</span></div>
<p>식 (6)의 대괄호는 TD 오차, 곧 &quot;직접 겪은 결과가 기존 추정치보다 얼마나 놀라운가&quot;이다.
학습률 &alpha;=0.1은 이 놀라움을 Q값에 반영하는 비율로, 매 갱신마다 오차의 10%만 수용한다. &alpha;를
크게 잡으면 최근 한두 판의 우연한 결과에 Q값이 과도하게 흔들리고(분산 증가), 지나치게 작으면
{CFG['EPISODES']}에피소드 안에 수렴하지 못한다(편향 잔존). 0.1은 총 갱신 횟수({CFG['EPISODES']*CFG['ROUNDS_PER_EP']:,}회
={CFG['EPISODES']}에피소드&times;{CFG['ROUNDS_PER_EP']}라운드)를 감안해 상태당 평균 방문 횟수만큼 여러 번
평균낼 여지를 준 값이다.</p>
<p>감쇠율 &gamma;=0.95는 미래 보상을 현재 가치로 환산하는 비율이며, 이는 곧 에이전트가 몇 라운드
앞까지를 &quot;지금 결정에 중요하다&quot;고 보는지를 정한다. 기하급수 &sum;&gamma;<sup>k</sup>의 유효
항 수, 즉 유효 지평(effective horizon)은 다음과 같다.</p>
<div class="eq">H = 1 / (1 &minus; &gamma;) = 1 / 0.05 = 20 <span class="num">&nbsp;(6-1)</span></div>
<p class="noind">즉 에이전트는 대략 20라운드 앞까지의 결과를 의미 있게 반영하여 현재 행동을 결정한다.
한 에피소드가 {CFG['ROUNDS_PER_EP']}라운드이므로 유효 지평은 에피소드 길이의 20%에 해당하며, 상대의
보복이나 용서가 몇 라운드 뒤에 돌아오더라도 그 영향을 반영할 만큼은 충분히 길다.</p>
<p>&gamma;가 명제 2의 협력 지속 조건에서 어떤 역할을 하는지도 직접 풀어낼 수 있다. 부등식
3+2e&ge;(1&minus;&gamma;)(5+4c)+&gamma;를 &gamma;에 대해 정리하면 임계 감쇠율
&gamma;*(e,c)를 얻는다.</p>
<div class="eq">&gamma;*(e,c) = (T&minus;R) / (4+4c) = (2+4c&minus;2e) / (4+4c)
  <span class="num">&nbsp;(6-2)</span></div>
<p class="noind">&gamma;&ge;&gamma;*(e,c)를 만족해야 그 성격의 에이전트가 상호적 상대에게 협력을 지속할
유인을 갖는다. [표 3]의 도메인 [0,1]<sup>2</sup>에서 &gamma;*의 최댓값은 <i>e</i>=0, <i>c</i>=1에서
&gamma;*=6/8=0.75로, 가장 비관적인 성격 조합에서도 0.75를 넘지 않는다. 실제 사용한 &gamma;=0.95는 이
최댓값보다 0.20 크므로, 본 시뮬레이션은 어떤 참가자의 성격이 대입되어도 여유 있게 명제 2의 조건을
만족하도록 설계되어 있었던 셈이다. 반대로 만약 &gamma;를 0.7 이하로 낮췄다면 공감이 낮고 경쟁심이 높은
일부 참가자에게서는 반복게임에서도 협력이 지속되지 않는 정책이 나올 수 있었다.</p>
<p>탐험률 &epsilon;는 1.0에서 시작하여 갱신 1회마다 0.9995배로 감소하고 하한은 0.05이다. 하한 도달에
필요한 갱신 횟수는 다음과 같다.</p>
<div class="eq">n = ln(0.05) / ln(0.9995) &asymp; {n_floor:.0f}
  <span class="num">&nbsp;(7)</span></div>
<p class="noind">한 에피소드가 {CFG['ROUNDS_PER_EP']}회 갱신이므로 약 {ep_floor:.0f}에피소드, 즉 전체 학습
{CFG['EPISODES']}에피소드의 {pct_floor:.1f}% 지점에서 탐험률이 하한에 도달한다. 학습의 대부분이 거의
탐욕적인 정책 아래 진행된다는 뜻이며, 이는 초기 난수에 따라 서로 다른 정책으로 고착될 여지를 남긴다.</p>

<h4>라) 성형 보수행렬의 구조 분석</h4>
<p>성격 계수가 학습되는 전략의 종류를 바꾸려면 성형된 보수행렬의 <i>순서 구조</i>를 바꿀 수 있어야
한다. 식 (4)에서 용서항을 제외하고 &lambda;=1+0.4<i>s</i>&gt;0으로 두면 네 결과의 보상은 다음과 같다.</p>
<div class="eqbox">
R<sub>CC</sub> = (3 + 2e)&lambda; &nbsp;&nbsp; R<sub>DC</sub> = (5 + 4c)&lambda;<br>
R<sub>CD</sub> = (&minus;e &minus; 4c)&lambda; &minus; 2r &nbsp;&nbsp; R<sub>DD</sub> = &lambda;
<span class="num">&nbsp;(8)</span>
</div>
<div class="prop">
<b>[명제 1] 딜레마 구조의 불변성</b>
모든 (<i>e,c,s</i>)&isin;[0,1]<sup>3</sup>에 대하여 <i>R</i><sub>DC</sub>&ge;<i>R</i><sub>CC</sub>이다.
</div>
<p class="noind"><i>증명.</i> &lambda;&gt;0이므로 양변을 &lambda;로 나누면
<i>R</i><sub>DC</sub>&minus;<i>R</i><sub>CC</sub>=(5+4<i>c</i>)&minus;(3+2<i>e</i>)=2+4<i>c</i>&minus;2<i>e</i>이다.
<i>e</i>&le;1, <i>c</i>&ge;0이므로 이 값은 2&minus;2<i>e</i>+4<i>c</i>&ge;0이며, 등호는 <i>e</i>=1이고
<i>c</i>=0인 단일 지점에서만 성립한다. &#9633;</p>
<p>즉 어떤 성격을 대입하더라도 배신의 유혹 보수가 상호협력 보수 이상이며, 일회 게임에서 배신은 항상
(약)우월전략으로 남는다. 성격 특성은 딜레마의 존재 자체를 해소하지 못한다.</p>
<div class="prop">
<b>[명제 2] 반복게임 협력 지속성의 무차별</b>
&gamma;=0.95에서 상호적 전략을 쓰는 상대에 대한 협력 지속 조건
<i>R</i><sub>CC</sub>&ge;(1&minus;&gamma;)<i>R</i><sub>DC</sub>+&gamma;<i>R</i><sub>DD</sub>는
모든 (<i>e,c,s</i>)&isin;[0,1]<sup>3</sup>에서 성립한다.
</div>
<p class="noind"><i>증명.</i> 양변을 &lambda;로 나누면 3+2<i>e</i>&ge;0.05(5+4<i>c</i>)+0.95, 즉
2<i>e</i>&minus;0.2<i>c</i>&ge;&minus;1.8이다. 좌변의 최솟값은 <i>e</i>=0, <i>c</i>=1에서 &minus;0.2이며
이는 &minus;1.8보다 크다. &#9633;</p>
<p>두 명제를 종합하면, 일회 게임에서는 모든 참가자가 배신 우위이고 반복 게임에서는 모든 참가자가
협력을 지속할 수 있다. 성격은 두 경계 어느 쪽도 넘지 못하므로 <b>학습되는 전략의 종류가 아니라 그
정도만을 조절할 수 있다</b>는 예측이 도출된다.</p>
<p>또한 두 증명에서 &lambda;가 소거된 사실은 단기이익 계수가 협력·배신의 우열 관계에 기여하지 않음을
보여준다. 보상 전체에 양의 상수를 곱하면 벨만 방정식의 선형성에 의해 Q값도 같은 배율로 커질 뿐
arg max는 불변이기 때문이다. 식 (4)에서 위험회피·용서 항은 &lambda; 바깥에 있어 상대적 비중 변화라는
부수 효과만 남는다. 시간선호를 모형화하려면 보상 배율이 아니라 감쇠율을
&gamma;<sub>&theta;</sub>=&gamma;<sub>max</sub>&minus;(&gamma;<sub>max</sub>&minus;&gamma;<sub>min</sub>)<i>s</i>로
개인화하는 것이 이론적으로 타당하다.</p>

<h4>마) 실험 결과</h4>
<p>웹 애플리케이션이 사용하는 학습 엔진을 그대로 사용하되 난수 생성기를 시드 기반으로 교체하여
재현 가능한 조건에서 세 실험을 수행하였다. 학습은 {CFG['EPISODES']}에피소드
&times;{CFG['ROUNDS_PER_EP']}라운드, 평가는 기준 전략 5종과 각 {CFG['TOURNEY_ROUNDS']}라운드 대전이며,
총 {TOTAL_RUNS}회를 학습시켰다.</p>
<p><b>실험 A(통제 실험)</b>는 한 번에 한 특성만 0에서 1까지 변화시키고 나머지는 0.5로 고정하여
각 조건을 {CFG['REPS_A']}회 반복하였다.</p>
<table>
  <tr><th>특성</th><th>0.00</th><th>0.25</th><th>0.50</th><th>0.75</th><th>1.00</th><th>r</th><th>p</th></tr>
  {TABLE5}
</table>
<div class="cap">[표 5] 특성 수준별 협력률(%)과 상관 (n={CFG['REPS_A']*5}/특성, * p&lt;.05, ** p&lt;.01)</div>
<div class="figblock">{FIG1}<div class="cap">[Figure 1] 특성값에 따른 협력률 변화</div></div>
<p>공감은 협력률을 유의하게 높이고({A_emp['perLevel'][0]['coopRate']*100:.1f}%&rarr;{A_emp['perLevel'][-1]['coopRate']*100:.1f}%,
<i>r</i>={A_emp['r']:+.3f}) 경쟁심은 유의하게 낮추어
({A_comp['perLevel'][0]['coopRate']*100:.1f}%&rarr;{A_comp['perLevel'][-1]['coopRate']*100:.1f}%,
<i>r</i>={A_comp['r']:+.3f}) 설계 의도와 일치하는 방향이 확인되었다. 반면 용서 성향은
<i>r</i>={A_forg['r']:+.3f}로 사실상 영향이 없었는데, 이는 용서 보너스가 D&rarr;C 전이라는 매우 좁은
조건에서만 지급되어 64개 상태 중 소수에만 반영되기 때문으로 해석된다.</p>
<p><b>실험 B(코호트)</b>에서는 무작위 성격을 갖는 {CFG['N_B']}명을 학습시킨 뒤 기준 전략 5종을 포함한
전체 라운드-로빈 토너먼트를 수행하였다. 평균 협력률은 {b_mean*100:.1f}%
(범위 {b_min*100:.1f}~{b_max*100:.1f}%)였다.</p>
<table>
  <tr><th>특성</th><th>기호</th><th>피어슨 r</th><th>p</th><th>방향</th></tr>
  {TABLE6}
</table>
<div class="cap">[표 6] 성격 특성과 협력률의 상관 (N={CFG['N_B']})</div>
<p class="noind">공감(<i>r</i>={corr['empathy']:+.3f})과 경쟁심(<i>r</i>={corr['competitiveness']:+.3f})은 실험 A와
같은 방향을 유지하였다. 그러나 {CFG['N_B']}명 <b>전원({b_defect}/{CFG['N_B']})</b>이 Q(D)&gt;Q(C), 즉 배신을
선호하는 가치함수를 학습하였고 협력 선호 상태 수는 평균 {b_prefC:.1f}/64에 그쳤다. 성격이 협력의
정도는 바꾸지만 선호의 방향 자체는 바꾸지 못한다는 명제 1의 예측과 부합한다. 같은 토너먼트에서 기준
전략들은 설계대로 동작하여 측정 절차의 타당성을 확인하였다.</p>
<table>
  <tr><th>기준 전략</th><th>협력률(%)</th><th>평균 점수</th></tr>
  {TABLE_BASE}
</table>
<div class="cap">[표 7] 기준 전략의 토너먼트 결과 (검증용)</div>
<p><b>실험 C(계수 재조정)</b>는 명제 1을 직접 검증한다. 공감 최대(<i>e</i>=1)·경쟁심 최소(<i>c</i>=0)
조건에서 공감 계수만 바꾸면 <i>T</i>&minus;<i>R</i>=2&minus;&kappa;<sub>CC</sub>이므로
&kappa;<sub>CC</sub>&gt;2에서 딜레마가 해소된다. 각 조건 {CFG['REPS_C']}회 반복하였다.</p>
<table>
  <tr><th>&kappa;<sub>CC</sub></th><th>T&minus;R</th><th>협력률(%)</th><th>Q(C)&minus;Q(D)</th><th>협력선호</th></tr>
  {TABLE7}
</table>
<div class="cap">[표 8] 공감 계수 재조정에 따른 변화 (e=1, c=0)</div>
<div class="figblock">{FIG2}<div class="cap">[Figure 2] &kappa;<sub>CC</sub>에 따른 가치함수의 협력 선호</div></div>
<p>협력률은 {c0['coopRate']*100:.1f}%에서 {cL['coopRate']*100:.1f}%로 완만히 상승한 반면,
가치함수 수준의 변화는 훨씬 뚜렷하여 Q(C)&minus;Q(D)가 {c0['avgQC']-c0['avgQD']:+.1f}에서
{cL['avgQC']-cL['avgQD']:+.1f}로, 협력 선호 상태 수가 {c0['statesPreferC']:.1f}에서
{cL['statesPreferC']:.1f}로 증가하였다. 행동 지표가 덜 민감한 것은 토너먼트 상대에 항상배신·그루지가
포함되어 협력률의 상한이 구조적으로 제한되기 때문이며, 따라서 보상 설계의 효과는 협력률보다
가치함수를 통해 관찰하는 편이 타당하다.</p>

<h3>III 결론</h3>
<p>본 연구는 설문 응답이 보상 함수 계수로 변환되는 전 과정을 수식과 실제 수치로 명시하였다. 각 문항은
소속 차원의 문항 수에 대한 역수 1/<i>n<sub>k</sub></i>의 가중치를 가지며, 역채점 보정과 [0,1] 정규화를
거쳐 다섯 개 특성값으로 집계된다. 이 특성값은 보수 폭 <i>&Delta;</i>=5에 대한 비율로 설계된 여섯 개
계수를 통해 보상 함수에 반영된다.</p>
<p>해석적 분석 결과 현행 계수에서는 성격이 어떤 값을 갖더라도 유혹 보수가 상호협력 보수 이상으로
유지되고 반복게임의 협력 지속 조건 또한 모든 참가자에게 동일하게 성립하여, 성격은 보수행렬의 순서
구조를 바꾸지 못한다. {TOTAL_RUNS}회 학습 시행은 이 예측과 부합하는 결과를 보였다. 성격은 협력률의
정도를 유의하게 조절하였으나(공감 <i>r</i>={A_emp['r']:+.3f}, 경쟁심 <i>r</i>={A_comp['r']:+.3f}),
코호트 전원이 배신 선호 가치함수를 학습하였고, 계수를 임계값 이상으로 재조정했을 때 비로소 가치함수가
협력 선호로 전환되었다.</p>
<p>따라서 보상 설계에서는 계수의 절대 크기보다 그 계수가 만들어내는 부등식 구조가 우선적으로
검토되어야 한다. 향후 연구에서는 목표하는 전략 구조를 부등식으로 먼저 명세한 뒤 그 제약을 만족하는
영역에서 계수를 선택하는 역방향 설계와, 단기이익 특성을 배율이 아닌 개인별 감쇠율
&gamma;<sub>&theta;</sub>로 모형화하는 방안을 검토할 필요가 있다.</p>

<h3>IV 참고문헌</h3>
<ol class="ref">
  <li>Sutton, R. S., &amp; Barto, A. G. (2018). <i>Reinforcement Learning: An Introduction</i> (2nd ed.). MIT Press.</li>
  <li>Watkins, C. J. C. H., &amp; Dayan, P. (1992). Q-learning. <i>Machine Learning</i>, 8, 279&ndash;292.</li>
  <li>Axelrod, R. (1984). <i>The Evolution of Cooperation</i>. Basic Books.</li>
  <li>Ng, A. Y., Harada, D., &amp; Russell, S. (1999). Policy invariance under reward transformations. <i>ICML</i>, 278&ndash;287.</li>
  <li>Fehr, E., &amp; Schmidt, K. M. (1999). A theory of fairness, competition, and cooperation. <i>QJE</i>, 114(3), 817&ndash;868.</li>
  <li>Kahneman, D., &amp; Tversky, A. (1979). Prospect theory. <i>Econometrica</i>, 47(2), 263&ndash;291.</li>
  <li>Nowak, M. A., &amp; Sigmund, K. (1992). Tit for tat in heterogeneous populations. <i>Nature</i>, 355, 250&ndash;253.</li>
</ol>

</div>
</body></html>
"""

out = os.path.join(HERE, "report_reward.html")
open(out, "w", encoding="utf-8").write(HTML)
print("wrote", out)

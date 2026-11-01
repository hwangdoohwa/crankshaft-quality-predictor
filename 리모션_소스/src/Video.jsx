import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import OFF from "./offsets.json";
import NARR from "./narration.json";

/* 장면 길이(프레임, 30fps) — 나레이션 길이 + 여유. 합계 900 = 30초 */
const SCENES = [126, 189, 222, 180, 183];
export const TOTAL = SCENES.reduce((a, b) => a + b, 0);
const START = SCENES.map((_, i) => SCENES.slice(0, i).reduce((a, b) => a + b, 0));
const VOICE_DELAY = 9;

const C = {
  bg: "#0d151c", panel: "#141f28", line: "#263441", fg: "#e8edf2", muted: "#93a3b2",
  accent: "#5bb4dc", ok: "#47c27c", warn: "#f0a24a", bad: "#f2685c",
};
const FONT = '"Malgun Gothic","Apple SD Gothic Neo",sans-serif';
const MONO = 'Consolas,"Cascadia Mono",monospace';
const ease = Easing.bezier(0.33, 0, 0.2, 1);

/* 데이터 세트별 화면 수치 (웹앱 예측 결과) */
const DATA = [
  { key: "d35", no: 1, file: "크랭크샤프트_테스트조건_불량3.5.xlsx", id: "T35", title: "경미한 드리프트", defect: "3.5", tone: C.ok,
    act: "계속작동", actTone: C.ok,
    rows: [["합격 지표", "8 / 8", C.ok], ["예상 Cpk", "1.53  (목표 ≥ 1.33)", C.ok], ["공정 경고", "0건", C.ok], ["계속작동 순이익", "1,405만원", C.ok]],
    check: "모든 지표 규격 안 · Cpk 1.33 이상 → 그대로 생산" },
  { key: "d50", no: 2, file: "크랭크샤프트_테스트조건_불량50.xlsx", id: "D50", title: "진동 증가 + 드레싱 지연", defect: "50.0", tone: C.bad,
    act: "부분조치", actTone: C.warn,
    rows: [["합격 지표", "4 / 8  (형상 4개 주의)", C.warn], ["진원도", "2.91µm / 규격 ≤ 3µm", C.warn], ["원인 인자", "드레싱 −43.8%p · 진동 −42.1%p", C.fg], ["순이익 (계속 → 부분조치)", "−2,287 → 1,352만원", C.warn]],
    check: "원인 인자 확인 → 드레싱·절입 조정 + 전수검사" },
  { key: "d90", no: 3, file: "크랭크샤프트_테스트조건_불량90.xlsx", id: "D90", title: "유도경화 입열 부족", defect: "90.0", tone: C.bad,
    act: "부분조치", actTone: C.warn,
    rows: [["유효 경화층 깊이", "1.86mm / 규격 2~4mm", C.bad], ["표면 경도", "52.3 HRC (하한 52)", C.warn], ["예상 Cpk", "−0.33", C.bad], ["순이익 (계속 → 부분조치)", "−5,405 → 1,364만원", C.warn]],
    check: "불합격 지표 확인 → 출력 89 → 152kW 상향" },
];

const fadeIn = (f, at = 0, len = 12) => interpolate(f, [at, at + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/* 상단 진행 표시 */
const Progress = ({ frame }) => {
  const labels = ["업로드", "3.5%", "50%", "90%", "체크"];
  return (
    <div style={{ position: "absolute", top: 34, left: 60, right: 60, display: "flex", gap: 10 }}>
      {labels.map((l, i) => {
        const p = interpolate(frame, [START[i], START[i] + SCENES[i]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ height: 5, borderRadius: 3, background: C.line, overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: C.accent }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 18, color: p > 0 && p < 1 ? C.fg : C.muted, fontWeight: 700 }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

/* 하단 자막 */
const Subtitle = ({ text, frame, dur }) => {
  const o = Math.min(fadeIn(frame, 4, 10), interpolate(frame, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 40, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ background: "rgba(5,10,14,.88)", border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 30px", fontSize: 32, fontWeight: 700, color: C.fg, letterSpacing: "-0.01em", textAlign: "center", maxWidth: 1700 }}>
        {text}
      </div>
    </div>
  );
};

/* 장면 1: 업로드 */
const Intro = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = spring({ frame: f, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ padding: "150px 120px 0", fontFamily: FONT, color: C.fg }}>
      <div style={{ opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
        <div style={{ fontSize: 26, color: C.accent, fontWeight: 700, letterSpacing: ".04em" }}>엔진 크랭크샤프트 · 가공 조건 기반 품질 예측</div>
        <div style={{ fontSize: 84, fontWeight: 800, marginTop: 12, letterSpacing: "-0.02em" }}>크랭크샤프트 품질 예측 웹앱</div>
        <div style={{ fontSize: 38, color: C.muted, marginTop: 14 }}>테스트 데이터 3종 업로드 → 불량 확률 · 판단 · 경제성 비교</div>
      </div>
      <div style={{ display: "flex", gap: 28, marginTop: 70 }}>
        {DATA.map((d, i) => {
          const s = spring({ frame: f - 18 - i * 10, fps, config: { damping: 14 } });
          return (
            <div key={d.key} style={{ flex: 1, opacity: s, transform: `translateY(${(1 - s) * 60}px)`, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: "26px 30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 54, height: 64, borderRadius: 8, background: "#1f7a46", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>XLS</div>
                <div style={{ fontSize: 22, color: C.muted, wordBreak: "keep-all" }}>{d.file}</div>
              </div>
              <div style={{ marginTop: 18, fontSize: 24, color: C.muted }}>데이터 {d.no} · {d.title}</div>
              <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 58, fontWeight: 700, color: d.tone }}>{d.defect}%</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 장면 2~4: 웹앱 화면 + 수치 */
const SHOT_W = 1400, VIEW_W = 1160, SCALE = VIEW_W / SHOT_W, VIEW_H = 800;
const AppScene = ({ d }) => {
  const f = useCurrentFrame(), { fps, durationInFrames: dur } = useVideoConfig();
  const o = OFF[d.key];
  // 카메라: KPI → 품질 게이지 → 관리자 판단
  const stops = [o.kpis[0] - 20, o.gauges[0] - 10, o.decision[0] - 10];
  const k1 = dur * 0.34, k2 = dur * 0.64;
  const y = interpolate(f, [0, k1, k1 + 18, k2, k2 + 18, dur], [stops[0], stops[0], stops[1], stops[1], stops[2], stops[2]], { easing: ease, extrapolateRight: "clamp" });
  const phase = f < k1 + 9 ? 0 : f < k2 + 9 ? 1 : 2;
  const boxes = [
    [24, o.kpis[0], 1352, o.kpis[1]],
    [420, o.gauges[0], 956, o.gauges[1]],
    [24, o.decision[0], 1352, Math.min(o.decision[1], 640)],
  ];
  const b = boxes[phase];
  const pulse = 0.55 + 0.45 * Math.sin(f / 5);
  const s = spring({ frame: f, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.fg }}>
      {/* 브라우저 창 */}
      <div style={{ position: "absolute", left: 60, top: 110, width: VIEW_W, height: VIEW_H + 46, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: "0 30px 80px rgba(0,0,0,.45)", background: "#eef1f4", opacity: s, transform: `scale(${0.96 + 0.04 * s})` }}>
        <div style={{ height: 46, background: "#1b2630", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
          {["#f2685c", "#f0a24a", "#47c27c"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
          <div style={{ marginLeft: 16, flex: 1, background: "#0f171e", borderRadius: 7, padding: "6px 14px", fontSize: 17, color: C.muted }}>크랭크샤프트 품질 예측 · {d.id} 적용됨</div>
        </div>
        <div style={{ position: "relative", height: VIEW_H, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, transformOrigin: "0 0", transform: `scale(${SCALE}) translateY(${-y}px)` }}>
            <Img src={staticFile(d.key + ".png")} style={{ width: SHOT_W, display: "block" }} />
            <div style={{ position: "absolute", left: b[0] - 6, top: b[1] - 6, width: b[2] + 12, height: b[3] + 12, border: `5px solid ${C.accent}`, borderRadius: 14, opacity: pulse, boxShadow: `0 0 0 9999px rgba(10,20,28,${0.18 * pulse})` }} />
          </div>
        </div>
      </div>
      {/* 오른쪽 수치 패널 */}
      <div style={{ position: "absolute", left: 1260, top: 110, width: 600 }}>
        <div style={{ fontSize: 24, color: C.accent, fontWeight: 700, opacity: fadeIn(f, 4) }}>데이터 {d.no} · {d.id}</div>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 4, opacity: fadeIn(f, 6) }}>{d.title}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 10, opacity: fadeIn(f, 8) }}>
          <div style={{ fontFamily: MONO, fontSize: 118, fontWeight: 700, color: d.tone, lineHeight: 1 }}>
            {(parseFloat(d.defect) * Math.min(1, interpolate(f, [8, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }))).toFixed(1)}
            <span style={{ fontSize: 50 }}>%</span>
          </div>
        </div>
        <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>예측 불량 확률</div>
        <div style={{ marginTop: 22, display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px", borderRadius: 40, border: `3px solid ${d.actTone}`, color: d.actTone, fontSize: 34, fontWeight: 800, opacity: fadeIn(f, 16) }}>
          권장 판단 · {d.act}
        </div>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
          {d.rows.map(([l, v, tone], i) => (
            <div key={l} style={{ opacity: fadeIn(f, 22 + i * 7), transform: `translateX(${(1 - fadeIn(f, 22 + i * 7)) * 30}px)`, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ fontSize: 20, color: C.muted }}>{l}</div>
              <div style={{ fontSize: 29, fontWeight: 700, color: tone, fontFamily: MONO }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 24, fontWeight: 700, color: C.fg, opacity: fadeIn(f, 60), display: "flex", gap: 10 }}>
          <span style={{ color: C.accent }}>✔</span><span>{d.check}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 장면 5: 체크 포인트 */
const Checklist = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const items = [
    ["불량 확률", "KPI 카드: 2% 미만 정상 · 10% 이상이면 계속작동 제외"],
    ["불합격 지표", "게이지 빨간색 = 규격 이탈 → 알고 생산하지 않기"],
    ["원인 인자", "기준값으로 되돌릴 때 줄어드는 %p가 큰 인자부터 조치"],
    ["조치별 순이익", "정지 · 부분조치 · 계속작동 경제성 비교 후 선택"],
  ];
  const rows = [["3.5%", "계속작동", "1,405만원", C.ok], ["50%", "부분조치", "−2,287만원", C.warn], ["90%", "부분조치", "−5,405만원", C.warn]];
  return (
    <AbsoluteFill style={{ padding: "130px 110px 0", fontFamily: FONT, color: C.fg }}>
      <div style={{ fontSize: 60, fontWeight: 800, opacity: fadeIn(f, 0) }}>관리자 체크 포인트</div>
      <div style={{ display: "flex", gap: 50, marginTop: 36 }}>
        <div style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map(([t, dsc], i) => {
            const s = spring({ frame: f - 8 - i * 14, fps, config: { damping: 15 } });
            return (
              <div key={t} style={{ display: "flex", gap: 20, alignItems: "center", opacity: s, transform: `translateX(${(1 - s) * -40}px)`, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 24px" }}>
                <div style={{ width: 50, height: 50, borderRadius: 25, background: C.accent, color: C.bg, fontSize: 30, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✔</div>
                <div><div style={{ fontSize: 34, fontWeight: 800 }}>{t}</div><div style={{ fontSize: 23, color: C.muted, marginTop: 2 }}>{dsc}</div></div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, opacity: fadeIn(f, 30) }}>
          <div style={{ fontSize: 24, color: C.muted, marginBottom: 10 }}>업로드 결과 요약</div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1.5fr", padding: "14px 22px", fontSize: 21, color: C.muted, borderBottom: `1px solid ${C.line}` }}>
              <span>불량 확률</span><span>권장 판단</span><span style={{ textAlign: "right" }}>계속작동 순이익</span></div>
            {rows.map(([p, a, n, tone], i) => (
              <div key={p} style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1.5fr", padding: "18px 22px", fontSize: 32, fontWeight: 700, borderBottom: i < 2 ? `1px solid ${C.line}` : "none", opacity: fadeIn(f, 36 + i * 8) }}>
                <span style={{ fontFamily: MONO }}>{p}</span><span style={{ color: tone }}>{a}</span><span style={{ fontFamily: MONO, textAlign: "right", color: n.startsWith("−") ? C.bad : C.ok }}>{n}</span></div>
            ))}
          </div>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 12 }}>1교대(8시간) 기준 · 가상 데이터 모델 예측값</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CrankVideo = () => {
  const frame = useCurrentFrame();
  const scenes = [<Intro key="i" />, ...DATA.map((d) => <AppScene key={d.key} d={d} />), <Checklist key="c" />];
  return (
    <AbsoluteFill style={{ fontFamily: FONT, background: `radial-gradient(1200px 700px at 75% 20%, #15324a 0%, ${C.bg} 60%)` }}>
      {scenes.map((el, i) => (
        <Sequence key={i} from={START[i]} durationInFrames={SCENES[i]}>
          <SceneFade dur={SCENES[i]}>{el}</SceneFade>
          <Sequence from={VOICE_DELAY}><Audio src={staticFile(NARR[i].id + ".wav")} /></Sequence>
          <SubtitleWrap text={NARR[i].sub} dur={SCENES[i]} />
        </Sequence>
      ))}
      <Progress frame={frame} />
    </AbsoluteFill>
  );
};
const SceneFade = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = Math.min(fadeIn(f, 0, 8), interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
const SubtitleWrap = ({ text, dur }) => <Subtitle text={text} frame={useCurrentFrame()} dur={dur} />;

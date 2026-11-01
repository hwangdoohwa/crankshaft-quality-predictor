// 웹앱에 각 데이터 세트를 적용한 상태로 전체 화면을 캡처한다 (headless Edge)
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const SRC = process.argv[2];
const OUT = path.join(__dirname, "public");
const TMP = path.join(__dirname, "cap");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SETS = [
  { key: "d35", id: "T35", name: "경미한 드리프트 — 공장 온도·절삭유 소폭 상승", x: { amb: 22.5, ct: 24.5, tool: 40 } },
  { key: "d50", id: "D50", name: "설비 진동 증가 + 드레싱 지연 + 공구 마모", x: { vib: 4.2, dress: 35, tool: 69 } },
  { key: "d90", id: "D90", name: "유도경화 입열 부족 (출력·가열 시간 저하)", x: { fr: 15, pw: 89, ht: 3 } },
];
const app = fs.readFileSync(SRC, "utf8");
const W = 1400;
const offs = {};
for (const s of SETS) {
  const pre = `<script>try{localStorage.clear();localStorage.setItem("ckq-x",${JSON.stringify(JSON.stringify(s.x))});` +
    `localStorage.setItem("ckq-ctx",${JSON.stringify(JSON.stringify({ id: s.id, name: s.name }))});` +
    `localStorage.setItem("ckq-sets",${JSON.stringify(JSON.stringify([{ id: s.id, name: s.name, x: s.x }]))});}catch(e){}</script>`;
  const post = `<script>setTimeout(()=>{const q=sel=>{const e=document.querySelector(sel);const r=e.getBoundingClientRect();return [Math.round(r.top+scrollY),Math.round(r.height)]};` +
    `const o={kpis:q(".kpis"),sets:q('section[aria-label="테스트 조건 세트"]'),gauges:q('section[aria-label="품질 예측"]'),warns:q('section[aria-label="경고"]'),` +
    `decision:q("#decision"),econ:q('section[aria-label="경제성 분석"]'),H:document.documentElement.scrollHeight};` +
    `const p=document.createElement("pre");p.id="__off";p.style.display="none";p.textContent=JSON.stringify(o);document.body.append(p);},3000)</script>`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${pre}\n${app}\n${post}</body></html>`;
  const file = path.join(TMP, s.key + ".html");
  fs.writeFileSync(file, html);
  const url = "file:///" + file.replace(/\\/g, "/");
  const base = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb", `--user-data-dir=${path.join(TMP, "prof-" + s.key)}`, "--virtual-time-budget=12000"];
  const dom = execFileSync(EDGE, [...base, `--window-size=${W},1200`, "--dump-dom", url], { encoding: "utf8", maxBuffer: 64 << 20 });
  const m = dom.match(/<pre id="__off"[^>]*>([^<]+)<\/pre>/);
  if (!m) throw new Error("offsets not found for " + s.key);
  const o = JSON.parse(m[1].replace(/&quot;/g, '"'));
  offs[s.key] = o;
  execFileSync(EDGE, [...base, `--window-size=${W},${o.H}`, `--screenshot=${path.join(OUT, s.key + ".png")}`, url], { stdio: "ignore" });
  console.log(s.key, JSON.stringify(o));
}
fs.writeFileSync(path.join(__dirname, "src", "offsets.json"), JSON.stringify(offs, null, 1));

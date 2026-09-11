import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Flow = Readonly<{ menu: string; steps: readonly string[]; note?: string }>;
type Family = Readonly<{ title: string; color: string; flows: readonly Flow[] }>;

const families: readonly Family[] = [
  {
    title: "ESPRESSO · 따뜻한 커피",
    color: "#9c653e",
    flows: [
      { menu: "아메리카노", steps: ["분쇄 원두", "에스프레소", "에스프레소 컵", "뜨거운 물", "아메리카노"] },
      { menu: "카페라떼", steps: ["에스프레소 컵", "스팀 밀크", "카페라떼"] },
      {
        menu: "바닐라 라떼",
        steps: ["에스프레소 컵", "바닐라 시럽", "바닐라 에스프레소", "스팀 밀크", "바닐라 라떼"],
      },
      { menu: "카페모카", steps: ["에스프레소 컵", "초콜릿 소스", "모카 베이스", "스팀 밀크", "카페모카"] },
      {
        menu: "카라멜 마키아토",
        steps: ["컵 + 바닐라 시럽", "바닐라 컵", "스팀 밀크", "에스프레소", "카라멜 소스", "카라멜 마키아토"],
      },
    ],
  },
  {
    title: "ICED COFFEE · 차가운 커피",
    color: "#4f8290",
    flows: [
      {
        menu: "아이스 아메리카노 · 경로 A",
        steps: ["에스프레소 컵", "얼음", "아이스 에스프레소", "차가운 물", "아이스 아메리카노"],
        note: "에스프레소를 먼저 준비",
      },
      {
        menu: "아이스 아메리카노 · 경로 B",
        steps: ["컵 + 얼음", "얼음 컵", "에스프레소", "아이스 에스프레소", "차가운 물", "아이스 아메리카노"],
        note: "얼음 컵을 먼저 준비",
      },
      {
        menu: "아이스 카페라떼 · 경로 A",
        steps: ["에스프레소 컵", "얼음", "아이스 에스프레소", "우유", "아이스 카페라떼"],
      },
      {
        menu: "아이스 카페라떼 · 경로 B",
        steps: ["컵 + 얼음", "얼음 컵", "우유", "아이스 밀크", "에스프레소", "아이스 카페라떼"],
      },
      {
        menu: "카페모카 아이스 블렌디드",
        steps: ["아이스 카페라떼", "초콜릿 소스", "모카 블렌딩 베이스", "블렌더", "카페모카 아이스 블렌디드"],
      },
    ],
  },
  {
    title: "ADE & TEA · 에이드와 차",
    color: "#72945f",
    flows: [
      {
        menu: "레몬에이드",
        steps: ["컵 + 얼음", "얼음 컵", "레몬청", "레몬 베이스", "탄산수", "레몬에이드"],
      },
      {
        menu: "자몽에이드",
        steps: ["컵 + 얼음", "얼음 컵", "자몽청", "자몽 베이스", "탄산수", "자몽에이드"],
      },
      { menu: "유자차", steps: ["컵 + 유자청", "유자 베이스", "뜨거운 물", "유자차"] },
    ],
  },
  {
    title: "NON-COFFEE · 우유 베이스",
    color: "#a77d50",
    flows: [
      { menu: "말차라떼", steps: ["컵 + 말차 파우더", "말차 베이스", "스팀 밀크", "말차라떼"] },
      { menu: "초콜릿 라떼", steps: ["컵 + 초콜릿 소스", "초콜릿 베이스", "스팀 밀크", "초콜릿 라떼"] },
    ],
  },
  {
    title: "COLD BREW · 콜드브루",
    color: "#68564d",
    flows: [
      {
        menu: "콜드브루",
        steps: ["컵 + 얼음", "얼음 컵", "콜드브루 원액", "콜드브루 베이스", "차가운 물", "콜드브루"],
      },
      {
        menu: "바닐라빈 오트 콜드브루",
        steps: [
          "컵 + 얼음",
          "얼음 컵",
          "오트밀크",
          "오트 베이스",
          "콜드브루 원액",
          "오트 콜드브루",
          "바닐라빈",
          "바닐라빈 오트 콜드브루",
        ],
      },
    ],
  },
];

const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const width = 2400;
const margin = 58;
const panelWidth = width - margin * 2;
const rowHeight = 92;
const panelHeader = 70;
const panelGap = 26;
const panelHeight = (family: Family) => panelHeader + family.flows.length * rowHeight + 24;
const height = 150 + families.reduce((sum, family) => sum + panelHeight(family) + panelGap, 0);
let panelY = 126;
const panels = families
  .map((family) => {
    const currentY = panelY;
    const currentHeight = panelHeight(family);
    panelY += currentHeight + panelGap;
    const rows = family.flows
      .map((flow, rowIndex) => {
        const y = currentY + panelHeader + rowIndex * rowHeight;
        const labelWidth = 310;
        const available = panelWidth - labelWidth - 44;
        const gap = 18;
        const nodeWidth = Math.min(250, (available - gap * (flow.steps.length - 1)) / flow.steps.length);
        const startX = margin + labelWidth + 22;
        const nodes = flow.steps
          .map((step, index) => {
            const x = startX + index * (nodeWidth + gap);
            const final = index === flow.steps.length - 1;
            const machine = step === "블렌더";
            return `${index ? `<path d="M${x - gap + 2} ${y + 29}H${x - 5}" class="arrow" marker-end="url(#arrow)"/>` : ""}<g transform="translate(${x} ${y})"><rect width="${nodeWidth}" height="58" rx="13" class="step ${final ? "final" : machine ? "machine" : ""}"/><text x="${nodeWidth / 2}" y="36" class="step-text" text-anchor="middle">${escapeXml(step)}</text></g>`;
          })
          .join("");
        return `<g><text x="${margin + 24}" y="${y + 27}" class="menu">${escapeXml(flow.menu)}</text>${flow.note ? `<text x="${margin + 24}" y="${y + 48}" class="note">${escapeXml(flow.note)}</text>` : ""}${nodes}</g>`;
      })
      .join("");
    return `<g><rect x="${margin}" y="${currentY}" width="${panelWidth}" height="${currentHeight}" rx="24" fill="#fffaf0" stroke="${family.color}" stroke-width="3"/><path d="M${margin + 24} ${currentY}H${margin + panelWidth - 24}Q${margin + panelWidth} ${currentY} ${margin + panelWidth} ${currentY + 24}V${currentY + 56}H${margin}V${currentY + 24}Q${margin} ${currentY} ${margin + 24} ${currentY}" fill="${family.color}"/><text x="${margin + 24}" y="${currentY + 38}" class="family">${escapeXml(family.title)}</text>${rows}</g>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4dc"/><stop offset="1" stop-color="#dfc08a"/></linearGradient><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#9a7653"/></marker></defs><rect width="100%" height="100%" fill="url(#bg)"/><style>text{font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;fill:#39291f}.title{font-size:44px;font-weight:900}.subtitle{font-size:18px;font-weight:700;fill:#77614d}.family{font-size:22px;font-weight:900;fill:white;letter-spacing:.04em}.menu{font-size:17px;font-weight:900}.note{font-size:12px;font-weight:700;fill:#8a7562}.step{fill:#edf3e8;stroke:#79917d;stroke-width:2}.step.final{fill:#fff0d7;stroke:#bd7541;stroke-width:3}.step.machine{fill:#e5ded6;stroke:#6b5b50;stroke-dasharray:6 4}.step-text{font-size:15px;font-weight:900}.arrow{fill:none;stroke:#9a7653;stroke-width:3}</style><text x="${margin}" y="55" class="title">COFFEE TOWN · 메뉴 계열별 제조 트리</text><text x="${margin}" y="88" class="subtitle">왼쪽에서 오른쪽으로 제조 · 주황색 노드는 완성 음료 · 점선 노드는 필수 설비</text>${panels}</svg>`;
const output = resolve("docs/coffee-town-recipe-tree-readable.svg");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, svg);
console.log(output);

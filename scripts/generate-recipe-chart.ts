import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { recipeArchive } from "../src/game/catalog";

const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const entries = recipeArchive.filter(({ category }) => category !== "source");
const intermediate = entries.filter(({ category }) => category === "intermediate");
const final = entries.filter(({ category }) => category === "final");
const width = 1800;
const rowHeight = 78;
const section = (title: string, items: typeof entries, x: number, y: number, color: string) => `
  <text x="${x}" y="${y}" class="section">${title}</text>
  ${items
    .map(
      (item, index) => `<g transform="translate(${x} ${y + 34 + index * rowHeight})">
        <rect width="820" height="64" rx="14" fill="#fffaf0" stroke="${color}" stroke-width="2"/>
        <circle cx="32" cy="32" r="18" fill="${color}"/>
        <text x="32" y="38" class="number" text-anchor="middle">${index + 1}</text>
        <text x="62" y="26" class="name">${escapeXml(item.name)}</text>
        <text x="62" y="48" class="recipe">${escapeXml(item.recipe)}</text>
        ${item.price ? `<text x="795" y="38" class="price" text-anchor="end">${item.price.toLocaleString("ko-KR")}원</text>` : ""}
      </g>`,
    )
    .join("")}`;
const height = Math.max(intermediate.length, final.length) * rowHeight + 250;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4da"/><stop offset="1" stop-color="#d9bd8d"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <style>
    text { font-family: "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; fill: #3b2b20; }
    .title { font-size: 44px; font-weight: 900; letter-spacing: 2px; }
    .subtitle { font-size: 18px; font-weight: 700; fill: #80674d; }
    .section { font-size: 28px; font-weight: 900; }
    .name { font-size: 19px; font-weight: 900; }
    .recipe { font-size: 15px; font-weight: 600; fill: #715f4f; }
    .price { font-size: 17px; font-weight: 900; fill: #9b652f; }
    .number { font-size: 14px; font-weight: 900; fill: white; }
  </style>
  <text x="70" y="68" class="title">COFFEE TOWN · 전체 제조법</text>
  <text x="70" y="102" class="subtitle">개발 테스트용 레시피 치트 시트 · 중간 조합과 완성 음료</text>
  ${section("중간 조합", intermediate, 70, 160, "#6f8c78")}
  ${section("완성 음료", final, 910, 160, "#b77849")}
</svg>`;
const output = resolve("docs/coffee-town-recipe-chart.svg");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, svg);
console.log(output);

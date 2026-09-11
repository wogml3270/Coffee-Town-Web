import { mkdir, writeFile } from "node:fs/promises";
import { loadTypescript } from "./lib/load-typescript.mjs";

const { labels, recipeTierOf } = await loadTypescript(new URL("../src/game/catalog.ts", import.meta.url));
const { itemArtwork } = await loadTypescript(new URL("../src/game/itemArtwork.ts", import.meta.url));
const directory = new URL("../public/assets/items/", import.meta.url);
await mkdir(directory, { recursive: true });
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

const garnish = (kind) => {
  if (["lemon", "grapefruit", "yuzu"].includes(kind)) {
    const color = { lemon: "#f5d567", grapefruit: "#ed9a88", yuzu: "#e6b63d" }[kind];
    return `<circle cx="91" cy="76" r="17" fill="${color}"/><circle cx="91" cy="76" r="12" fill="none" stroke="#fff4d0" stroke-width="3"/><path d="m91 64 0 24m-10-18 20 12m-20 0 20-12" stroke="#fff4d0" stroke-width="2"/>${kind === "yuzu" ? '<path d="M88 57q9-15 18-8-3 11-18 8" fill="#829952"/>' : ""}`;
  }
  if (kind === "coffee") return '<ellipse cx="92" cy="81" rx="10" ry="14" transform="rotate(32 92 81)" fill="#76513b"/><path d="M96 70q-12 7-9 20" fill="none" stroke="#c5a07c" stroke-width="3"/>';
  if (kind === "vanilla") return '<path d="M85 95q8-17 7-34m2 35q11-18 11-33" fill="none" stroke="#77533c" stroke-width="5"/><path d="M96 59q-14-13-13-1-14 4 0 11-2 14 10 5 11 8 9-5 13-7 0-10z" fill="#fff1cb" stroke="#c8b782" stroke-width="1.5"/><circle cx="94" cy="66" r="4" fill="#d8b35e"/>';
  if (kind === "chocolate") return '<g transform="rotate(18 91 82)"><rect x="77" y="68" width="28" height="30" rx="3" fill="#764a37"/><path d="M91 70v26m-12-13h24" stroke="#b08765" stroke-width="3"/></g>';
  if (kind === "caramel") return '<path d="M84 74q6-5 14 0l5 14-18 5-8-13z" fill="#d49d4e"/><path d="m83 78 13 2m-9 9 11-4" stroke="#f4d18d" stroke-width="3"/>';
  if (kind === "matcha") return '<path d="M79 95q-4-25 26-32 3 26-26 32" fill="#7c9955"/><path d="m80 94 20-24m-11 15-1-10m6 6 8 1" stroke="#c4d29d" stroke-width="2"/>';
  if (kind === "oat") return '<path d="m85 99 14-40" fill="none" stroke="#b29455" stroke-width="2"/><g fill="#dcc185" stroke-width="1.5"><ellipse cx="92" cy="69" rx="4" ry="8" transform="rotate(-30 92 69)"/><ellipse cx="101" cy="75" rx="4" ry="8" transform="rotate(35 101 75)"/><ellipse cx="87" cy="82" rx="4" ry="8" transform="rotate(-30 87 82)"/><ellipse cx="96" cy="88" rx="4" ry="8" transform="rotate(35 96 88)"/></g>';
  return "";
};
const ice = '<g fill="#eafaff" fill-opacity=".75" stroke="#a3cbd4" stroke-width="1.5"><rect x="45" y="53" width="17" height="16" rx="4" transform="rotate(-12 53 61)"/><rect x="66" y="62" width="17" height="16" rx="4" transform="rotate(18 74 70)"/><rect x="48" y="78" width="16" height="15" rx="4" transform="rotate(10 56 85)"/><path d="m49 57 8-1m13 13 8 2" stroke="#fff" stroke-width="3"/></g>';
const draw = (a) => {
  const { vessel: v, color: c, accent: b } = a;
  let body = "";
  if (v === "bag") body = `<path d="M40 31h47l-4 14 8 54q-28 9-58 0l8-54z" fill="${c}"/><path d="M42 34h42m-43 9h42" stroke="${b}" stroke-width="4"/><rect x="44" y="59" width="35" height="29" rx="5" fill="#f5e8cd"/><ellipse cx="61" cy="73" rx="7" ry="10" fill="${c}"/><path d="m64 65-6 16" stroke="${b}" stroke-width="2"/>`;
  else if (v === "carton") body = `<path d="m41 43 10-19h25l12 19v57H41z" fill="${c}"/><path d="m51 24 12 19v57H41V43z" fill="${b}"/><path d="M41 43h47M63 43l13-19" fill="none"/><path d="M53 21h23" stroke-width="5"/><rect x="68" y="54" width="13" height="23" rx="6" fill="${b}" stroke="none"/><path d="M46 88h11" stroke="#fff5db" stroke-width="3"/>`;
  else if (v === "bottle") body = `<path d="M53 29h22v15q13 6 13 16v38q-23 8-48 0V60q0-10 13-16z" fill="${c}"/><rect x="51" y="21" width="26" height="12" rx="3" fill="${b}"/><rect x="44" y="62" width="40" height="22" rx="3" fill="#faf0d9"/><path d="M49 49q-4 3-4 10v31" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="4"/>${a.garnish ? "" : '<g fill="#78bbac" stroke="none"><circle cx="57" cy="70" r="4"/><circle cx="71" cy="77" r="3"/><circle cx="67" cy="67" r="2"/></g>'}`;
  else if (v === "jar") body = `<rect x="35" y="40" width="57" height="59" rx="10" fill="${c}"/><rect x="33" y="29" width="61" height="15" rx="4" fill="${b}"/><path d="M41 34h44M43 50v37" fill="none" stroke="#fff4d7" stroke-opacity=".6" stroke-width="4"/><path d="M44 91q16 5 36 0" fill="none" stroke="${b}"/>`;
  else if (v === "beans") body = `<path d="M39 98q25-22 32-62M53 103q20-34 24-78M66 103q21-32 19-68" stroke="${c}" stroke-width="10" fill="none"/><path d="M43 95q23-25 26-55M57 96q17-36 18-63" stroke="${b}" stroke-width="2" fill="none"/>`;
  else if (v === "ice") body = `<g fill="${c}" stroke="${b}" stroke-width="2.5"><path d="m30 48 28-10 25 13-4 30-27 10-24-13z"/><path d="m60 70 26-9 21 14-4 25-24 9-23-14z"/><path d="m28 48 25 13 30-10M53 61l-1 30m5-20 23 13 27-9M80 84l-1 25" fill="none"/><path d="m37 68 7 4m22 14 6 4" stroke="#f4ffff" stroke-width="4"/></g>`;
  else if (v === "bowl") body = `<ellipse cx="62" cy="93" rx="18" ry="5" fill="${b}"/><path d="M28 65h68q-5 32-34 32T28 65" fill="#f1e8ce"/><ellipse cx="62" cy="64" rx="34" ry="13" fill="${b}"/><path d="M35 64q10-23 27-26 17 2 27 26z" fill="${c}"/><path d="m48 58 4-4m15-6 5 5m-9 7 5 2" stroke="${b}" stroke-width="3"/>`;
  else if (v === "pitcher") body = `<path d="M83 49h13q13 21-11 35" fill="none" stroke="${b}" stroke-width="8"/><path d="m34 38 54 6-4 55q-24 8-45 0V53l-9-13z" fill="${c}"/><path d="m38 41 46 5" stroke="#f9f4df" stroke-width="5"/><path d="M46 58v30" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>`;
  else if (v === "cup") body = `<ellipse cx="62" cy="104" rx="42" ry="6" fill="#efe4cc"/><path d="M87 49h8q17 0 13 17-3 13-23 12" fill="none" stroke="#d6c7ad" stroke-width="8"/><path d="M30 44h62l-4 38q-2 19-27 19T34 82z" fill="#fcf4e4"/><path d="M37 66h48" stroke="${b}" stroke-width="5" opacity=".5"/><ellipse cx="61" cy="44" rx="31" ry="10" fill="${c}"/><ellipse cx="61" cy="44" rx="24" ry="6" fill="${b}" stroke="none" opacity=".65"/>`;
  else {
    const top = v === "shot" ? 49 : 30;
    body = `<path d="M35 ${top}h56l-7 71q-19 7-42 0z" fill="#e7efea"/><path d="M40 ${top + 12}h46l-6 ${86 - top}q-15 5-34 0z" fill="${c}" stroke="none"/>${a.layers ? `<path d="M43 71h40l-3 27H46z" fill="${b}" stroke="none"/><path d="M42 64q16 9 42 0" fill="none" stroke="${b}" stroke-width="8"/>` : ""}<ellipse cx="63" cy="${top}" rx="28" ry="6" fill="${b}"/><path d="M43 ${top + 13} 47 91" stroke="#fff" stroke-opacity=".6" stroke-width="4"/>`;
    if (v === "blended") body += `<path d="m76 49 8-35" stroke="${b}" stroke-width="7"/><path d="M35 41q-1-11 11-13-1-10 13-11 8-14 13 0 16 0 15 12 11 3 6 12z" fill="#fff2d8"/><path d="M45 34q21 6 39-3M52 25h21" fill="none" stroke="${b}" stroke-width="3"/><path d="M33 44h61" stroke="#d9d8bb" stroke-width="4"/>`;
  }
  if (a.ice && v !== "ice") body += ice;
  if (a.foam) body += v === "cup" ? '<path d="M46 44c0-10 14-9 15-2 3-8 19-7 15 2-3 5-10 6-15 9-7-4-13-4-15-9" fill="#fff4df" stroke="none"/>' : '<path d="M39 40q6-10 13-3 9-12 17-2 10-8 17 5" stroke="#fff2da" stroke-width="8" fill="none"/>';
  if (a.steam) body += '<path d="M49 25q-7-7 0-14m14 14q-7-7 0-14" stroke="#bda88e" opacity=".7" stroke-width="2.5" fill="none"/>';
  return body + garnish(a.garnish);
};

const entries = Object.entries(labels);
for (const [id, name] of entries) {
  if (!itemArtwork[id]) throw new Error(`Missing artwork: ${id}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-labelledby="title"><title id="title">${escape(name)}</title><ellipse cx="65" cy="111" rx="39" ry="6" fill="#55432b" opacity=".1"/><g stroke="#6e5946" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${draw(itemArtwork[id])}</g></svg>\n`;
  await writeFile(new URL(`${id}.svg`, directory), svg);
}
await writeFile(new URL("../../../docs/item-artwork.html", directory), `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coffee Town · 전체 아이템 SVG</title><style>body{background:#f4efe4;color:#43372d;font:15px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px}article{border:1px solid #dfd4c1;border-radius:20px;background:#fffaf1;text-align:center;padding:18px}img{width:112px;height:112px}small{display:block;color:#8c7965}h1{font-size:26px}</style><h1>Coffee Town · ${entries.length}종 아이템</h1><p>재료 · 가공 재료 · 베이스 · 완성 음료</p><main>${entries.map(([id, name]) => `<article><img src="../public/assets/items/${id}.svg" alt="${escape(name)}"><strong>${escape(name)}</strong><small>${recipeTierOf(id)}단계 · ${id}</small></article>`).join("")}</main></html>`);
console.log(`Generated ${entries.length} SVG icons and docs/item-artwork.html`);

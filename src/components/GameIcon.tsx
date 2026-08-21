import type { ItemId } from "../types/game";

type GameIconProps = Readonly<{ itemId: ItemId; className?: string }>;

const common = { viewBox: "0 0 64 64", fill: "none", xmlns: "http://www.w3.org/2000/svg" };

export const GameIcon = ({ itemId, className = "size-10" }: GameIconProps) => {
  if (itemId.includes("sauce") || itemId.includes("syrup")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M22 8h20v9l5 7v31H17V24l5-7V8Z" fill="#D7A873" stroke="#694A38" strokeWidth="3"/><path d="M24 8h16M20 29h24v16H20z" fill="#F5E4C9"/><path d="M26 37h12" stroke="#9A6847" strokeWidth="3" strokeLinecap="round"/></svg>
  );
  if (itemId.includes("bean")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M46 10C26 8 11 23 14 43c2 13 15 16 25 8 13-10 18-28 7-41Z" fill="#9B6B57"/><path d="M43 14c-2 13-10 18-25 30" stroke="#5F3E34" strokeWidth="5" strokeLinecap="round"/></svg>
  );
  if (itemId === "steamed_milk" || itemId === "milk_foam") return (
    <svg {...common} className={className} aria-hidden="true"><path d="M13 18h36v23c0 10-8 16-18 16S13 51 13 41V18Z" fill="#F7F1E8" stroke="#6D5B52" strokeWidth="3"/><path d="M49 25h5c8 0 8 14 0 14h-5" stroke="#6D5B52" strokeWidth="4"/><ellipse cx="31" cy="18" rx="18" ry="7" fill="#FFFDF8" stroke="#6D5B52" strokeWidth="3"/><path d="M25 18c4-4 10-4 14 0-4 4-10 4-14 0Z" fill="#D8BDA7"/></svg>
  );
  if (itemId.includes("water")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M32 7c8 13 18 23 18 34a18 18 0 1 1-36 0C14 30 24 20 32 7Z" fill={itemId.includes("sparkling") ? "#CDE9E8" : "#C9E2F1"} stroke="#5D8D9B" strokeWidth="3"/><circle cx="27" cy="37" r="3" fill="#FFF"/><circle cx="36" cy="29" r="2.5" fill="#FFF"/><circle cx="39" cy="43" r="2" fill="#FFF"/></svg>
  );
  if (itemId.includes("ice")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="m13 19 21-8 18 14-5 25-25 3L11 36l2-17Z" fill="#DDF2F5" stroke="#78A8B3" strokeWidth="3"/><path d="m13 19 19 13 20-7M32 32l-10 21" stroke="#A7CFD7" strokeWidth="2"/></svg>
  );
  if (itemId.includes("milk")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M20 16h26l5 10v30H14V26l6-10Z" fill="#F8FBFF" stroke="#6E8DA1" strokeWidth="3"/><path d="M20 16V8h25v8M15 29h36v18H15z" fill="#CDEBF4"/><path d="M25 38h16" stroke="#4C8DA8" strokeWidth="4" strokeLinecap="round"/></svg>
  );
  if (itemId.includes("lemon")) return (
    <svg {...common} className={className} aria-hidden="true"><circle cx="32" cy="33" r="22" fill="#F4D77A" stroke="#C99E2E" strokeWidth="3"/><path d="m32 33 13-16M32 33l-19 2M32 33l11 17" stroke="#FFF4B7" strokeWidth="3"/></svg>
  );
  if (itemId.includes("grapefruit")) return (
    <svg {...common} className={className} aria-hidden="true"><circle cx="32" cy="33" r="22" fill="#F2A197" stroke="#C96662" strokeWidth="3"/><path d="m32 33 13-16M32 33l-19 2M32 33l11 17" stroke="#FFD1C9" strokeWidth="3"/></svg>
  );
  if (itemId.includes("matcha")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M12 48C14 25 27 13 53 12c-1 24-15 38-41 36Z" fill="#88B58A" stroke="#4F7C59" strokeWidth="3"/><path d="M17 44c10-10 19-17 30-25" stroke="#E4F1D8" strokeWidth="3" strokeLinecap="round"/></svg>
  );
  if (itemId.includes("latte")) return (
    <svg {...common} className={className} aria-hidden="true"><path d="M13 19h39l-4 33H18l-5-33Z" fill="#F4E8D5" stroke="#76594C" strokeWidth="3"/><ellipse cx="32.5" cy="19" rx="19.5" ry="8" fill="#D9B798" stroke="#76594C" strokeWidth="3"/><path d="M24 18c5-5 12-5 17 0-5 5-12 5-17 0Z" fill="#FFF8E9"/></svg>
  );
  return (
    <svg {...common} className={className} aria-hidden="true"><path d="M13 18h36v23c0 10-8 16-18 16S13 51 13 41V18Z" fill="#A46D54" stroke="#5B4037" strokeWidth="3"/><path d="M49 25h5c8 0 8 14 0 14h-5" stroke="#5B4037" strokeWidth="4"/><ellipse cx="31" cy="18" rx="18" ry="7" fill="#6D4536"/></svg>
  );
};

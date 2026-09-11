import { useEffect, useState, type CSSProperties } from "react";
import { recipeArchive, recipeTierMeta, type RecipeTier } from "../game/catalog";
import { useGame } from "../game/store";
import { ItemImage } from "./ItemImage";
import { RecipeIngredients } from "./RecipeIngredients";

export const RecipeBook = () => {
  const [tab, setTab] = useState<RecipeTier>(1);
  const screen = useGame(({ screen }) => screen);
  const open = useGame(({ recipeBookOpen }) => recipeBookOpen);
  const setOpen = useGame(({ setRecipeBookOpen }) => setRecipeBookOpen);
  const unlockedStage = useGame(({ unlockedStage }) => unlockedStage);
  const discovered = useGame(({ discoveredRecipes }) => discoveredRecipes);
  const visibleRecipes = recipeArchive.filter(({ tier }) => tier === tab);
  const discoverableRecipes = recipeArchive;
  useEffect(() => {
    const toggleRecipeBook = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "KeyB" || event.key.toLowerCase() === "b" || event.key === "ㅠ") {
        event.preventDefault();
        setOpen(!open);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", toggleRecipeBook, true);
    return () => window.removeEventListener("keydown", toggleRecipeBook, true);
  }, [open, setOpen]);
  return (
    <aside className={`recipe-book ${screen}`}>
      <button
        className="recipe-book-button"
        type="button"
        aria-label="레시피 도감 열기"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4V4Z" />
        </svg>
        <kbd>B</kbd>
      </button>
      {open ? (
        <section className="recipe-book-modal" role="dialog" aria-label="레시피 도감">
          <div>
            <header>
              <div>
                <p>COFFEE TOWN ARCHIVE</p>
                <h2>레시피 도감</h2>
                <span>
                  {discoverableRecipes.filter(({ id }) => discovered.includes(id)).length}/
                  {discoverableRecipes.length} 발견
                </span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </header>
            <nav className="recipe-tabs recipe-tier-tabs" aria-label="제조 단계">
              {(Object.entries(recipeTierMeta) as [string, (typeof recipeTierMeta)[RecipeTier]][]).map(
                ([tier, meta]) => {
                  const tierNumber = Number(tier) as RecipeTier;
                  return (
                    <button
                      className={tab === tierNumber ? "active" : ""}
                      type="button"
                      key={tier}
                      style={{ "--tier-color": meta.color } as CSSProperties}
                      onClick={() => setTab(tierNumber)}
                    >
                      <b>{tier}단계</b>
                      <small>{meta.name}</small>
                    </button>
                  );
                },
              )}
            </nav>
            {tab === 5 ? (
              <section className="blender-guide">
                <strong>BLENDER</strong>
                <span>맛 베이스를 선택하고, 우유와 얼음을 작업대에 준비한 뒤 블렌더를 사용하세요.</span>
              </section>
            ) : null}
            <div className="recipe-grid">
              {visibleRecipes.map((menu) => {
                const found = discovered.includes(menu.id);
                const available = menu.stage <= unlockedStage;
                const revealed = found || menu.category === "source";
                return (
                  <article
                    key={menu.id}
                    className={`${found ? "found" : available ? "available" : "locked"} recipe-temperature-${menu.temperature}`}
                    style={{ "--tier-color": recipeTierMeta[menu.tier].color } as CSSProperties}
                  >
                    {available || found ? (
                      <ItemImage itemId={menu.id} />
                    ) : (
                      <span className="item-image item-image-unknown" aria-label="미해금 아이템">
                        ?
                      </span>
                    )}
                    <i>{found ? "✓" : "?"}</i>
                    <small>
                      {menu.tier}단계 · {recipeTierMeta[menu.tier].name}
                    </small>
                    <h3>{revealed ? menu.name : available ? menu.name : "???"}</h3>
                    <p>{revealed ? menu.recipe : "조합에 성공하면 제조법이 공개됩니다"}</p>
                    {found ? <RecipeIngredients itemId={menu.id} /> : null}
                    {found && menu.price ? (
                      <strong className="recipe-price">판매가 {menu.price.toLocaleString("ko-KR")}원</strong>
                    ) : null}
                    {menu.temperature !== "neutral" ? (
                      <span className={`recipe-temperature-badge badge-${menu.temperature}`}>
                        {menu.temperature === "hot" ? "♨ HOT" : "❄ ICED"}
                      </span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </aside>
  );
};

import { labels, recipes, stationProcesses, type ItemId } from "../game/catalog";
import { ItemImage } from "./ItemImage";

export const RecipeIngredients = ({ itemId }: Readonly<{ itemId: ItemId }>) => {
  const routes: readonly (readonly ItemId[])[] = [
    ...recipes.filter(({ output }) => output === itemId).map(({ inputs }) => inputs),
    ...stationProcesses
      .filter(({ output, input }) => output === itemId && input)
      .map(({ input, additionalInputs }) => [input!, ...(additionalInputs ?? [])]),
  ];
  if (!routes.length) return null;
  return (
    <div className="recipe-ingredients" aria-label="필요 재료">
      {routes.map((inputs, index) => (
        <div className="recipe-ingredient-route" key={index}>
          {inputs.map((input, slot) => (
            <span className="recipe-ingredient" key={`${input}-${slot}`}>
              {slot > 0 ? <b aria-hidden="true">+</b> : null}
              <span>
                <ItemImage itemId={input} />
                <small>{labels[input]}</small>
              </span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

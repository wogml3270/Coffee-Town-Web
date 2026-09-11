import { labels, type ItemId } from "../game/catalog";

export const ItemImage = ({ itemId, decorative = true, className = "" }: Readonly<{
  itemId: ItemId;
  decorative?: boolean;
  className?: string;
}>) => (
  <img className={`item-image ${className}`} src={`/assets/items/${itemId}.svg`}
    width={96} height={96} alt={decorative ? "" : labels[itemId]}
    draggable={false} decoding="async" loading="lazy" />
);

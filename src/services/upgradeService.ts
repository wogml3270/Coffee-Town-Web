import type { Upgrades } from "../game/rules";
import { upgradeNodes, type UpgradeCategoryId, type UpgradeId, type UpgradeNode } from "../game/upgradeTree";
import { supabase } from "./supabaseClient";

export const loadPlayerUpgrades = async (userId: string): Promise<Partial<Upgrades>> => {
  const { data, error } = await supabase
    .from("player_upgrades")
    .select("upgrade_id,level")
    .eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map(({ upgrade_id, level }) => [upgrade_id, Number(level)]));
};

const isUpgradeId = (value: string): value is UpgradeId => upgradeNodes.some(({ id }) => id === value);

export const loadUpgradeCatalog = async (): Promise<readonly UpgradeNode[]> => {
  const [nodesResult, levelsResult, requirementsResult] = await Promise.all([
    supabase
      .from("upgrade_nodes")
      .select("id,category_id,name,description,max_level,position_x,position_y,is_premium")
      .eq("enabled", true),
    supabase.from("upgrade_levels").select("upgrade_id,level,cost").order("level"),
    supabase.from("upgrade_prerequisites").select("upgrade_id,required_upgrade_id,required_level"),
  ]);
  const error = nodesResult.error ?? levelsResult.error ?? requirementsResult.error;
  if (error) throw error;
  return (nodesResult.data ?? [])
    .filter(({ id }) => isUpgradeId(id))
    .map((row) => {
      const fallback = upgradeNodes.find(({ id }) => id === row.id)!;
      return {
        id: row.id as UpgradeId,
        category: row.category_id as UpgradeCategoryId,
        name: row.name,
        description: row.description,
        maxLevel: row.max_level,
        costs: (levelsResult.data ?? [])
          .filter(({ upgrade_id }) => upgrade_id === row.id)
          .map(({ cost }) => Number(cost)),
        // 트리 배치는 화면 설계에 속한다. DB의 구형 좌표가 새 UI를 덮어쓰지 않도록
        // 번들 레이아웃을 사용하고 DB는 카탈로그/가격/선행 조건만 관리한다.
        x: fallback.x,
        y: fallback.y,
        premium: row.is_premium,
        requirements: (requirementsResult.data ?? [])
          .filter(({ upgrade_id }) => upgrade_id === row.id)
          .filter(({ required_upgrade_id }) => isUpgradeId(required_upgrade_id))
          .map(({ required_upgrade_id, required_level }) => ({
            upgradeId: required_upgrade_id as UpgradeId,
            level: required_level,
          })),
      };
    });
};

export type UpgradePurchase = Readonly<{ gold: number; upgradeId: UpgradeId; newLevel: number }>;

export const purchaseUpgrade = async (upgradeId: UpgradeId): Promise<UpgradePurchase> => {
  const { data, error } = await supabase.rpc("purchase_upgrade", { p_upgrade_id: upgradeId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("업그레이드 구매 결과를 받지 못했습니다.");
  return { gold: Number(row.gold), upgradeId: row.upgrade_id as UpgradeId, newLevel: Number(row.new_level) };
};

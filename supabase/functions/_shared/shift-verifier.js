//#region src/game/catalog.ts
const drinkIds = [
	"americano",
	"iced_americano",
	"latte",
	"iced_latte",
	"vanilla_latte",
	"mocha",
	"caramel_macchiato",
	"lemonade",
	"grapefruitade",
	"yuzu_tea",
	"matcha_latte",
	"chocolate_latte",
	"cold_brew",
	"vanilla_oat_cold_brew",
	"mocha_blended",
	"vanilla_blended",
	"matcha_blended",
	"chocolate_blended"
];
const stationUnlockStage = {
	grinder: 1,
	espresso: 1,
	cups: 1,
	water: 1,
	coldWater: 1,
	fridge: 1,
	steam: 1,
	ice: 1,
	sparkling: 5,
	coldBrew: 10,
	blender: 12,
	serve: 1
};
const stationProcesses = [
	{
		station: "grinder",
		output: "ground_coffee",
		seconds: 4
	},
	{
		station: "cups",
		output: "cup",
		seconds: 0,
		instant: true
	},
	{
		station: "water",
		output: "hot_water",
		seconds: 3
	},
	{
		station: "coldWater",
		output: "cold_water",
		seconds: 2
	},
	{
		station: "ice",
		output: "ice",
		seconds: 4
	},
	{
		station: "sparkling",
		output: "sparkling_water",
		seconds: 3
	},
	{
		station: "coldBrew",
		output: "cold_brew_concentrate",
		seconds: 5
	},
	{
		station: "espresso",
		input: "ground_coffee",
		output: "espresso",
		seconds: 7
	},
	{
		station: "steam",
		input: "milk",
		output: "steamed_milk",
		seconds: 6
	},
	{
		station: "blender",
		input: "mocha_base",
		additionalInputs: ["milk", "ice"],
		output: "mocha_blended",
		seconds: 7
	},
	{
		station: "blender",
		input: "vanilla_cup",
		additionalInputs: ["milk", "ice"],
		output: "vanilla_blended",
		seconds: 7
	},
	{
		station: "blender",
		input: "matcha_cup",
		additionalInputs: ["milk", "ice"],
		output: "matcha_blended",
		seconds: 8
	},
	{
		station: "blender",
		input: "chocolate_cup",
		additionalInputs: ["milk", "ice"],
		output: "chocolate_blended",
		seconds: 8
	}
];
const labels = {
	ground_coffee: "분쇄 원두",
	espresso: "에스프레소",
	cup: "컵",
	espresso_cup: "에스프레소 컵",
	hot_water: "뜨거운 물",
	cold_water: "차가운 물",
	milk: "우유",
	oat_milk: "오트밀크",
	steamed_milk: "스팀 밀크",
	ice: "얼음",
	iced_cup: "얼음 컵",
	sparkling_water: "탄산수",
	lemon_syrup: "레몬청",
	grapefruit_syrup: "자몽청",
	yuzu_syrup: "유자청",
	vanilla_syrup: "바닐라 시럽",
	vanilla_bean: "바닐라빈",
	chocolate_sauce: "초콜릿 소스",
	caramel_sauce: "카라멜 소스",
	matcha_powder: "말차 파우더",
	cold_brew_concentrate: "콜드브루 원액",
	lemon_base: "레몬 베이스",
	grapefruit_base: "자몽 베이스",
	yuzu_base: "유자 베이스",
	iced_espresso_base: "아이스 에스프레소",
	iced_milk_base: "아이스 밀크",
	vanilla_espresso: "바닐라 에스프레소",
	mocha_base: "모카 베이스",
	vanilla_cup: "바닐라 베이스",
	vanilla_milk_cup: "바닐라 밀크",
	caramel_base: "마키아토 베이스",
	matcha_cup: "말차 베이스",
	chocolate_cup: "초콜릿 베이스",
	cold_brew_base: "콜드브루 베이스",
	oat_cup: "오트 베이스",
	oat_cold_brew_base: "오트 콜드브루",
	americano: "아메리카노",
	iced_americano: "아이스 아메리카노",
	latte: "카페라떼",
	iced_latte: "아이스 카페라떼",
	vanilla_latte: "바닐라 라떼",
	mocha: "카페모카",
	caramel_macchiato: "카라멜 마키아토",
	lemonade: "레몬에이드",
	grapefruitade: "자몽에이드",
	yuzu_tea: "유자차",
	matcha_latte: "말차라떼",
	chocolate_latte: "초콜릿 라떼",
	cold_brew: "콜드브루",
	vanilla_oat_cold_brew: "바닐라빈 오트 콜드브루",
	mocha_blended: "카페모카 아이스 블렌디드",
	vanilla_blended: "바닐라 아이스 블렌디드",
	matcha_blended: "말차 아이스 블렌디드",
	chocolate_blended: "초콜릿 아이스 블렌디드"
};
const fridgeIngredients = [
	{
		itemId: "milk",
		minStage: 1
	},
	{
		itemId: "oat_milk",
		minStage: 11
	},
	{
		itemId: "vanilla_syrup",
		minStage: 2
	},
	{
		itemId: "chocolate_sauce",
		minStage: 3
	},
	{
		itemId: "caramel_sauce",
		minStage: 4
	},
	{
		itemId: "lemon_syrup",
		minStage: 5
	},
	{
		itemId: "grapefruit_syrup",
		minStage: 6
	},
	{
		itemId: "yuzu_syrup",
		minStage: 7
	},
	{
		itemId: "matcha_powder",
		minStage: 8
	},
	{
		itemId: "vanilla_bean",
		minStage: 11
	}
];
const menuCatalog = [
	{
		id: "americano",
		name: "아메리카노",
		stage: 1,
		reward: 4e3,
		recipe: "컵 + 에스프레소 + 온수"
	},
	{
		id: "iced_americano",
		name: "아이스 아메리카노",
		stage: 1,
		reward: 4300,
		recipe: "컵 + 얼음 + 에스프레소 + 냉수"
	},
	{
		id: "latte",
		name: "카페라떼",
		stage: 1,
		reward: 4500,
		recipe: "컵 + 에스프레소 + 스팀 밀크"
	},
	{
		id: "iced_latte",
		name: "아이스 카페라떼",
		stage: 1,
		reward: 4800,
		recipe: "컵 + 얼음 + 우유 + 에스프레소"
	},
	{
		id: "vanilla_latte",
		name: "바닐라 라떼",
		stage: 2,
		reward: 5e3,
		recipe: "컵 + 에스프레소 + 바닐라 시럽 + 스팀 밀크"
	},
	{
		id: "mocha",
		name: "카페모카",
		stage: 3,
		reward: 5200,
		recipe: "컵 + 에스프레소 + 초콜릿 소스 + 스팀 밀크"
	},
	{
		id: "caramel_macchiato",
		name: "카라멜 마키아토",
		stage: 4,
		reward: 5200,
		recipe: "컵 + 바닐라 시럽 + 스팀 밀크 + 에스프레소 + 카라멜"
	},
	{
		id: "lemonade",
		name: "레몬에이드",
		stage: 5,
		reward: 5e3,
		recipe: "컵 + 얼음 + 레몬청 + 탄산수"
	},
	{
		id: "grapefruitade",
		name: "자몽에이드",
		stage: 6,
		reward: 5500,
		recipe: "컵 + 얼음 + 자몽청 + 탄산수"
	},
	{
		id: "yuzu_tea",
		name: "유자차",
		stage: 7,
		reward: 4800,
		recipe: "컵 + 유자청 + 온수"
	},
	{
		id: "matcha_latte",
		name: "말차라떼",
		stage: 8,
		reward: 5200,
		recipe: "컵 + 말차 + 스팀 밀크"
	},
	{
		id: "chocolate_latte",
		name: "초콜릿 라떼",
		stage: 9,
		reward: 5200,
		recipe: "컵 + 초콜릿 소스 + 스팀 밀크"
	},
	{
		id: "cold_brew",
		name: "콜드브루",
		stage: 10,
		reward: 4800,
		recipe: "컵 + 얼음 + 콜드브루 원액 + 냉수"
	},
	{
		id: "vanilla_oat_cold_brew",
		name: "바닐라빈 오트 콜드브루",
		stage: 11,
		reward: 6e3,
		recipe: "얼음 컵 + 오트밀크 + 콜드브루 + 바닐라빈"
	},
	{
		id: "mocha_blended",
		name: "카페모카 아이스 블렌디드",
		stage: 12,
		reward: 6500,
		recipe: "모카 베이스 + 우유 + 얼음 → 블렌더로 블렌딩"
	},
	{
		id: "vanilla_blended",
		name: "바닐라 아이스 블렌디드",
		stage: 13,
		reward: 6500,
		recipe: "바닐라 베이스 + 우유 + 얼음 → 블렌더로 블렌딩"
	},
	{
		id: "matcha_blended",
		name: "말차 아이스 블렌디드",
		stage: 14,
		reward: 6800,
		recipe: "말차 베이스 + 우유 + 얼음 → 블렌더로 블렌딩"
	},
	{
		id: "chocolate_blended",
		name: "초콜릿 아이스 블렌디드",
		stage: 15,
		reward: 6800,
		recipe: "초콜릿 베이스 + 우유 + 얼음 → 블렌더로 블렌딩"
	}
];
const stages = Array.from({ length: Math.max(...menuCatalog.map(({ stage }) => stage)) }, (_, index) => {
	const id = index + 1;
	return {
		id,
		name: id === 1 ? "첫 영업" : `${id}일차`,
		rewardMultiplier: 1 + index * .12,
		unlock: (menuCatalog.find(({ stage }) => stage === id) ?? menuCatalog[0]).id
	};
});
const recipes = Object.values({
	cupBases: [
		{
			inputs: ["espresso", "cup"],
			output: "espresso_cup"
		},
		{
			inputs: ["cup", "ice"],
			output: "iced_cup"
		},
		{
			inputs: ["iced_cup", "milk"],
			output: "iced_milk_base"
		}
	],
	coffee: [
		{
			inputs: ["espresso_cup", "hot_water"],
			output: "americano"
		},
		{
			inputs: ["espresso_cup", "ice"],
			output: "iced_espresso_base"
		},
		{
			inputs: ["iced_cup", "espresso"],
			output: "iced_espresso_base"
		},
		{
			inputs: ["iced_espresso_base", "cold_water"],
			output: "iced_americano"
		},
		{
			inputs: ["iced_espresso_base", "milk"],
			output: "iced_latte"
		},
		{
			inputs: ["iced_milk_base", "espresso"],
			output: "iced_latte"
		},
		{
			inputs: ["espresso_cup", "steamed_milk"],
			output: "latte"
		}
	],
	flavoredCoffee: [
		{
			inputs: ["espresso_cup", "vanilla_syrup"],
			output: "vanilla_espresso"
		},
		{
			inputs: ["vanilla_espresso", "steamed_milk"],
			output: "vanilla_latte"
		},
		{
			inputs: ["espresso_cup", "chocolate_sauce"],
			output: "mocha_base"
		},
		{
			inputs: ["mocha_base", "steamed_milk"],
			output: "mocha"
		},
		{
			inputs: ["cup", "vanilla_syrup"],
			output: "vanilla_cup"
		},
		{
			inputs: ["vanilla_cup", "steamed_milk"],
			output: "vanilla_milk_cup"
		},
		{
			inputs: ["vanilla_milk_cup", "espresso"],
			output: "caramel_base"
		},
		{
			inputs: ["caramel_base", "caramel_sauce"],
			output: "caramel_macchiato"
		}
	],
	nonCoffee: [
		{
			inputs: ["iced_cup", "lemon_syrup"],
			output: "lemon_base"
		},
		{
			inputs: ["lemon_base", "sparkling_water"],
			output: "lemonade"
		},
		{
			inputs: ["iced_cup", "grapefruit_syrup"],
			output: "grapefruit_base"
		},
		{
			inputs: ["grapefruit_base", "sparkling_water"],
			output: "grapefruitade"
		},
		{
			inputs: ["cup", "yuzu_syrup"],
			output: "yuzu_base"
		},
		{
			inputs: ["yuzu_base", "hot_water"],
			output: "yuzu_tea"
		},
		{
			inputs: ["cup", "matcha_powder"],
			output: "matcha_cup"
		},
		{
			inputs: ["matcha_cup", "steamed_milk"],
			output: "matcha_latte"
		},
		{
			inputs: ["cup", "chocolate_sauce"],
			output: "chocolate_cup"
		},
		{
			inputs: ["chocolate_cup", "steamed_milk"],
			output: "chocolate_latte"
		}
	],
	coldBrew: [
		{
			inputs: ["iced_cup", "cold_brew_concentrate"],
			output: "cold_brew_base"
		},
		{
			inputs: ["cold_brew_base", "cold_water"],
			output: "cold_brew"
		},
		{
			inputs: ["iced_cup", "oat_milk"],
			output: "oat_cup"
		},
		{
			inputs: ["oat_cup", "cold_brew_concentrate"],
			output: "oat_cold_brew_base"
		},
		{
			inputs: ["oat_cold_brew_base", "vanilla_bean"],
			output: "vanilla_oat_cold_brew"
		}
	]
}).flat();
const recipeTierGroups = {
	1: [
		"ground_coffee",
		"cup",
		"hot_water",
		"cold_water",
		"milk",
		"oat_milk",
		"ice",
		"sparkling_water",
		"lemon_syrup",
		"grapefruit_syrup",
		"yuzu_syrup",
		"vanilla_syrup",
		"vanilla_bean",
		"chocolate_sauce",
		"caramel_sauce",
		"matcha_powder"
	],
	2: [
		"espresso",
		"steamed_milk",
		"iced_cup",
		"vanilla_cup",
		"matcha_cup",
		"chocolate_cup",
		"yuzu_base",
		"oat_cup",
		"cold_brew_concentrate"
	],
	3: [
		"espresso_cup",
		"iced_milk_base",
		"iced_espresso_base",
		"vanilla_espresso",
		"mocha_base",
		"vanilla_milk_cup",
		"caramel_base",
		"lemon_base",
		"grapefruit_base",
		"cold_brew_base",
		"oat_cold_brew_base"
	],
	4: [
		"americano",
		"iced_americano",
		"latte",
		"iced_latte",
		"vanilla_latte",
		"mocha",
		"caramel_macchiato",
		"lemonade",
		"grapefruitade",
		"yuzu_tea",
		"matcha_latte",
		"chocolate_latte",
		"cold_brew"
	],
	5: [
		"vanilla_oat_cold_brew",
		"mocha_blended",
		"vanilla_blended",
		"matcha_blended",
		"chocolate_blended"
	]
};
const recipeTierOf = (itemId) => {
	const entry = Object.entries(recipeTierGroups).find(([, ids]) => ids.includes(itemId));
	return entry ? Number(entry[0]) : 1;
};
const recipeStages = {
	vanilla_syrup: 2,
	vanilla_espresso: 2,
	chocolate_sauce: 3,
	mocha_base: 3,
	caramel_sauce: 4,
	vanilla_cup: 4,
	vanilla_milk_cup: 4,
	caramel_base: 4,
	sparkling_water: 5,
	lemon_syrup: 5,
	lemon_base: 5,
	grapefruit_syrup: 6,
	grapefruit_base: 6,
	yuzu_syrup: 7,
	yuzu_base: 7,
	matcha_powder: 8,
	matcha_cup: 8,
	chocolate_cup: 9,
	cold_brew_concentrate: 10,
	cold_brew_base: 10,
	oat_milk: 11,
	vanilla_bean: 11,
	oat_cup: 11,
	oat_cold_brew_base: 11
};
[
	...[
		{
			id: "ground_coffee",
			name: labels.ground_coffee,
			stage: 1,
			recipe: "그라인더에서 원두 분쇄",
			category: "source"
		},
		{
			id: "espresso",
			name: labels.espresso,
			stage: 1,
			recipe: "분쇄 원두를 에스프레소 머신으로 추출",
			category: "source"
		},
		{
			id: "cup",
			name: labels.cup,
			stage: 1,
			recipe: "컵 선반에서 컵 꺼내기",
			category: "source"
		},
		{
			id: "hot_water",
			name: labels.hot_water,
			stage: 1,
			recipe: "정수기에서 온수 선택",
			category: "source"
		},
		{
			id: "cold_water",
			name: labels.cold_water,
			stage: 1,
			recipe: "정수기에서 냉수 선택",
			category: "source"
		},
		{
			id: "milk",
			name: labels.milk,
			stage: 1,
			recipe: "재료 냉장고에서 우유 꺼내기"
		},
		{
			id: "steamed_milk",
			name: labels.steamed_milk,
			stage: 1,
			recipe: "우유를 스팀 완드로 데우기"
		},
		{
			id: "ice",
			name: labels.ice,
			stage: 1,
			recipe: "제빙기에서 얼음 받기"
		},
		{
			id: "vanilla_syrup",
			name: labels.vanilla_syrup,
			stage: 2,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "chocolate_sauce",
			name: labels.chocolate_sauce,
			stage: 3,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "caramel_sauce",
			name: labels.caramel_sauce,
			stage: 4,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "sparkling_water",
			name: labels.sparkling_water,
			stage: 5,
			recipe: "탄산수 머신에서 받기"
		},
		{
			id: "lemon_syrup",
			name: labels.lemon_syrup,
			stage: 5,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "grapefruit_syrup",
			name: labels.grapefruit_syrup,
			stage: 6,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "yuzu_syrup",
			name: labels.yuzu_syrup,
			stage: 7,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "matcha_powder",
			name: labels.matcha_powder,
			stage: 8,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "cold_brew_concentrate",
			name: labels.cold_brew_concentrate,
			stage: 10,
			recipe: "콜드브루 타워에서 추출"
		},
		{
			id: "oat_milk",
			name: labels.oat_milk,
			stage: 11,
			recipe: "재료 냉장고에서 꺼내기"
		},
		{
			id: "vanilla_bean",
			name: labels.vanilla_bean,
			stage: 11,
			recipe: "재료 냉장고에서 꺼내기"
		}
	].map((entry) => ({
		...entry,
		category: "source",
		tier: recipeTierOf(entry.id)
	})),
	...[...new Set(recipes.map(({ output }) => output))].map((output) => {
		const alternatives = recipes.filter((recipe) => recipe.output === output).map(({ inputs }) => `${labels[inputs[0]]} + ${labels[inputs[1]]}`);
		return {
			id: output,
			name: labels[output],
			stage: recipeStages[output] ?? menuCatalog.find(({ id }) => id === output)?.stage ?? 1,
			recipe: alternatives.length > 1 ? alternatives.map((recipe) => `- ${recipe}`).join("\n") : alternatives[0],
			price: menuCatalog.find(({ id }) => id === output)?.reward,
			category: drinkIds.includes(output) ? "final" : "intermediate",
			tier: recipeTierOf(output)
		};
	}),
	...menuCatalog.filter(({ id }) => !recipes.some(({ output }) => output === id)).map(({ id, name, stage, reward, recipe }) => ({
		id,
		name,
		stage,
		recipe,
		price: reward,
		category: "final",
		tier: recipeTierOf(id)
	}))
];
//#endregion
//#region src/game/rules.ts
const defaultUpgrades = {
	speed: 0,
	espressoSpeed: 0,
	coldDrinkSpeed: 0,
	movement: 0,
	multitask: 0,
	feverCharge: 0,
	feverDuration: 0,
	feverProfit: 0,
	tips: 0,
	comboGuard: 0,
	automation: 0,
	autoServe: 0
};
const stationIds = [
	"grinder",
	"espresso",
	"cups",
	"water",
	"coldWater",
	"fridge",
	"steam",
	"ice",
	"sparkling",
	"coldBrew",
	"blender",
	"serve"
];
const idle = () => ({
	phase: "idle",
	remaining: 0,
	total: 0,
	output: null
});
const emptyStations = () => Object.fromEntries(stationIds.map((id) => [id, idle()]));
const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const stageMenu = (stageId) => menuCatalog.filter(({ stage }) => stage <= stageId);
const orderRandom = (seed, sequence) => {
	let value = seed + Math.imul(sequence + 1, 1831565813) | 0;
	value = Math.imul(value ^ value >>> 15, value | 1);
	value ^= value + Math.imul(value ^ value >>> 7, value | 61);
	return ((value ^ value >>> 14) >>> 0) / 4294967296;
};
const makeOrder = (sequence, stageId, seed, previous) => {
	const menu = stageMenu(stageId);
	const candidates = menu.length > 1 ? menu.filter(({ id }) => id !== previous) : menu;
	const selected = candidates[Math.floor(orderRandom(seed, sequence) * candidates.length)] ?? menu[0];
	return {
		id: sequence,
		itemId: selected.id,
		name: selected.name,
		reward: selected.reward
	};
};
const makeOrderQueue = (sequence, stageId, seed, previous) => {
	const orders = [];
	let last = previous;
	for (let index = 0; index < 3; index += 1) {
		const order = makeOrder(sequence + index, stageId, seed, last);
		orders.push(order);
		last = order.itemId;
	}
	return orders;
};
const inventoryLimit = 9;
const add = (state, itemId) => state.inventory.length >= inventoryLimit ? state.inventory : [...state.inventory, {
	uid: uid(),
	itemId
}];
const without = (inventory, uidToRemove) => inventory.filter(({ uid: itemUid }) => itemUid !== uidToRemove);
const espressoStations = [
	"grinder",
	"espresso",
	"steam",
	"coldBrew"
];
const coldDrinkStations = [
	"ice",
	"sparkling",
	"blender"
];
const duration = (base, upgrades, fever, station) => {
	if (fever) return 1;
	const specialized = espressoStations.includes(station) ? upgrades.espressoSpeed * .05 : coldDrinkStations.includes(station) ? upgrades.coldDrinkSpeed * .05 : 0;
	return Math.max(1, Math.ceil(base * Math.max(.15, 1 - upgrades.speed * .12 - specialized)));
};
const setStation = (state, station, runtime) => ({
	...state,
	stations: {
		...state.stations,
		[station]: runtime
	}
});
const begin = (state, station, output, seconds, inventory = state.inventory) => {
	const total = duration(seconds, state.upgrades, state.fever, station);
	return {
		...setStation(state, station, {
			phase: "processing",
			remaining: total,
			total,
			output
		}),
		inventory,
		activeWork: station,
		notice: `${total}초 동안 작업 중입니다`
	};
};
const createShift = (upgrades = defaultUpgrades, stageId = 1, seed = Math.floor(Math.random() * 2147483647)) => {
	const stage = stages.find(({ id }) => id === stageId) ?? stages[0];
	const orders = makeOrderQueue(0, stage.id, seed);
	return {
		time: 360,
		gold: 0,
		score: 0,
		combo: 0,
		maxCombo: 0,
		mistakes: 0,
		discardedItems: 0,
		satisfactionTotal: 0,
		orderStartedAt: 360,
		fever: 0,
		orderSequence: 0,
		order: orders[0],
		orders,
		inventory: [],
		stations: emptyStations(),
		activeWork: null,
		notice: "09:00 · 오늘의 영업을 시작합니다",
		upgrades,
		stageId: stage.id,
		rewardMultiplier: stage.rewardMultiplier,
		seed
	};
};
const orderBaseScore = (itemId) => {
	const menu = menuCatalog.find(({ id }) => id === itemId);
	return 80 + menu.recipe.split(/\+|→/).length * 30 + menu.stage * 15;
};
const calculateOrderScore = (state, combo, fever) => {
	const elapsed = Math.max(0, state.orderStartedAt - state.time);
	const satisfaction = Math.max(40, 100 - elapsed * 2);
	const speedBonus = elapsed <= 12 ? .4 : elapsed <= 25 ? .2 : 0;
	const comboMultiplier = Math.min(2, 1 + Math.max(0, combo - 1) * .1);
	const feverMultiplier = fever ? 1.2 : 1;
	return {
		points: Math.round(orderBaseScore(state.order.itemId) * (1 + speedBonus + satisfaction / 100 * .3) * comboMultiplier * feverMultiplier),
		satisfaction
	};
};
const calculateShiftScore = (state) => {
	const attempts = state.orderSequence + state.mistakes;
	const accuracy = attempts ? state.orderSequence / attempts : 0;
	const averageSatisfaction = state.orderSequence ? Math.round(state.satisfactionTotal / state.orderSequence) : 0;
	const accuracyBonus = state.orderSequence && state.mistakes === 0 ? 1e3 : Math.round(accuracy * 500);
	const comboBonus = state.maxCombo >= 10 ? 500 : 0;
	const satisfactionBonus = averageSatisfaction >= 90 ? 500 : 0;
	const closingBonus = state.time === 0 ? 300 : 0;
	return {
		orderPoints: state.score,
		accuracyBonus,
		comboBonus,
		satisfactionBonus,
		closingBonus,
		total: state.score + accuracyBonus + comboBonus + satisfactionBonus + closingBonus,
		accuracy: Math.round(accuracy * 100),
		averageSatisfaction
	};
};
const tick = (state) => {
	let completedWork = false;
	const stations = Object.fromEntries(stationIds.map((id) => {
		const runtime = state.stations[id];
		if (runtime.phase !== "processing") return [id, runtime];
		const remaining = Math.max(0, runtime.remaining - 1);
		if (remaining > 0) return [id, {
			...runtime,
			remaining
		}];
		completedWork = true;
		return [id, {
			...runtime,
			phase: "ready",
			remaining: 0
		}];
	}));
	const activeWork = state.activeWork && stations[state.activeWork].phase === "processing" ? state.activeWork : stationIds.find((id) => stations[id].phase === "processing") ?? null;
	return {
		...state,
		time: Math.max(0, state.time - 1),
		fever: Math.max(0, state.fever - 1),
		stations,
		activeWork,
		notice: completedWork ? "작업 완료 · 설비에서 결과물을 회수하세요" : state.notice
	};
};
const interactStation = (state, station, selectedUid) => {
	const runtime = state.stations[station];
	if (runtime.phase === "processing") return {
		...state,
		notice: `작업 중 · ${runtime.remaining}초 남음`
	};
	if (runtime.phase === "ready" && runtime.output) {
		if (state.inventory.length >= inventoryLimit) return {
			...state,
			notice: "작업대가 가득 차서 회수할 수 없습니다"
		};
		return {
			...setStation({
				...state,
				inventory: add(state, runtime.output),
				activeWork: null
			}, station, idle()),
			notice: "결과물을 회수했습니다"
		};
	}
	if (station === "serve") return selectedUid ? serve(state, selectedUid) : {
		...state,
		notice: "완성된 음료를 선택하세요"
	};
	const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
	const process = stationProcesses.find(({ station: processStation, input }) => processStation === station && (!input || input === selected?.itemId));
	if (process?.instant) return state.inventory.length >= inventoryLimit ? {
		...state,
		notice: "작업대가 가득 찼습니다"
	} : {
		...state,
		inventory: add(state, process.output),
		notice: "컵을 꺼냈습니다"
	};
	if (process && !process.input) return begin(state, station, process.output, process.seconds);
	if (process?.input && selected && process.input === selected.itemId) {
		let remainingInventory = without(state.inventory, selected.uid);
		const missing = [];
		for (const requiredItem of process.additionalInputs ?? []) {
			const ingredient = remainingInventory.find(({ itemId }) => itemId === requiredItem);
			if (!ingredient) {
				missing.push(requiredItem);
				continue;
			}
			remainingInventory = without(remainingInventory, ingredient.uid);
		}
		if (missing.length) return {
			...state,
			notice: `블렌더 재료 부족 · ${missing.map((itemId) => labels[itemId]).join(" + ")} 필요`
		};
		return begin(state, station, process.output, process.seconds, remainingInventory);
	}
	if (station === "blender") return {
		...state,
		notice: "맛 베이스를 선택하세요 · 모카/바닐라/말차/초콜릿 베이스 + 우유 + 얼음 필요"
	};
	return {
		...state,
		notice: "선택한 재료에는 사용할 수 없는 설비입니다"
	};
};
const takeFridgeIngredient = (state, itemId) => state.inventory.length >= inventoryLimit ? {
	...state,
	notice: "작업대가 가득 찼습니다"
} : {
	...state,
	inventory: add(state, itemId),
	notice: "냉장고에서 재료를 꺼냈습니다"
};
const recipeOutputReaches = (output, target, recipeBook, visited = /* @__PURE__ */ new Set()) => {
	if (output === target) return true;
	if (visited.has(output)) return false;
	const nextVisited = new Set(visited).add(output);
	return recipeBook.some((recipe) => recipe.inputs.includes(output) && recipeOutputReaches(recipe.output, target, recipeBook, nextVisited));
};
const preferCurrentOrderPath = (candidates, target, recipeBook) => candidates.find(({ output }) => recipeOutputReaches(output, target, recipeBook)) ?? candidates[0];
const combineSelected = (state, selectedUid, recipeBook = recipes) => {
	const selected = state.inventory.find(({ uid: itemUid }) => itemUid === selectedUid);
	if (!selected) return {
		...state,
		notice: "먼저 조합할 재료를 선택하세요"
	};
	const candidates = recipeBook.filter(({ inputs }) => inputs.includes(selected.itemId) && state.inventory.some(({ uid: otherUid, itemId }) => otherUid !== selected.uid && inputs.includes(itemId)));
	const recipe = preferCurrentOrderPath(candidates, state.order.itemId, recipeBook);
	if (!recipe) return {
		...state,
		notice: "선택한 재료와 조합 가능한 재료가 없습니다"
	};
	const partnerItemId = recipe.inputs[0] === selected.itemId ? recipe.inputs[1] : recipe.inputs[0];
	const partner = state.inventory.find(({ uid: otherUid, itemId }) => otherUid !== selected.uid && itemId === partnerItemId);
	if (!partner) return state;
	const inventory = without(without(state.inventory, selected.uid), partner.uid);
	return {
		...state,
		inventory: [...inventory, {
			uid: uid(),
			itemId: recipe.output
		}],
		notice: "음료 조합 성공"
	};
};
const autoCombine = (state, recipeBook = recipes) => {
	const serveReadyOrder = (current) => {
		if (!current.upgrades.autoServe) return current;
		const completed = current.inventory.find(({ itemId }) => itemId === current.order.itemId);
		return completed ? serve(current, completed.uid) : current;
	};
	if (!state.upgrades.automation) return serveReadyOrder(state);
	const candidates = recipeBook.filter(({ inputs }) => inputs.every((input, index) => state.inventory.some(({ itemId }, itemIndex) => itemId === input && (inputs[0] !== inputs[1] || itemIndex >= index))));
	const recipe = preferCurrentOrderPath(candidates, state.order.itemId, recipeBook);
	if (!recipe) return serveReadyOrder(state);
	const first = state.inventory.find(({ itemId }) => itemId === recipe.inputs[0]);
	const second = state.inventory.find(({ uid: itemUid, itemId }) => itemUid !== first?.uid && itemId === recipe.inputs[1]);
	if (!first || !second) return state;
	const inventory = [...without(without(state.inventory, first.uid), second.uid), {
		uid: uid(),
		itemId: recipe.output
	}];
	return autoCombine({
		...state,
		inventory,
		notice: `자동 조합 · ${recipe.output}`
	}, recipeBook);
};
const serve = (state, uidToServe) => {
	const item = state.inventory.find(({ uid: itemUid }) => itemUid === uidToServe);
	if (!item || item.itemId !== state.order.itemId) return {
		...state,
		score: Math.max(0, state.score - 100),
		mistakes: state.mistakes + 1,
		combo: state.upgrades.comboGuard >= 2 ? state.combo : Math.max(0, state.combo - state.upgrades.comboGuard || 0),
		notice: state.upgrades.comboGuard ? "서비스 회복으로 콤보를 보호했습니다" : "주문과 다른 음료입니다"
	};
	const combo = state.combo + 1;
	const fever = combo >= Math.max(3, 5 - Math.floor(state.upgrades.feverCharge / 2)) && !state.fever ? 15 + state.upgrades.feverDuration * 3 : state.fever;
	const multiplier = fever ? 3 + state.upgrades.feverProfit * .35 : 1;
	const next = state.orderSequence + 1;
	const reward = Math.round(state.order.reward * multiplier * state.rewardMultiplier * (1 + state.upgrades.tips * .06));
	const remainingOrders = state.orders.slice(1);
	const previous = remainingOrders.at(-1)?.itemId ?? state.order.itemId;
	const nextOrder = makeOrder(next + remainingOrders.length, state.stageId, state.seed, previous);
	const orders = [...remainingOrders, nextOrder];
	const earnedScore = calculateOrderScore(state, combo, fever);
	return {
		...state,
		inventory: without(state.inventory, item.uid),
		gold: state.gold + reward,
		score: state.score + earnedScore.points,
		combo,
		maxCombo: Math.max(state.maxCombo, combo),
		satisfactionTotal: state.satisfactionTotal + earnedScore.satisfaction,
		orderStartedAt: state.time,
		fever,
		orderSequence: next,
		order: orders[0],
		orders,
		notice: fever > state.fever ? "FEVER MODE · 속도 상승 · 이동 작업" : `+${reward}G`
	};
};
const applyShiftAction = (state, action, recipeBook = recipes) => {
	if (state.time <= 0) throw new Error("SHIFT_CLOSED");
	const selected = state.inventory[action.slot]?.uid ?? null;
	let next = state;
	switch (action.kind) {
		case "station": {
			if (!Object.hasOwn(stationUnlockStage, action.target ?? "")) throw new Error("INVALID_STATION");
			const station = action.target;
			if (stationUnlockStage[station] > state.stageId || station === "fridge" || station === "water") throw new Error("STATION_LOCKED");
			next = interactStation(state, station, selected);
			break;
		}
		case "combine":
			next = combineSelected(state, selected, recipeBook);
			break;
		case "discard": return selected ? {
			...state,
			inventory: state.inventory.filter(({ uid }) => uid !== selected),
			score: Math.max(0, state.score - 20),
			discardedItems: state.discardedItems + 1,
			notice: "재료를 버렸습니다"
		} : state;
		case "fridge":
			if (!fridgeIngredients.some(({ itemId, minStage }) => itemId === action.target && minStage <= state.stageId)) throw new Error("INGREDIENT_LOCKED");
			next = takeFridgeIngredient(state, action.target);
			break;
		case "water":
			if (action.target !== "hot_water" && action.target !== "cold_water") throw new Error("INVALID_WATER");
			next = takeFridgeIngredient(state, action.target);
			break;
		default: throw new Error("INVALID_ACTION");
	}
	return autoCombine(next, recipeBook);
};
const verifyShift = (session, receipt, wallSeconds) => {
	if (receipt.version !== 1 || receipt.sessionId !== session.id) throw new Error("INVALID_SESSION");
	if (!Number.isInteger(receipt.elapsed) || receipt.elapsed < 0 || receipt.elapsed > 360 || receipt.elapsed > wallSeconds + 2) throw new Error("INVALID_DURATION");
	if (!Array.isArray(receipt.actions) || receipt.actions.length > 12e3) throw new Error("INVALID_ACTIONS");
	if (!Array.isArray(receipt.seenMenuStages) || receipt.seenMenuStages.length > 15 || receipt.seenMenuStages.some((stage) => !Number.isInteger(stage) || stage < 1 || stage > session.stageId)) throw new Error("INVALID_MENU_STAGES");
	let state = createShift(session.upgrades, session.stageId, session.seed);
	let elapsed = 0;
	const discoveries = /* @__PURE__ */ new Set();
	for (const action of receipt.actions) {
		if (!action || !Number.isInteger(action.at) || action.at < elapsed || action.at > receipt.elapsed || !Number.isInteger(action.slot) || action.slot < -1 || action.slot > 8) throw new Error("INVALID_ACTION");
		while (elapsed < action.at) {
			state = tick(state);
			elapsed++;
		}
		state = applyShiftAction(state, action);
		state.inventory.forEach(({ itemId }) => {
			if (Object.hasOwn(labels, itemId)) discoveries.add(itemId);
		});
	}
	while (elapsed < receipt.elapsed) {
		state = tick(state);
		elapsed++;
	}
	return {
		state,
		score: calculateShiftScore(state),
		discoveries: [...discoveries]
	};
};
//#endregion
export { defaultUpgrades, verifyShift };

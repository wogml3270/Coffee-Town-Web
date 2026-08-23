# Coffee Town 수동 에셋 가이드

모든 런타임 이미지 에셋은 이 디렉터리 아래에 둔다. 파일명은 영문 소문자 `kebab-case`만 사용하고 공백, 한글, 괄호를 사용하지 않는다.

## 공통 규격

- 캐릭터·기계·아이템·이펙트: 투명 배경 PNG
- 배경: WebP 권장, PNG도 허용
- 색상: sRGB
- 캐릭터 프레임: 모든 방향과 동작에서 동일한 프레임 크기와 발 위치 유지
- Sprite sheet: 프레임을 왼쪽에서 오른쪽으로 한 줄에 배치
- 파일명 변경이 필요하면 코드보다 먼저 `asset-requirements.json`을 수정한다.

## 1. 첫 플레이어 캐릭터

기본 캐릭터는 여성 바리스타다. 다음 위치에 넣는다.

```text
public/assets/game/characters/barista-female/
├── portrait.png
├── idle-down.png
├── idle-up.png
├── idle-left.png
├── idle-right.png
├── walk-down.png
├── walk-up.png
├── walk-left.png
├── walk-right.png
├── pick.png
├── place.png
└── repair.png
```

- `portrait.png`: 로비용 전신 또는 반신 이미지, 권장 1024×1024
- `idle-*.png`: 방향별 1프레임, 권장 프레임 512×512
- `walk-*.png`: 방향별 4프레임 가로 Sprite sheet, 권장 2048×512
- `pick.png`, `place.png`, `repair.png`: 4프레임 가로 Sprite sheet, 권장 2048×512
- 캐릭터의 발 중심은 각 프레임 아래쪽 중앙의 같은 좌표에 맞춘다.

남성 캐릭터는 같은 파일명을 아래 폴더에 넣는다. 첫 Vertical Slice에서는 선택 사항이다.

```text
public/assets/game/characters/barista-male/
```

## 2. 카페 배경

```text
public/assets/game/backgrounds/
├── cafe-floor.webp
├── cafe-foreground.webp
└── cafe-collision.png
```

- `cafe-floor.webp`: 플레이어 뒤에 그려지는 전체 배경, 권장 1920×1080
- `cafe-foreground.webp`: 플레이어 앞을 가려야 하는 카운터·장식 레이어, 배경과 동일 크기
- `cafe-collision.png`: 이동 가능 영역 마스크. 흰색은 이동 가능, 검은색은 이동 불가
- 세 파일은 같은 캔버스 크기와 좌표를 사용한다.

## 3. 기계와 카운터

```text
public/assets/game/machines/
├── ingredient-counter/
│   ├── idle.png
│   └── highlighted.png
├── grinder/
│   ├── idle.png
│   ├── working.png
│   ├── ready.png
│   └── overheated.png
├── espresso-machine/
│   ├── idle.png
│   ├── working.png
│   ├── ready.png
│   └── overheated.png
├── water-dispenser/
│   ├── idle.png
│   ├── working.png
│   └── ready.png
└── serving-counter/
    ├── idle.png
    └── highlighted.png
```

- 상태별 이미지는 같은 크기와 중심점을 유지한다.
- 개별 기계 권장 크기는 512×512 PNG다.
- `working.png`을 애니메이션으로 만들 경우 4프레임 가로 Sprite sheet로 제작한다.

## 4. 첫 레시피 아이템

```text
public/assets/game/items/
├── coffee-beans.png
├── ground-coffee.png
├── espresso-shot.png
├── hot-water.png
├── empty-cup.png
└── americano-hot.png
```

- 모두 투명 배경 정사각형 PNG
- 권장 크기 256×256
- 오브젝트 주변 여백과 시점, 광원 방향을 통일한다.

## 5. 이펙트

```text
public/assets/game/effects/
├── interaction-ring.png
├── progress-ring.png
├── success.png
├── mistake.png
├── spill.png
└── repair-hit.png
```

- 첫 Vertical Slice 필수는 `interaction-ring.png`, `progress-ring.png`, `success.png`, `mistake.png`다.
- `spill.png`, `repair-hit.png`은 오염·과열 기믹 단계에서 사용한다.

## 넣은 뒤 확인

```bash
npm run verify:assets
```

필수 파일이 모두 있으면 성공한다. 이미지 내용이나 애니메이션 정렬은 이후 게임 화면에서 시각 검수한다.

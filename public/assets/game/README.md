# Runtime game assets

- `characters/`: 캐릭터 방향·동작 sprite
- `backgrounds/`: 카페 배경과 foreground overlay
- `machines/`: 기계 상태별 이미지
- `items/`: 재료와 완성 음료
- `effects/`: 선택, 진행, 성공, 실패 효과
- `generated/`: AetherAI 생성 원본과 generation metadata

생성 원본은 바로 게임에 사용하지 않는다. 검수 후 crop, background removal, atlas packing을 거쳐 runtime sprite로 승격한다.

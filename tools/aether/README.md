# Aether asset pipeline

이 도구는 AetherAI를 게임 런타임에서 호출하지 않고 제작 단계에서만 사용한다. 생성 결과는 `public/assets/game/generated` 아래에 저장되어 정적 웹 에셋으로 배포된다.

## 1. 생성 계획 확인

```bash
npm run assets:aether:plan
```

이 명령은 reference 파일과 manifest를 검증하지만 API를 호출하거나 크레딧을 사용하지 않는다.

## 2. 키 연결

```bash
cp tools/aether/aether.env.example tools/aether/aether.env.local
```

`aether.env.local`에 `AETHER_AI_API_KEY`를 입력한다. 이 파일은 Git에서 제외된다. 키를 `VITE_*` 변수로 만들면 브라우저 번들에 노출되므로 금지한다.

## 3. 한 에셋 생성

```bash
npm run assets:aether:generate -- --asset barista-female-turnaround
```

전체 manifest를 생성하려면 `--asset`을 생략한다. 생성 요청은 비동기 job을 polling하고 성공한 이미지를 자동으로 내려받는다.

## Reference 원본

- `barista-female-reference.jpg`: 사용자가 제공한 여성 바리스타 원본
- `barista-male-reference.jpg`: 사용자가 제공한 남성 바리스타 원본

원본은 JPEG 데이터였지만 처음 전달될 때 `.png` 확장자를 사용하고 있어, 저장소에서는 실제 형식에 맞춰 `.jpg`로 정리했다.

# 서울아동청소년센터 홈페이지

서울아동청소년센터 홈페이지 리뉴얼 시안. **빌드 과정이 없는 순수 정적 사이트**로,
Design Canvas 런타임(`support.js`)이 브라우저에서 React를 CDN으로 불러와
각 HTML 안의 `<x-dc>` 템플릿을 렌더링합니다.

## 구조

```
.
├── index.html       # 메인 홈페이지  →  /
├── admin.html       # 관리자 화면    →  /admin
├── support.js       # Design Canvas 런타임 (React를 CDN에서 로드)
├── image-slot.js    # 이미지 슬롯 컴포넌트
└── vercel.json      # Vercel 정적 배포 설정 (cleanUrls 등)
```

> `index.html` / `admin.html`은 Design Canvas 편집기에서 내보낸 `.dc.html`
> 시안을 배포용으로 이름만 바꾼 파일입니다. 내용(`<x-dc>` 템플릿)은 동일하며,
> 편집기에서 다시 열어 수정할 수 있습니다.

## 로컬 미리보기

정적 파일이므로 아무 정적 서버로나 열 수 있습니다 (React·폰트는 CDN에서 로드되므로
인터넷 연결 필요).

```bash
npx serve .
# 또는
python3 -m http.server 3000
```

브라우저에서 `http://localhost:3000` (메인), `http://localhost:3000/admin.html` (관리자).

## Vercel 배포

프레임워크 없는 정적 사이트입니다. 빌드 명령·출력 디렉터리 설정이 필요 없습니다.

```bash
npm i -g vercel   # 최초 1회
vercel            # 프리뷰 배포
vercel --prod     # 프로덕션 배포
```

또는 이 저장소를 Vercel 대시보드에 연결하면 push 시 자동 배포됩니다
(Framework Preset: **Other**, Build Command·Output Directory 비워둠).

### 라우팅

`vercel.json`의 `cleanUrls: true` 설정으로 `.html` 확장자가 생략됩니다.

| 경로       | 파일          |
| ---------- | ------------- |
| `/`        | `index.html`  |
| `/admin`   | `admin.html`  |

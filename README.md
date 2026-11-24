# 서울아동청소년센터 홈페이지

서울아동청소년센터 홈페이지. 프론트엔드는 **빌드 과정이 없는 순수 정적 사이트**로,
Design Canvas 런타임(`support.js`)이 브라우저에서 React를 CDN으로 불러와 각 HTML 안의
`<x-dc>` 템플릿을 렌더링합니다. 여기에 **Vercel Serverless Functions(`/api`) 백엔드**를 더해
관리자가 공지·자료·이미지·팝업을 직접 관리하고, 데이터는 **Neon(Postgres)** 과
**Vercel Blob**(파일·이미지)에 저장됩니다.

## 구조

```
.
├── index.html       # 메인 홈페이지  →  /   (API에서 공지·자료·팝업을 불러와 렌더)
├── admin.html       # 관리자 화면    →  /admin  (로그인 후 CRUD)
├── menu.js          # 전체 메뉴 트리(6대 메뉴 + 하위) — 네비·LNB·라우팅의 단일 출처
├── support.js       # Design Canvas 런타임 (React를 CDN에서 로드)
├── image-slot.js    # 이미지 슬롯 컴포넌트 (배포 시 /api/image-slots 를 읽음)
├── api/             # 서버리스 함수 (Neon + Blob)
│   ├── _lib.js          # 공용: Neon 클라이언트, 세션 쿠키(HMAC), 인증 가드
│   ├── login.js / logout.js / me.js   # 관리자 인증
│   ├── posts.js         # 공지·행사·보도자료 CRUD
│   ├── files.js         # 자료실 메타 + Blob 삭제
│   ├── banners.js       # 팝업·띠배너 CRUD
│   ├── image-slots.js   # 이미지 슬롯 상태 (image-slot.js가 읽는 맵)
│   └── upload.js        # 파일→Blob 업로드 (base64 경유, auth)
├── schema.sql       # Neon 테이블 정의 (1회 실행)
├── package.json     # 서버리스 함수 의존성 (프론트는 빌드 없음)
├── vercel.json      # cleanUrls + image-slots rewrite
└── serve.json       # 로컬 정적 미리보기용 (API 없이 프론트만)
```

## 관리자 기능 (동적 콘텐츠)

`/admin` 로그인(서버 비밀번호 + 서명 쿠키) 후:

- **공지·게시판** — 공지사항/행사안내/보도자료 글 작성·수정·삭제 → `index.html` 소식 영역에 반영
- **자료실** — PDF/ZIP 등 파일 업로드(~3MB, Blob 저장)·삭제
- **이미지 관리** — 홈페이지 각 이미지 영역(히어로·치료실·프로그램 등) 교체
- **팝업·배너** — 메인 팝업/띠배너 문구·기간·활성화 관리

### 환경변수

`cp .env.local.example .env.local` 후 값 채우기 (배포 시 Vercel 대시보드에도 동일 등록):

| 변수 | 용도 |
| --- | --- |
| `DATABASE_URL` | Neon Postgres 연결 문자열 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 토큰 |
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 |
| `SESSION_SECRET` | 세션 쿠키 서명 키 (`openssl rand -hex 32`) |

### DB 초기화 (1회)

```bash
psql "$DATABASE_URL" -f schema.sql   # 또는 Neon 콘솔 SQL Editor에 붙여넣기
```

> `index.html` / `admin.html`은 Design Canvas 편집기에서 내보낸 `.dc.html`
> 시안을 배포용으로 이름만 바꾼 파일입니다. 내용(`<x-dc>` 템플릿)은 동일하며,
> 편집기에서 다시 열어 수정할 수 있습니다.

## 로컬 개발

API(서버리스 함수)까지 로컬에서 구동합니다. **`npm run dev`** 는 로그인 없이 바로 뜨는
로컬 서버(`devserver.mjs`)로, 정적 파일 + `/api/*` + `vercel.json` rewrite 를 흉내 냅니다.

```bash
npm install          # 최초 1회 (서버리스 함수 의존성)
cp .env.local.example .env.local   # 값 채우기 (아래 환경변수 표 참고)
npm run dev          # http://localhost:3000  (로그인 불필요)
```

브라우저에서 `http://localhost:3000` (메인), `http://localhost:3000/admin` (관리자).

프로덕션 런타임과 동일하게 확인하려면 Vercel CLI(로그인 필요)를 씁니다:

```bash
npm run dev:vercel   # = vercel dev  (최초 vercel login 필요)
```

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

서브페이지는 **2단 경로**(`/<대메뉴>/<하위메뉴>`)로, `index.html` 한 파일이 SPA로 처리합니다.
경로·메뉴 구성은 모두 `menu.js` 에서 나오므로 메뉴를 바꿀 때 라우팅 코드를 고칠 필요가 없습니다.

| 대메뉴 | 경로 | 예시 |
| --- | --- | --- |
| 센터소개 | `/about/*` | `/about/greeting`, `/about/facility` |
| 심리평가 | `/assessment/*` | `/assessment/comprehensive` |
| 상담 및 프로그램 | `/therapy/*` | `/therapy/play` |
| 집중 프로그램 | `/intensive` | (하위 없음) |
| 외부기관 교육·집단상담 | `/outreach` | (하위 없음) |
| 상담 안내 및 센터 소식 | `/guide/*` | `/guide/apply`, `/guide/archive` |

개편 전 1단 경로(`/business`, `/rooms`, `/programs`, `/archive`, `/news`, `/apply`)로 들어오면
`menu.js` 의 `legacy` 표에 따라 새 경로로 자동 교체(replaceState)됩니다.

> 새 대메뉴를 추가할 때는 `menu.js` 와 함께 `vercel.json` 의 rewrite,
> `devserver.mjs` 의 `SPA_SECTIONS` 에도 같은 key 를 넣어야 새로고침(직접 진입)이 동작합니다.

> 인라인 스타일을 미디어쿼리로 덮어쓸 때 주의: React 가 style 속성을
> `min-width: 1200px` 처럼 **콜론 뒤 공백**으로 다시 써내므로 속성 선택자도 그 형태로 적어야 합니다.

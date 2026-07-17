// 로컬 개발 서버 — vercel dev(로그인 필요) 없이 정적 파일 + /api/* 함수를 구동.
// `npm run dev` 로 실행.  .env.local 로드 → http 서버 → Vercel 스타일
// (req.query/req.body, res) 어댑터.  배포는 Vercel(vercel.json)이 담당하며 이 파일은
// 로컬 전용이라 배포에 영향 없음.  vercel.json 의 rewrite/cleanUrls 를 흉내 낸다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// .env.local 로드
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] = v;
}
process.env.NODE_ENV = 'development';

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

// 핸들러 캐시 (매 요청 새로 import → 코드 수정 즉시 반영)
async function loadHandler(name) {
  const url = pathToFileURL(path.join(root, 'api', name + '.js')).href + '?t=' + Date.now();
  return (await import(url)).default;
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (!chunks.length) return resolve(undefined);
      const raw = Buffer.concat(chunks).toString('utf8');
      const ct = req.headers['content-type'] || '';
      if (ct.includes('application/json')) { try { return resolve(JSON.parse(raw)); } catch { return resolve({}); } }
      resolve(raw);
    });
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let pathname = u.pathname;

  // rewrite: image-slot.js가 읽는 상태 파일 → API
  if (pathname === '/.image-slots.state.json') pathname = '/api/image-slots';

  // API 라우팅
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5);
    try {
      const handler = await loadHandler(name);
      req.query = Object.fromEntries(u.searchParams.entries());
      req.body = await readBody(req);
      return handler(req, res);
    } catch (e) {
      res.statusCode = 500; res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ error: 'dev server: ' + e.message }));
    }
  }

  // SPA 라우팅: 서브페이지 경로는 index.html 서빙 (vercel.json rewrite 와 동일)
  const SPA_ROUTES = ['about', 'business', 'rooms', 'programs', 'archive', 'news', 'apply'];
  if (SPA_ROUTES.includes(pathname.slice(1))) pathname = '/';

  // 정적 파일 (cleanUrls: /admin → admin.html)
  let file = pathname === '/' ? 'index.html' : pathname.slice(1);
  let full = path.join(root, file);
  if (!fs.existsSync(full) && fs.existsSync(full + '.html')) full += '.html';
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.statusCode = 404; return res.end('Not Found');
  }
  res.setHeader('content-type', MIME[path.extname(full)] || 'application/octet-stream');
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, () => console.log(`▶ 로컬 검증 서버: http://localhost:${PORT}  (메인 /, 관리자 /admin)`));

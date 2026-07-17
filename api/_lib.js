// 공용 유틸 — Neon 클라이언트, 세션 쿠키(HMAC 서명), 인증 가드, 응답 헬퍼.
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

// ── Neon ────────────────────────────────────────────────────────────────
// 태그드 템플릿으로 안전하게 파라미터 바인딩: sql`select ... where id=${id}`
// 지연 초기화 — DATABASE_URL 미설정이어도 DB를 안 쓰는 엔드포인트(login/me/logout)는
// 정상 동작하도록 실제 쿼리 시점에 클라이언트를 만든다.
let _sql = null;
export function sql(strings, ...values) {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql(strings, ...values);
}

// ── JSON 응답 ─────────────────────────────────────────────────────────────
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  // 공개 GET 캐시 방지 — 관리자 편집이 즉시 반영되도록
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

// ── 요청 본문 파싱 ─────────────────────────────────────────────────────────
// Vercel Node 런타임은 application/json 본문을 req.body로 파싱해 준다.
// 그 외(로컬/edge 등) 대비 스트림 폴백 포함.
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return {}; }
}

// ── 세션 쿠키 (HMAC 서명) ──────────────────────────────────────────────────
const COOKIE = 'scyc_session';
const MAX_AGE = 60 * 60 * 12; // 12시간

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET 미설정');
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// payload(만료 타임스탬프)를 서명해 "<exp>.<hmac>" 형태로 반환
export function makeSessionValue() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const mac = crypto.createHmac('sha256', secret()).update(exp).digest();
  return `${exp}.${b64url(mac)}`;
}

function verifySessionValue(value) {
  if (!value || typeof value !== 'string') return false;
  const dot = value.indexOf('.');
  if (dot < 0) return false;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = b64url(crypto.createHmac('sha256', secret()).update(exp).digest());
  // 타이밍 세이프 비교
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  return true;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setSessionCookie(res, value, maxAge = MAX_AGE) {
  const secure = process.env.NODE_ENV !== 'development';
  const attrs = [
    `${COOKIE}=${encodeURIComponent(value)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  if (secure) attrs.push('Secure');
  res.setHeader('set-cookie', attrs.join('; '));
}

export function clearSessionCookie(res) {
  setSessionCookie(res, '', 0);
}

export function isAuthed(req) {
  const c = parseCookies(req);
  return verifySessionValue(c[COOKIE]);
}

// 인증 실패 시 401 응답을 보내고 false 반환. 핸들러에서 `if (!requireAuth(req,res)) return;`
export function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  json(res, 401, { error: '인증이 필요합니다.' });
  return false;
}

// ── 메서드 가드 ─────────────────────────────────────────────────────────────
export function methodNotAllowed(res, allowed) {
  res.setHeader('allow', allowed.join(', '));
  json(res, 405, { error: 'Method Not Allowed' });
}

// POST /api/login  { password } → 성공 시 서명 세션 쿠키 발급
import { readBody, json, makeSessionValue, setSessionCookie, methodNotAllowed } from './_lib.js';
import crypto from 'node:crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return json(res, 500, { error: 'ADMIN_PASSWORD 미설정' });

  const { password } = await readBody(req);
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return json(res, 401, { error: '비밀번호가 올바르지 않습니다.' });

  setSessionCookie(res, makeSessionValue());
  return json(res, 200, { ok: true });
}

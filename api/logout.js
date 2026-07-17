// POST /api/logout → 세션 쿠키 만료
import { json, clearSessionCookie, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  clearSessionCookie(res);
  return json(res, 200, { ok: true });
}

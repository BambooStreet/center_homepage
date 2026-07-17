// GET /api/me → 현재 세션 인증 여부 { authed: boolean }
import { json, isAuthed, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  return json(res, 200, { authed: isAuthed(req) });
}

// /api/banners — 팝업·띠배너
//   GET    ?enabled=1            공개(활성만) / auth면 전체
//   POST   {kind,title,badge,body_text,period,preview_bg,enabled}  auth
//   PATCH  ?id=  {enabled,...}   auth (토글·편집)
//   DELETE ?id=                  auth
import { sql, json, readBody, requireAuth, isAuthed, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  const { method } = req;
  const id = req.query?.id;

  if (method === 'GET') {
    const onlyEnabled = req.query?.enabled === '1' || !isAuthed(req);
    const rows = onlyEnabled
      ? await sql`select * from banners where enabled=true order by created_at desc`
      : await sql`select * from banners order by created_at desc`;
    return json(res, 200, rows);
  }

  if (method === 'POST') {
    if (!requireAuth(req, res)) return;
    const {
      kind, title = null, badge = null, body_text = null,
      period = null, preview_bg = null, enabled = false,
    } = await readBody(req);
    if (!kind) return json(res, 400, { error: 'kind 필수' });
    const [row] = await sql`
      insert into banners (kind, title, badge, body_text, period, preview_bg, enabled)
      values (${kind}, ${title}, ${badge}, ${body_text}, ${period}, ${preview_bg}, ${enabled})
      returning *`;
    return json(res, 201, row);
  }

  if (method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    const b = await readBody(req);
    const [row] = await sql`
      update banners set
        kind       = coalesce(${b.kind ?? null}, kind),
        title      = coalesce(${b.title ?? null}, title),
        badge      = coalesce(${b.badge ?? null}, badge),
        body_text  = coalesce(${b.body_text ?? null}, body_text),
        period     = coalesce(${b.period ?? null}, period),
        preview_bg = coalesce(${b.preview_bg ?? null}, preview_bg),
        enabled    = coalesce(${b.enabled ?? null}, enabled)
      where id=${id}
      returning *`;
    if (!row) return json(res, 404, { error: '없는 배너' });
    return json(res, 200, row);
  }

  if (method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    await sql`delete from banners where id=${id}`;
    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
}

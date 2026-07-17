// /api/image-slots — 이미지 슬롯 (image-slot.js가 읽는 상태 맵)
//   GET             공개. { "<slotId>": {u, s, x, y}, ... } 형태로 반환
//                   (기존 .image-slots.state.json 과 동일 shape; vercel.json rewrite로 연결)
//   POST  {slot_id,url,s,x,y}   auth. 슬롯 이미지 등록/교체 (url = Blob URL)
//   DELETE ?slotId= or ?slot_id=   auth. 슬롯 비움 + Blob del()
import { del } from '@vercel/blob';
import { sql, json, readBody, requireAuth, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    const rows = await sql`select slot_id, url, s, x, y from image_slots where url is not null`;
    const map = {};
    for (const r of rows) map[r.slot_id] = { u: r.url, s: r.s, x: r.x, y: r.y };
    return json(res, 200, map);
  }

  if (method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { slot_id, url, s = 1, x = 0, y = 0 } = await readBody(req);
    if (!slot_id || !url) return json(res, 400, { error: 'slot_id, url 필수' });
    // 기존 슬롯 이미지가 있으면 교체 전 Blob 정리
    const [prev] = await sql`select url from image_slots where slot_id=${slot_id}`;
    if (prev?.url && prev.url !== url) {
      try { await del(prev.url); } catch (e) {}
    }
    const [row] = await sql`
      insert into image_slots (slot_id, url, s, x, y, updated_at)
      values (${slot_id}, ${url}, ${s}, ${x}, ${y}, now())
      on conflict (slot_id) do update
        set url=excluded.url, s=excluded.s, x=excluded.x, y=excluded.y, updated_at=now()
      returning *`;
    return json(res, 200, row);
  }

  if (method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    const slotId = req.query?.slotId || req.query?.slot_id;
    if (!slotId) return json(res, 400, { error: 'slotId 필수' });
    const [prev] = await sql`select url from image_slots where slot_id=${slotId}`;
    if (prev?.url) { try { await del(prev.url); } catch (e) {} }
    await sql`delete from image_slots where slot_id=${slotId}`;
    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
}

// /api/files — 자료실 파일 (Blob 바이트 + Neon 메타)
//   GET    ?category=센터 자료   공개
//   POST   {category,title,blob_url,file_type,size}   auth, 메타 등록
//          (바이트는 먼저 /api/upload 로 Blob에 올린 뒤 그 URL을 blob_url 로 전달)
//   DELETE ?id=                 auth, Blob del() + row 삭제
import { del } from '@vercel/blob';
import { sql, json, readBody, requireAuth, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  const { method } = req;
  const id = req.query?.id;

  if (method === 'GET') {
    const category = req.query?.category;
    const rows = category
      ? await sql`select * from files where category=${category} order by created_at desc`
      : await sql`select * from files order by created_at desc`;
    return json(res, 200, rows);
  }

  if (method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { category, title, blob_url, file_type = null, size = null } = await readBody(req);
    if (!category || !title || !blob_url) {
      return json(res, 400, { error: 'category, title, blob_url 필수' });
    }
    const [row] = await sql`
      insert into files (category, title, blob_url, file_type, size)
      values (${category}, ${title}, ${blob_url}, ${file_type}, ${size})
      returning *`;
    return json(res, 201, row);
  }

  if (method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    const [row] = await sql`select blob_url from files where id=${id}`;
    if (row?.blob_url) {
      try { await del(row.blob_url); } catch (e) { /* Blob 이미 없어도 진행 */ }
    }
    await sql`delete from files where id=${id}`;
    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
}

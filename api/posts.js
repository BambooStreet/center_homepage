// /api/posts — 공지·행사·보도자료 글
//   GET    ?board=공지사항        공개, 게시중만 (관리자는 ?all=1로 임시저장 포함)
//   POST   {board,title,body,status}   auth, 생성
//   PATCH  ?id=  {title,body,status,board}  auth, 수정
//   DELETE ?id=                    auth, 삭제
import { sql, json, readBody, requireAuth, isAuthed, methodNotAllowed } from './_lib.js';

export default async function handler(req, res) {
  const { method } = req;
  const id = req.query?.id;

  if (method === 'GET') {
    const board = req.query?.board;
    const all = req.query?.all === '1' && isAuthed(req);
    let rows;
    if (board && !all) {
      rows = await sql`select * from posts where board=${board} and status='게시중' order by created_at desc`;
    } else if (board && all) {
      rows = await sql`select * from posts where board=${board} order by created_at desc`;
    } else if (all) {
      rows = await sql`select * from posts order by created_at desc`;
    } else {
      rows = await sql`select * from posts where status='게시중' order by created_at desc`;
    }
    return json(res, 200, rows);
  }

  if (method === 'POST') {
    if (!requireAuth(req, res)) return;
    const { board, title, body = '', status = '게시중' } = await readBody(req);
    if (!board || !title) return json(res, 400, { error: 'board, title 필수' });
    const [row] = await sql`
      insert into posts (board, title, body, status)
      values (${board}, ${title}, ${body}, ${status})
      returning *`;
    return json(res, 201, row);
  }

  if (method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    const { board, title, body, status } = await readBody(req);
    const [row] = await sql`
      update posts set
        board  = coalesce(${board ?? null}, board),
        title  = coalesce(${title ?? null}, title),
        body   = coalesce(${body ?? null}, body),
        status = coalesce(${status ?? null}, status),
        updated_at = now()
      where id=${id}
      returning *`;
    if (!row) return json(res, 404, { error: '없는 글' });
    return json(res, 200, row);
  }

  if (method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    await sql`delete from posts where id=${id}`;
    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
}

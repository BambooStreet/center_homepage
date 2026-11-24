// /api/sns — 블로그·인스타그램·유튜브(숏츠) 연결 링크
//   GET                     공개(활성만) / auth면 전체
//   POST   {platform,kind,title,url,thumb_url,sort,enabled}  auth
//   PATCH  ?id=  {...}      auth (토글·편집)
//   DELETE ?id=             auth
//
// kind: 'account' = 계정 바로가기(푸터 아이콘) / 'post' = 개별 게시물·숏츠(홈 카드)
// 자동 피드(인스타 Graph API 등) 없이 센터가 직접 등록하는 방식.  나중에 자동화를 붙이더라도
// 같은 테이블을 채우면 되도록 스키마를 단순하게 둔다.
import { sql, json, readBody, requireAuth, isAuthed, methodNotAllowed } from './_lib.js';

const PLATFORMS = ['네이버 블로그', '인스타그램', '유튜브'];
const KINDS = ['account', 'post'];

// 외부로 링크되는 값이므로 http(s) 만 허용 (javascript: 등 차단)
function safeUrl(u) {
  if (typeof u !== 'string' || !u.trim()) return null;
  try {
    const parsed = new URL(u.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.toString() : null;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  const { method } = req;
  const id = req.query?.id;

  if (method === 'GET') {
    const all = req.query?.all === '1' && isAuthed(req);
    const rows = all
      ? await sql`select * from sns_links order by kind, sort, created_at desc`
      : await sql`select * from sns_links where enabled=true order by kind, sort, created_at desc`;
    return json(res, 200, rows);
  }

  if (method === 'POST') {
    if (!requireAuth(req, res)) return;
    const b = await readBody(req);
    const platform = PLATFORMS.includes(b.platform) ? b.platform : null;
    const kind = KINDS.includes(b.kind) ? b.kind : 'post';
    const url = safeUrl(b.url);
    const thumb = b.thumb_url ? safeUrl(b.thumb_url) : null;
    if (!platform) return json(res, 400, { error: 'platform 은 네이버 블로그 · 인스타그램 · 유튜브 중 하나여야 합니다.' });
    if (!url) return json(res, 400, { error: 'http(s) 로 시작하는 주소를 넣어주세요.' });
    const [row] = await sql`
      insert into sns_links (platform, kind, title, url, thumb_url, sort, enabled)
      values (${platform}, ${kind}, ${b.title || null}, ${url}, ${thumb},
              ${Number.isFinite(+b.sort) ? +b.sort : 0}, ${b.enabled !== false})
      returning *`;
    return json(res, 201, row);
  }

  if (method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    const b = await readBody(req);
    const url = b.url != null ? safeUrl(b.url) : null;
    if (b.url != null && !url) return json(res, 400, { error: 'http(s) 로 시작하는 주소를 넣어주세요.' });
    const thumb = b.thumb_url != null ? safeUrl(b.thumb_url) : null;
    const [row] = await sql`
      update sns_links set
        platform  = coalesce(${PLATFORMS.includes(b.platform) ? b.platform : null}, platform),
        kind      = coalesce(${KINDS.includes(b.kind) ? b.kind : null}, kind),
        title     = coalesce(${b.title ?? null}, title),
        url       = coalesce(${url}, url),
        thumb_url = coalesce(${thumb}, thumb_url),
        sort      = coalesce(${Number.isFinite(+b.sort) ? +b.sort : null}, sort),
        enabled   = coalesce(${b.enabled ?? null}, enabled)
      where id=${id}
      returning *`;
    if (!row) return json(res, 404, { error: '없는 링크' });
    return json(res, 200, row);
  }

  if (method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    if (!id) return json(res, 400, { error: 'id 필수' });
    await sql`delete from sns_links where id=${id}`;
    return json(res, 200, { ok: true });
  }

  return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'DELETE']);
}

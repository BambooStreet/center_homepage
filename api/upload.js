// POST /api/upload — 서버 경유 Blob 업로드 (auth 필요)
// 정적 사이트(번들러 없음)에서 @vercel/blob/client 를 쓸 수 없어, 파일을 base64로
// JSON 본문에 담아 보내면 서버가 디코드해 Vercel Blob에 저장하고 공개 URL을 돌려준다.
// 주의: Vercel 요청 본문 한계(~4.5MB) 때문에 base64 인코딩 기준 원본 약 3MB까지.
//       (이미지 슬롯은 브라우저에서 webp로 축소되므로 여유가 크다.)
import { put } from '@vercel/blob';
import { readBody, json, isAuthed } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method Not Allowed' });
  }
  if (!isAuthed(req)) return json(res, 401, { error: '인증이 필요합니다.' });

  const { filename = 'file', contentType = 'application/octet-stream', dataBase64 } = await readBody(req);
  if (!dataBase64) return json(res, 400, { error: 'dataBase64 필수' });

  const buf = Buffer.from(dataBase64, 'base64');
  if (!buf.length) return json(res, 400, { error: '빈 파일' });

  try {
    const blob = await put(filename, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    });
    return json(res, 200, { url: blob.url, size: buf.length, contentType });
  } catch (e) {
    return json(res, 500, { error: e?.message || '업로드 실패' });
  }
}

// 관리자 화면(admin.html)이 쓰는 공용 API 클라이언트.  fetch·에러 처리·파일 업로드
// 로직을 한 곳에 모아 인라인 컴포넌트를 얇게 유지한다.  window.scycApi 로 노출.
// 쿠키(세션)는 same-origin 요청에 자동 포함되므로 별도 설정 불필요.
(function () {
  async function req(method, url, body) {
    const opt = { method, headers: {} };
    if (body !== undefined) {
      opt.headers['content-type'] = 'application/json';
      opt.body = JSON.stringify(body);
    }
    const r = await fetch(url, opt);
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((data && data.error) || ('요청 실패 (' + r.status + ')'));
    return data;
  }

  // File → base64 (data URL 의 콤마 뒤 부분)
  function readFileBase64(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => { const s = String(fr.result); resolve(s.slice(s.indexOf(',') + 1)); };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  window.scycApi = {
    req,
    get: (u) => req('GET', u),
    post: (u, b) => req('POST', u, b),
    patch: (u, b) => req('PATCH', u, b),
    del: (u) => req('DELETE', u),
    login: (password) => req('POST', '/api/login', { password }),
    logout: () => req('POST', '/api/logout'),
    me: () => req('GET', '/api/me'),
    readFile: readFileBase64,
    // 파일을 Blob에 업로드하고 { url, size, contentType } 반환
    async upload(file) {
      const dataBase64 = await readFileBase64(file);
      return req('POST', '/api/upload', {
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        dataBase64,
      });
    },
  };
})();

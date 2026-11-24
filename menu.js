// 전체 메뉴 트리 (docs/홈페이지 구성안.pdf 기준).  index.html 이 window.SCYC_MENU 로 읽어
// 헤더 드롭다운 · 서브페이지 좌측메뉴(LNB) · URL 라우팅을 모두 이 한 곳에서 생성한다.
// 메뉴를 바꾸려면 이 파일만 고치면 된다 (라우팅·네비 코드 수정 불필요).
//
//   key    : URL 조각.  /센터소개 인사말 → /about/greeting
//   label  : 화면에 보이는 이름
//   desc   : 서브페이지 헤더의 한 줄 설명
//   ready  : true 면 실제 내용이 붙은 페이지, 없으면 '준비 중' 카드가 뜬다
(function () {
  const sec = (key, label, desc, children) => ({ key, label, desc, children: children || [] });
  const sub = (key, label, ready) => ({ key, label, ready: !!ready });

  const menu = [
    sec('about', '센터소개', '서울아동청소년센터가 걸어온 길과 지향하는 가치를 소개합니다.', [
      sub('greeting', '센터장 인사말', true),
      sub('intro', '센터 소개', true),
      sub('values', '핵심가치', true),
      sub('history', '연혁', true),
      sub('people', '전문가 소개', true),
      sub('facility', '시설 안내', true),
      sub('directions', '오시는 길', true)
    ]),
    sec('assessment', '심리평가', '검사와 면담, 행동 관찰을 통해 아이를 종합적으로 이해합니다.', [
      sub('comprehensive', '종합심리평가', true),
      sub('development', '발달평가', true),
      sub('attention', '주의력 평가', true),
      sub('learning', '학습평가', true),
      sub('play', '놀이평가', true),
      sub('language', '종합언어평가', true),
      sub('career', '진로적성검사', true),
      sub('temperament', '기질평가', true),
      sub('personality', '성격평가', true),
      sub('family', '부모 및 가족평가')
    ]),
    sec('therapy', '상담 및 프로그램', '아이의 특성과 필요에 맞춘 상담·치료 프로그램을 제공합니다.', [
      sub('play', '놀이치료', true),
      sub('cognitive', '인지학습치료', true),
      sub('language', '언어치료', true),
      sub('social', '사회성 그룹치료', true),
      sub('teen', '청소년 상담', true),
      sub('family', '부모 및 가족상담', true),
      sub('youth', '청년 상담', true)
    ]),
    sec('intensive', '집중 프로그램', '특화 영역별로 평가·상담·부모지원을 묶은 통합 프로그램입니다.', []),
    sec('outreach', '외부기관 교육·집단상담', '학교·복지기관 등과 연계한 집단 교육 및 집단 상담입니다.', []),
    sec('guide', '상담 안내 및 센터 소식', '상담 신청 방법과 센터의 새로운 소식을 안내합니다.', [
      sub('apply', '상담 신청', true),
      sub('process', '상담 절차', true),
      sub('faq', '자주 묻는 질문', true),
      sub('notice', '공지사항', true),
      sub('archive', '자료실', true),
      sub('news', '센터 소식', true)
    ])
  ];

  // 개편 이전 1단 경로 → 새 경로.  기존 링크·북마크·검색엔진 색인이 깨지지 않도록 유지.
  const legacy = {
    about: 'about/greeting',
    business: 'about/intro',
    rooms: 'about/facility',
    programs: 'intensive',
    archive: 'guide/archive',
    news: 'guide/news',
    apply: 'guide/apply'
  };

  window.SCYC_MENU = { menu, legacy };
})();

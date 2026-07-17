// 홈페이지 정적 콘텐츠(문구·기본 데이터).  index.html 의 인라인 컴포넌트가
// window.SCYC_CONTENT 로 읽는다.  DB(API)가 응답하면 공지·자료·배너는 이 값 대신
// 실제 데이터로 대체되고, 여기 값은 오프라인/로딩 전 fallback 및 정적 콘텐츠로 쓰인다.
// ※ Design Canvas 런타임 제약상 페이지 템플릿과 컴포넌트 로직 골격은 index.html 인라인에
//    남지만, 문구 데이터는 이렇게 분리해 콘텐츠와 코드를 나눈다.
(function () {
  const tag = { 상담: ['#2168B4', '#EAF3FB'], 치료: ['#2FA490', '#E6F6F3'], 교육: ['#B07A2A', '#FBF1E1'], 예방: ['#7A5FB8', '#F0EBFA'] };
  const P = (t, tagName, form, title, desc, target, schedule, short) => ({
    tag: tagName, tagFg: tag[t][0], tagBg: tag[t][1], form, title, desc, target, schedule, short
  });

  // 라인 아이콘 path (24x24 viewBox, stroke=currentColor). 템플릿에서 <path d="{{ ... }}">.
  const IC = {
    chat: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
    cap: 'M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5',
    link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 11.5l2 2 4-4'
  };
  // DC 런타임은 <svg> 내부 {{ }} 바인딩을 처리하지 않으므로, 아이콘을 색을 구워넣은
  // data:image/svg+xml URI 로 만들어 <img src="{{ icon }}"> 로 렌더한다 (src 바인딩은 동작).
  const svgIcon = (path, color) => 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
    color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>'
  );

  const programs = [
    P('상담', '가족상담', '개별·가족', '이혼 위기 가정 및 이혼 준비 가정을 위한 프로그램', '가정의 변화 속에서 아이가 안정감을 잃지 않도록 아동과 부모를 함께 돕는 심리 지원 프로그램입니다.', '이혼 위기·준비 가정의 아동과 부모', '주 1회 · 상시 접수', '이혼 위기 가정 지원'),
    P('치료', '인지행동치료', '개별', 'ADHD·행동문제를 위한 인지행동치료(CBT)', '주의력과 충동 조절의 어려움, 행동 문제를 과학적 근거에 기반한 인지행동치료로 단계적으로 개선합니다.', '주의력·행동 조절이 어려운 아동·청소년', '주 1~2회 · 12회기', 'ADHD·행동문제 CBT'),
    P('교육', '학습지원', '개별', '학습장애 프로그램', '읽기·쓰기·수학 등 영역별 평가를 바탕으로 아이의 학습 속도에 맞춘 개별 학습치료를 제공합니다.', '학습에 어려움을 겪는 아동', '주 1~2회 · 상시 접수', '학습장애 프로그램'),
    P('치료', '통합치료', '개별+그룹', '경계선 지능 아동을 위한 통합 프로그램', '인지·정서·사회성을 아우르는 통합적 접근으로 아이가 일상과 학교생활에 잘 적응하도록 돕습니다.', '경계선 지능 아동', '주 2회 · 학기제', '경계선 아동 통합 프로그램'),
    P('치료', '사회성훈련', '그룹', '사회적 대화 및 기술 훈련', '반응성 애착장애, 경증 지적장애, 자폐 스펙트럼 청소년이 또래와 소통하는 힘을 기르는 그룹 훈련입니다.', '사회적 상호작용이 어려운 청소년', '주 1회 · 8~12회기', '사회적 대화·기술 훈련'),
    P('상담', '부모교육', '온라인(Zoom)', '부모를 위한 줌 집단상담 프로그램', '비슷한 고민을 가진 부모들이 온라인으로 모여 전문가와 함께 양육의 어려움을 나누고 배웁니다.', '아동·청소년 자녀를 둔 부모', '격주 저녁 · 온라인', '부모 줌 집단상담'),
    P('예방', '예방교육', '그룹', '아동·청소년 중독 예방 프로그램', '스마트폰·게임 등 미디어 과의존을 조기에 발견하고 건강한 사용 습관을 기르는 예방 교육입니다.', '미디어 과의존이 우려되는 아동·청소년', '분기별 운영', '중독 예방 프로그램')
  ];

  const archiveDefault = [
    [
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '2026 서울아동청소년센터 사업안내 브로슈어', date: '2026.07.01', views: 214 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '센터 이용 안내문 (상담 절차 및 비용)', date: '2026.06.18', views: 342 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '프로그램 안내 리플릿', date: '2026.06.10', views: 508 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '2025 연간 운영보고서', date: '2026.03.02', views: 187 },
      { type: 'ZIP', fg: '#7A5FB8', bg: '#F0EBFA', title: '기관 로고 및 CI 파일', date: '2026.01.15', views: 96 }
    ],
    [
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '[부모교육] 사춘기 자녀와 대화하는 법', date: '2026.07.08', views: 623 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '[부모교육] ADHD 아이를 돕는 가정 내 환경 만들기', date: '2026.06.24', views: 771 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '[부모교육] 스마트폰 사용 규칙, 이렇게 정하세요', date: '2026.06.05', views: 850 },
      { type: 'PPT', fg: '#B07A2A', bg: '#FBF1E1', title: '[강의자료] 아이의 불안, 어떻게 알아차릴까', date: '2026.05.20', views: 412 },
      { type: 'PDF', fg: '#C94F44', bg: '#FCEDEB', title: '[부모교육] 형제 갈등 중재 가이드', date: '2026.05.02', views: 366 }
    ]
  ];

  const newsDefault = [
    [
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: true, title: '2026년 하반기 사회성 그룹치료 참가자 모집 안내', date: '2026.07.14' },
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: true, title: '7월 부모교육 특강 「사춘기 자녀와 대화하기」 참가 안내', date: '2026.07.10' },
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: false, title: '여름방학 프로그램 운영 일정 안내', date: '2026.07.03' },
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: false, title: '센터 홈페이지 리뉴얼 오픈 안내', date: '2026.06.27' },
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: false, title: '6월 후원자 소식지 발간', date: '2026.06.20' },
      { cat: '공지', fg: '#2168B4', bg: '#EAF3FB', isNew: false, title: '개인정보처리방침 개정 안내', date: '2026.06.02' }
    ],
    [
      { cat: '행사', fg: '#2FA490', bg: '#E6F6F3', isNew: true, title: '부모교육 특강 · 사춘기 자녀와 대화하기 (7/22 온라인)', date: '2026.07.09' },
      { cat: '행사', fg: '#2FA490', bg: '#E6F6F3', isNew: false, title: '여름방학 사회성 그룹 프로그램 오리엔테이션 (7/27)', date: '2026.07.02' },
      { cat: '행사', fg: '#2FA490', bg: '#E6F6F3', isNew: false, title: '지역아동센터 실무자 협력 간담회 (8/5)', date: '2026.06.30' },
      { cat: '행사', fg: '#2FA490', bg: '#E6F6F3', isNew: false, title: '가족과 함께하는 봄 나들이 활동 후기', date: '2026.05.11' }
    ],
    [
      { cat: '보도', fg: '#B07A2A', bg: '#FBF1E1', isNew: false, title: '[○○신문] "아이 마음 돌보는 동네 울타리" 서울아동청소년센터를 가다', date: '2026.06.12' },
      { cat: '보도', fg: '#B07A2A', bg: '#FBF1E1', isNew: false, title: '[○○방송] 여름방학 아동 심리지원 프로그램 소개', date: '2026.05.28' },
      { cat: '보도', fg: '#B07A2A', bg: '#FBF1E1', isNew: false, title: '[보도자료] 2025 연간 상담 실적 발표', date: '2026.03.05' }
    ]
  ];

  const noticesDefault = [
    { isNew: true, title: '2026년 하반기 사회성 그룹치료 참가자 모집 안내', date: '2026.07.14' },
    { isNew: true, title: '7월 부모교육 특강 「사춘기 자녀와 대화하기」 참가 안내', date: '2026.07.10' },
    { isNew: false, title: '여름방학 프로그램 운영 일정 안내', date: '2026.07.03' },
    { isNew: false, title: '센터 홈페이지 리뉴얼 오픈 안내', date: '2026.06.27' },
    { isNew: false, title: '6월 후원자 소식지 발간', date: '2026.06.20' }
  ];

  const values = [
    { icon: svgIcon(IC.heart, '#2FA490'), bg: '#E6F6F3', fg: '#2FA490', title: '따뜻함', desc: '아이 한 명 한 명의 마음을 존중하며 정서적으로 안전한 공간을 만듭니다.' },
    { icon: svgIcon(IC.shield, '#2168B4'), bg: '#EAF3FB', fg: '#2168B4', title: '전문성', desc: '검증된 평가와 치료 기법, 지속적인 연구로 신뢰할 수 있는 서비스를 제공합니다.' },
    { icon: svgIcon(IC.link, '#B07A2A'), bg: '#FBF1E1', fg: '#B07A2A', title: '연결', desc: '가정·학교·지역사회를 이어 아이를 함께 돌보는 협력의 중심이 됩니다.' }
  ];

  const missions = [
    { no: 1, text: '아동·청소년의 심리적 어려움을 조기에 발견하고 전문적으로 개입합니다.' },
    { no: 2, text: '부모와 가족이 아이의 성장을 도울 수 있도록 교육하고 지원합니다.' },
    { no: 3, text: '지역사회 기관과 협력하여 촘촘한 아동 돌봄망을 구축합니다.' }
  ];

  const history = [
    { year: '2026', items: [{ mm: '06', text: '홈페이지 리뉴얼 오픈' }, { mm: '03', text: '경계선 지능 아동 통합 프로그램 신설' }] },
    { year: '2024', items: [{ mm: '09', text: '부모 대상 온라인(Zoom) 집단상담 프로그램 시작' }, { mm: '02', text: '치료실 확장 이전 (놀이·언어·인지학습·그룹치료실)' }] },
    { year: '2020', items: [{ mm: '11', text: '지역아동센터 협력 사업 협약 체결' }, { mm: '05', text: '누적 상담 10,000회기 달성' }] },
    { year: '2015', items: [{ mm: '03', text: '서울아동청소년센터 개소' }] }
  ];

  const orgTeams = [
    { team: '상담치료팀', bg: '#2168B4', duties: ['개별·가족 상담', '심리평가', '놀이·언어·인지학습 치료', '사회성 그룹치료'] },
    { team: '교육기획팀', bg: '#2FA490', duties: ['부모교육·특강 기획', '예방교육 운영', '교육자료 개발'] },
    { team: '운영지원팀', bg: '#7A8CA0', duties: ['접수·행정', '홍보·후원 관리', '지역기관 연계'] }
  ];

  const businesses = [
    { imgId: 'biz-0', imgHint: '상담 장면 사진', dir: 'ltr', eng: 'COUNSELING', fg: '#2168B4', chipBg: '#EAF3FB', title: '상담사업', desc: '아동·청소년과 가족이 겪는 심리·정서적 어려움을 전문 상담사가 함께 풀어갑니다. 초기 접수면접부터 심리평가, 개별·가족 상담까지 체계적으로 진행됩니다.', items: [{ no: 1, name: '개별 상담·치료', note: '놀이·언어·인지학습 치료 포함' }, { no: 2, name: '가족 상담', note: '부모상담·가족관계 개선' }, { no: 3, name: '심리평가', note: '종합심리검사·발달평가' }] },
    { imgId: 'biz-1', imgHint: '부모교육 강의 사진', dir: 'rtl', eng: 'EDUCATION', fg: '#2FA490', chipBg: '#E6F6F3', title: '교육사업', desc: '부모와 교사, 아이들을 위한 교육으로 문제를 예방하고 성장의 힘을 키웁니다. 온라인 강좌와 현장 특강을 함께 운영합니다.', items: [{ no: 1, name: '부모교육', note: '정기 특강·줌 집단상담' }, { no: 2, name: '교사 연수', note: '학교·기관 방문 교육' }, { no: 3, name: '예방교육', note: '중독 예방·정서 교육' }] },
    { imgId: 'biz-2', imgHint: '지역 협력 활동 사진', dir: 'ltr', eng: 'COMMUNITY', fg: '#B07A2A', chipBg: '#FBF1E1', title: '지역연계사업', desc: '학교, 지역아동센터, 복지기관과 손잡고 지역의 아이들을 함께 돌봅니다. 사례 의뢰와 협력 프로그램 운영을 통해 촘촘한 돌봄망을 만듭니다.', items: [{ no: 1, name: '학교 연계', note: '위기학생 의뢰·자문' }, { no: 2, name: '기관 협력', note: '지역아동센터·복지관 협약' }, { no: 3, name: '사례 관리', note: '통합 사례회의 운영' }] }
  ];

  const rooms = [
    { imgId: 'room-0', name: '놀이치료실', desc: '아이가 놀이를 통해 마음을 표현하고 회복하는 공간입니다. 연령별 놀잇감과 모래놀이 도구를 갖추고 있습니다.', target: '유아·초등 저학년' },
    { imgId: 'room-1', name: '인지학습치료실', desc: '읽기·쓰기·수학 등 학습의 기초를 아이의 속도에 맞춰 다지는 1:1 학습치료 공간입니다.', target: '학습에 어려움을 겪는 아동' },
    { imgId: 'room-2', name: '언어치료실', desc: '발음, 어휘, 의사소통 능력을 단계적으로 키우는 언어치료 전용 공간입니다.', target: '언어발달이 늦은 아동' },
    { imgId: 'room-3', name: '사회성 그룹치료실', desc: '또래와 함께하는 그룹 활동으로 대화와 협동, 감정 조절을 연습하는 넓은 활동 공간입니다.', target: '초등~청소년 그룹' },
    { imgId: 'room-4', name: '부모상담실', desc: '보호자가 편안하게 이야기를 나눌 수 있는 조용하고 아늑한 상담 공간입니다.', target: '학부모·보호자' },
    { imgId: 'room-5', name: '접수면접실', desc: '첫 방문 시 아이와 가족의 이야기를 듣고 필요한 도움을 안내하는 초기 면접 공간입니다.', target: '신규 내방 가족' }
  ];

  const videos = [
    { imgId: 'vid-0', title: '센터 소개 영상 — 아이의 마음이 자라는 곳', meta: '2026.06.27 · 3분 12초' },
    { imgId: 'vid-1', title: '[숏폼] 놀이치료실은 어떤 곳인가요?', meta: '2026.06.10 · 58초' },
    { imgId: 'vid-2', title: '[부모교육] 아이가 화를 낼 때, 부모의 첫 마디', meta: '2026.05.22 · 12분 40초' }
  ];

  const services = [
    { icon: svgIcon(IC.chat, '#2168B4'), bg: '#EAF3FB', fg: '#2168B4', title: '상담사업', desc: '아동·청소년과 가족을 위한 개별상담, 가족상담, 심리평가를 전문 상담사가 진행합니다.', tags: ['개별상담', '가족상담', '심리평가'] },
    { icon: svgIcon(IC.cap, '#2FA490'), bg: '#E6F6F3', fg: '#2FA490', title: '교육사업', desc: '부모교육, 교사 연수, 아동·청소년 대상 예방교육 등 성장을 돕는 교육을 운영합니다.', tags: ['부모교육', '교사연수', '예방교육'] },
    { icon: svgIcon(IC.link, '#B07A2A'), bg: '#FBF1E1', fg: '#B07A2A', title: '지역연계사업', desc: '학교, 지역아동센터, 복지기관과 협력하여 지역사회의 아동·청소년을 함께 돌봅니다.', tags: ['학교연계', '기관협력', '사례관리'] }
  ];

  const events = [
    { month: 'JUL', day: '22', title: '부모교육 특강 · 사춘기 자녀와 대화하기', meta: '19:30 · 온라인(Zoom)' },
    { month: 'JUL', day: '27', title: '여름방학 사회성 그룹 프로그램 시작', meta: '초등 3–6학년 · 센터 그룹치료실' },
    { month: 'AUG', day: '05', title: '지역아동센터 실무자 협력 간담회', meta: '14:00 · 센터 세미나실' }
  ];

  const partners = ['서울특별시', '○○구청', '○○교육지원청', '지역아동센터협의회', '○○복지재단', '○○대학교'];

  const steps = [
    { no: 1, title: '전화·방문 문의', desc: '전화 또는 방문으로 상담을 문의합니다.' },
    { no: 2, title: '접수면접 안내', desc: '담당자가 1~2일 내 연락드려 일정을 잡습니다.' },
    { no: 3, title: '초기 상담·평가', desc: '아이와 가족의 어려움을 파악하고 평가를 진행합니다.' },
    { no: 4, title: '프로그램 연계', desc: '가장 적합한 치료·프로그램을 안내해 드립니다.' }
  ];

  const faqs = ['상담 비용은 어떻게 되나요?', '심리평가는 꼭 받아야 하나요?', '부모도 함께 상담을 받을 수 있나요?'];

  window.SCYC_CONTENT = {
    programs, archiveDefault, newsDefault, noticesDefault,
    values, missions, history, orgTeams, businesses, rooms, videos,
    services, events, partners, steps, faqs, svgIcon, iconPaths: IC
  };
})();

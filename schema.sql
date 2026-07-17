-- 서울아동청소년센터 홈페이지 스키마 (Neon Postgres)
-- 실행: psql "$DATABASE_URL" -f schema.sql   또는 Neon 콘솔 SQL Editor에 붙여넣기

create table if not exists posts (
  id         serial primary key,
  board      text not null,               -- '공지사항' | '행사안내' | '보도자료'
  title      text not null,
  body       text default '',
  status     text default '게시중',        -- '게시중' | '임시저장'
  views      int  default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists posts_board_idx on posts (board, created_at desc);

create table if not exists files (
  id         serial primary key,
  category   text not null,               -- '센터 자료' | '부모교육 자료' | '영상자료'
  title      text not null,
  blob_url   text not null,
  file_type  text,                         -- 'PDF' | 'ZIP' | ...
  size       bigint,
  created_at timestamptz default now()
);
create index if not exists files_cat_idx on files (category, created_at desc);

create table if not exists banners (
  id         serial primary key,
  kind       text not null,               -- '메인 팝업' | '띠 배너'
  title      text,
  badge      text,
  body_text  text,
  period     text,
  preview_bg text,
  enabled    boolean default false,
  created_at timestamptz default now()
);

create table if not exists image_slots (
  slot_id    text primary key,            -- 'hero-main', 'director' 등
  url        text,
  s          real default 1,
  x          real default 0,
  y          real default 0,
  updated_at timestamptz default now()
);

# 오늘 뭐 먹지 (Food Mood App)

사용자의 현재 상태(허기, 기력, 자극, 위로, 여유, 온기) 진단을 기반으로 딱 맞는 메뉴를 추천해 주는 Next.js + TypeScript PWA 웹 애플리케이션입니다.

---

## 🛠 주요 기능 & 특징

1. **상태 진단 7문항**: 7가지 선택지를 통해 상태 수치(허기/기력/자극/위로/여유/온기) 계산
2. **시그니처 영수증 & 레이더 그래프**: 진단 결과서 영수증 및 Recharts 기반 6축 레이더 차트 제공
3. **맞춤 메뉴 추천 30선**: 알고리즘 기반 매칭 점수로 10개씩 더보기 제공
4. **대화형 AI 재추천 (Gemini API)**: "이거 말고 다른 거" 자연어 입력으로 추천 결과 피드백 조정
5. **테마별 & 찜하기 메뉴 탭**: 혼자 간단히, 퇴근 후 저녁 등 테마별 메뉴 탐색 및 하트(❤️) 찜하기
6. **PWA 지원 & 이미지 저장/공유**: 모바일 전체화면 실행(`standalone`), 영수증 캡처 이미지 다운로드 및 공유
7. **익명 행동 데이터 로그 수집 (Supabase)**: RLS 기반 안전한 익명 로그 수집

---

## 🚀 로컬 개발 환경 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성 후 필요한 API 키 입력:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000) 접속하여 확인합니다.

---

## 🗄️ Supabase DB 설정 및 마이그레이션 절차 (3단계)

1. [Supabase](https://supabase.com)에 로그인 후 새 프로젝트를 생성합니다.
2. 프로젝트의 **SQL Editor**로 이동하여 아래 마이그레이션 SQL을 실행합니다.

```sql
-- 1. sessions 테이블
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  device_type text not null,
  anon_id text not null
);

-- 2. diagnoses 테이블
create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  session_id uuid references public.sessions(id) on delete set null,
  answers jsonb not null,
  scores jsonb not null,
  verdict_title text not null
);

-- 3. interactions 테이블
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  diagnosis_id uuid references public.diagnoses(id) on delete set null,
  food_name text not null,
  rank integer not null,
  action text not null
);

-- 4. RLS 보안 정책 설정 (Insert 전용, Select 차단)
alter table public.sessions enable row level security;
alter table public.diagnoses enable row level security;
alter table public.interactions enable row level security;

create policy "Allow insert only for sessions" on public.sessions for insert to anon with check (true);
create policy "Allow insert only for diagnoses" on public.diagnoses for insert to anon with check (true);
create policy "Allow insert only for interactions" on public.interactions for insert to anon with check (true);
```

3. **Project Settings** -> **API** 메뉴에서 `Project URL`과 `anon public key`를 복사하여 `.env.local`에 기입합니다.

---

## 🌐 Vercel 배포 방법 Guide

1. GitHub 저장소에 코드를 푸시합니다.
2. Vercel 대시보드에서 `Import Project`를 실행합니다.
3. Environment Variables 섹션에 `.env.local`의 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`)를 등록 후 Deploy 버튼을 누릅니다.

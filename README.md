# 럭셔리 디지털 메뉴보드 및 결제 내역 관리 시스템 ✨

미용, 에스테틱, 네일샵 등 프리미엄 시술 환경에 특화된 고급스러운 다국어 디지털 메뉴보드 및 고객 결제 내역 관리 React 애플리케이션입니다.

## 🌟 주요 기능

- **프리미엄 테마 UI/UX**: 블랙 & 골드 톤의 럭셔리한 디자인과 직관적인 인터페이스
- **다국어 지원 메뉴판**: 한국어, 영어, 중국어를 실시간으로 전환하며 글로벌 고객 응대 가능
- **장바구니 및 할인 기능**: 선택한 시술들을 한눈에 확인하고 할인 금액을 적용하여 최종 결제 금액 산출
- **디지털 전자 서명**: 아이패드 등 태블릿 기기에 최적화된 고객 전자 서명 패드 지원 (서명 이미지는 클라우드 스토리지에 안전하게 보관)
- **결제 내역 관리 (History)**: 
  - 과거 결제 내역 및 고객 서명 조회
  - 편리한 인라인 편집 모드를 통해 지난 시술 항목 추가/삭제, 금액 변경, 특이사항(Memo) 기록
- **디자이너 계정 관리**: Supabase Auth를 활용한 디자이너별 안전한 로그인 및 개별 내역 관리

## 🛠 기술 스택

- **Frontend**: React, React Router, Vite
- **Styling**: Vanilla CSS (CSS Variables를 활용한 테마 디자인 시스템 적용)
- **Backend / BaaS**: [Supabase](https://supabase.com/)
  - **Database**: PostgreSQL (시술 메뉴, 결제 기록, 시술 상세 항목 저장)
  - **Storage**: 고객 서명 이미지 파일 저장 (Base64 변환 후 업로드)
  - **Authentication**: 이메일 기반 디자이너 계정 로그인

## 🚀 시작하기

### 1. 필수 조건
- [Node.js](https://nodejs.org/) 설치
- [Supabase](https://supabase.com/) 프로젝트 생성

### 2. 프로젝트 클론 및 패키지 설치
```bash
git clone <repository-url>
cd Menu
npm install
```

### 3. 환경 변수 설정
프로젝트 최상단 루트 디렉토리에 `.env` 파일을 생성하고 아래와 같이 Supabase 프로젝트 정보를 입력합니다.
> **주의**: `.env` 파일은 절대로 Git 등 버전 관리 시스템에 업로드되지 않도록 주의하세요 (`.gitignore`에 추가되어 있습니다).

```env
VITE_SUPABASE_URL=당신의_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=당신의_SUPABASE_ANON_KEY
```

### 4. 데이터베이스 셋업 (Supabase SQL Editor)
애플리케이션이 정상적으로 동작하기 위해서는 Supabase에 테이블과 버킷이 세팅되어 있어야 합니다.
프로젝트 폴더 내에 포함된 `supabase_schema.sql` (또는 제공된 마이그레이션 스크립트) 파일을 복사하여 Supabase의 SQL Editor에서 실행해주세요.
- `menu_items`: 시술 메뉴 목록 테이블
- `orders`: 결제 및 서명 완료된 내역 테이블
- `order_items`: 각 결제별 상세 시술 항목 테이블
- `signatures` 버킷: 고객 서명 이미지 보관 스토리지 (Public 권한 설정 필요)

### 5. 로컬 서버 실행
```bash
npm run dev
```
터미널에 표시되는 로컬 주소(예: `http://localhost:5173`)로 접속하여 애플리케이션을 확인합니다.

## 📁 주요 폴더 구조

```text
Menu/
├── src/
│   ├── components/       # 공통 컴포넌트 (서명 모달 등)
│   ├── pages/            # 주요 페이지 (Main, History 등)
│   ├── App.jsx           # 라우팅 및 최상위 레이아웃
│   ├── index.css         # 글로벌 스타일 및 UI 테마
│   └── supabaseClient.js # Supabase 연결 설정
├── .env                  # (Git 무시) 로컬 환경 변수
├── .gitignore            # Git 관리 제외 항목 정의
├── package.json          # 패키지 의존성 관리
└── ...
```

## 📝 라이선스
This project is licensed under the MIT License.

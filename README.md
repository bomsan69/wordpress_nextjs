# WordPress 포스트 관리 시스템

Next.js 14를 이용한 WordPress 포스트 관리 시스템입니다.

## 주요 기능

- **로그인**: .env.local 파일 기반 인증
- **포스트 목록**: 검색 필터, 페이징 (10개씩)
- **포스트 상세**: 조회 전용
- **포스트 등록**: 카테고리, 타이틀, 본문, 등록자 선택

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- WordPress REST API

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```env
# 로그인 정보
ADMIN_ID=admin
ADMIN_PASSWORD=yourpassword

# WordPress 연동
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=wp-admin-username
WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### WordPress Application Password 생성 방법

1. WordPress 관리자 페이지 로그인
2. 사용자 > 프로필로 이동
3. 하단의 "Application Passwords" 섹션 찾기
4. 새 Application Password 이름 입력 (예: "Next.js App")
5. "Add New Application Password" 클릭
6. 생성된 비밀번호를 `.env.local`의 `WORDPRESS_APP_PASSWORD`에 복사

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 페이지 구조

- `/` - 로그인 페이지로 리다이렉트
- `/login` - 로그인
- `/posts` - 포스트 목록 (검색 및 페이징)
- `/posts/[id]` - 포스트 상세
- `/posts/new` - 새 포스트 작성

## 디자인 특징

70대 노인을 대상으로 한 접근성 높은 디자인:

- **큰 글씨**: 최소 18px 이상
- **큰 버튼**: 최소 48px 높이
- **명확한 색상 대비**
- **여유있는 간격**
- **간결한 레이아웃**

## 검색 필터

- **등록일**: 시작일~종료일 날짜 범위 선택
- **카테고리**: WordPress 카테고리 목록
- **등록자**: WordPress 사용자 목록

기본적으로 최근 한 달간의 포스트를 표시합니다.

## 보안

- 미들웨어를 통한 인증 확인
- WordPress Application Password 사용
- 환경 변수를 통한 민감 정보 관리

## 라이선스

MIT

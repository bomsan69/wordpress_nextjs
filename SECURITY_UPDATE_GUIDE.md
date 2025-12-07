# 보안 업데이트 가이드

## 🔒 보안 수정 완료 항목

이 문서는 보안 감사 보고서를 기반으로 수정된 모든 보안 취약점을 정리합니다.

### ✅ CRITICAL 취약점 수정 완료

1. **하드코딩된 Credentials 제거**
   - ❌ 이전: API 키와 비밀번호가 소스코드에 하드코딩
   - ✅ 수정: 환경 변수만 사용, 기본값 제거
   - 영향 파일: `lib/sendmail.ts`

2. **보안 세션 관리 구현**
   - ❌ 이전: 정적 문자열 "authenticated" 사용
   - ✅ 수정: 암호화된 랜덤 토큰 (64자 hex) + 서버 사이드 세션 저장소
   - 영향 파일: `lib/auth.ts`

3. **비밀번호 해싱 추가**
   - ❌ 이전: 평문 비밀번호 저장 및 비교
   - ✅ 수정: bcrypt 해싱 (12 rounds) + timing-safe 비교
   - 영향 파일: `lib/auth.ts`

4. **XSS 취약점 수정**
   - ❌ 이전: WordPress HTML을 검증 없이 렌더링
   - ✅ 수정: DOMPurify로 HTML sanitization
   - 영향 파일: `app/posts/[id]/page.tsx`

5. **Next.js 업데이트**
   - ❌ 이전: 14.2.18 (CRITICAL CVE 존재)
   - ✅ 수정: Latest version (보안 패치 적용)
   - 영향 파일: `package.json`

### ✅ HIGH 취약점 수정 완료

6. **CSRF 보호 구현**
   - ✅ 모든 상태 변경 작업에 CSRF 토큰 검증
   - ✅ SameSite=strict 쿠키 설정
   - 영향 파일: `lib/csrf.ts` (신규), 모든 Server Actions

7. **Rate Limiting 구현**
   - ✅ 로그인 시도: 5회 실패 시 15분 잠금
   - ✅ 로그인 시도 추적 및 계정 잠금
   - 영향 파일: `lib/auth.ts`

8. **인증 체크 추가**
   - ✅ 모든 Server Actions에 인증 검증
   - ✅ 중복 방어 (middleware + Server Action)
   - 영향 파일: 모든 `actions.ts` 파일

9. **정보 노출 방지**
   - ✅ 에러 메시지 일반화
   - ✅ 민감 정보 로깅 제거
   - ✅ 구조화된 로깅 시스템
   - 영향 파일: 모든 Server Actions, `lib/sendmail.ts`

10. **보안 헤더 추가**
    - ✅ CSP (Content Security Policy)
    - ✅ HSTS (Strict-Transport-Security)
    - ✅ X-Frame-Options: DENY
    - ✅ X-Content-Type-Options: nosniff
    - ✅ 기타 보안 헤더
    - 영향 파일: `next.config.mjs`

### ✅ MEDIUM 취약점 수정 완료

11. **Docker 보안 강화**
    - ✅ 빌드 단계에서도 non-root 사용자 사용
    - 영향 파일: `Dockerfile`

12. **파일 업로드 검증**
    - ✅ 파일 크기 제한 (10MB)
    - ✅ MIME 타입 검증
    - ✅ Magic bytes 검증
    - ✅ 경로 탐색 방지
    - 영향 파일: `lib/validation.ts` (신규), `app/media/new/actions.ts`

13. **입력 값 검증**
    - ✅ 길이 제한
    - ✅ 타입 검증
    - ✅ HTML 이스케이프
    - 영향 파일: `lib/validation.ts` (신규)

14. **HTTPS 강제**
    - ✅ 프로덕션에서 HTTP → HTTPS 리다이렉션
    - ✅ 민감한 페이지 캐시 방지
    - 영향 파일: `middleware.ts`

---

## 🚨 즉시 수행해야 할 작업

### 1. 비밀번호 해시 생성

**중요**: 기존 평문 비밀번호를 해시로 변경해야 합니다.

```bash
# 비밀번호 해시 생성
node scripts/generate-password-hash.js "새로운_안전한_비밀번호"

# 출력된 해시를 복사하여 .env 파일에 추가
# ADMIN_PASSWORD_HASH=$2b$12$...
```

### 2. 환경 변수 업데이트

`.env` 또는 `.env.local` 파일을 다음과 같이 수정하세요:

```bash
# 1. 기존 ADMIN_PASSWORD 삭제 또는 주석 처리
# ADMIN_PASSWORD=jaycho1151!@

# 2. 새로운 해시 추가
ADMIN_PASSWORD_HASH=$2b$12$YOUR_GENERATED_HASH_HERE

# 3. Email API 설정 (하드코딩된 값 제거됨)
EMAIL_API_URL=https://apisvr.boranet.net:3300/api/v2/send
EMAIL_API_KEY=your_actual_api_key_here

# 4. 알림 이메일 주소
NOTIFICATION_EMAIL=bomsan69@gmail.com
```

### 3. 보안 자격 증명 회전

**모든 노출된 자격 증명을 즉시 변경하세요:**

1. **WordPress Application Password**
   - 기존: `0eZE wgkM 3gYV Pbqt D5yX uJaN` (노출됨)
   - 조치: WordPress 대시보드에서 새 Application Password 생성
   - 위치: WordPress Admin → Users → Profile → Application Passwords

2. **Email API Key**
   - 기존: `d91f0a72929403aee77799434c9a0fd230e681ff0bb095d3dc556393ab752c50` (노출됨)
   - 조치: Bora Net에 연락하여 새 API 키 발급

3. **Admin Password**
   - 기존: `jaycho1151!@` (노출됨)
   - 조치: 위 비밀번호 해시 생성 스크립트 사용

### 4. 파일 권한 수정

```bash
# .env 파일 권한 수정 (소유자만 읽기/쓰기)
chmod 600 .env
chmod 600 .env.local

# 스크립트 실행 권한 추가
chmod +x scripts/generate-password-hash.js
```

### 5. Git 히스토리 점검

**중요**: `.env` 파일이 과거에 커밋되었는지 확인하세요.

```bash
# .env 파일 커밋 이력 확인
git log --all --full-history -- .env .env.local

# 만약 발견되면, git history 재작성 고려 (주의!)
# 또는 노출된 모든 자격 증명을 즉시 회전
```

---

## 🔧 개발 환경 설정

### 의존성 설치

보안 업데이트로 새로운 패키지가 추가되었습니다:

```bash
npm install
```

새로 추가된 패키지:
- `bcrypt`: 비밀번호 해싱
- `isomorphic-dompurify`: HTML sanitization
- `@types/bcrypt`: TypeScript 타입

### 로컬 개발 시작

```bash
# 1. 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 편집하여 실제 값 입력

# 2. 비밀번호 해시 생성
node scripts/generate-password-hash.js "your-password"

# 3. 개발 서버 시작
npm run dev
```

---

## 🐳 Docker 배포

Docker 이미지가 보안 강화되었습니다:

```bash
# 이미지 빌드
docker-compose build

# 컨테이너 실행
docker-compose up -d

# 환경 변수는 docker-compose.yml 또는 .env 파일에서 설정
```

---

## 📋 체크리스트

배포 전 다음 항목을 확인하세요:

- [ ] 비밀번호 해시 생성 완료 (`ADMIN_PASSWORD_HASH` 설정)
- [ ] 모든 하드코딩된 credentials 제거 확인
- [ ] WordPress Application Password 재발급
- [ ] Email API Key 재발급
- [ ] `.env` 및 `.env.local` 파일 권한 600으로 설정
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `npm install`로 새 의존성 설치
- [ ] 로컬에서 로그인 테스트
- [ ] 로컬에서 포스트 생성/수정/삭제 테스트
- [ ] 로컬에서 파일 업로드 테스트
- [ ] 프로덕션 배포 전 스테이징 환경에서 테스트

---

## 🔐 보안 모범 사례

### 환경별 분리

```bash
# 개발
.env.development

# 스테이징
.env.staging

# 프로덕션
.env.production
```

각 환경마다 **다른 비밀번호와 API 키**를 사용하세요.

### 비밀번호 정책

- 최소 12자 이상
- 대문자, 소문자, 숫자, 특수문자 조합
- 일반 단어나 패턴 피하기
- 비밀번호 관리자 사용 권장

### 정기 보안 점검

```bash
# 의존성 취약점 스캔
npm audit

# 보안 업데이트 확인
npm outdated

# 주요 보안 업데이트 적용
npm update
```

---

## 📞 문제 발생 시

### 로그인 실패

1. 비밀번호 해시가 올바르게 생성되었는지 확인
2. 환경 변수가 올바르게 설정되었는지 확인
3. 계정 잠금 여부 확인 (5회 실패 시 15분 잠금)

### 세션 문제

- 브라우저 쿠키 삭제 후 재시도
- 개발자 도구에서 `wp-admin-session` 쿠키 확인
- 서버 재시작 (in-memory 세션 저장소 초기화)

### CSRF 에러

- 페이지 새로고침 후 재시도
- 브라우저 쿠키 설정 확인 (third-party cookies 차단 여부)

---

## 📚 추가 개선 사항 (선택)

향후 보안을 더욱 강화하려면:

1. **프로덕션 세션 저장소**
   - Redis 또는 데이터베이스 기반 세션 저장소 구현
   - 현재는 in-memory (서버 재시작 시 세션 초기화)

2. **2FA (Two-Factor Authentication)**
   - TOTP 기반 2단계 인증 추가

3. **감사 로그**
   - 모든 관리 작업 로깅
   - 누가, 언제, 무엇을 했는지 추적

4. **WAF (Web Application Firewall)**
   - Cloudflare 또는 AWS WAF 설정
   - DDoS 방어

5. **모니터링**
   - Sentry 또는 DataDog 연동
   - 보안 이벤트 알림

---

## ✅ 수정 완료 요약

| 취약점 | 심각도 | 상태 |
|--------|--------|------|
| 하드코딩된 Credentials | CRITICAL | ✅ 수정 |
| 취약한 세션 관리 | CRITICAL | ✅ 수정 |
| 평문 비밀번호 비교 | CRITICAL | ✅ 수정 |
| XSS 취약점 | CRITICAL | ✅ 수정 |
| Next.js CVE | CRITICAL | ✅ 수정 |
| CSRF 보호 없음 | HIGH | ✅ 수정 |
| Rate Limiting 없음 | HIGH | ✅ 수정 |
| IDOR | HIGH | ✅ 수정 |
| 정보 노출 | HIGH | ✅ 수정 |
| 보안 헤더 누락 | HIGH | ✅ 수정 |
| Docker root 권한 | MEDIUM | ✅ 수정 |
| 파일 업로드 검증 없음 | MEDIUM | ✅ 수정 |
| 입력 값 검증 미흡 | MEDIUM | ✅ 수정 |
| HTTPS 강제 없음 | MEDIUM | ✅ 수정 |

**전체 14개 주요 취약점 수정 완료** ✅

---

**작성일**: 2025-12-07
**보안 수준**: PRODUCTION READY (환경 변수 설정 후)

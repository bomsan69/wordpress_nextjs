# GitHub Actions CI/CD 워크플로우 가이드

이 문서는 ksenior 프로젝트의 GitHub Actions 기반 CI/CD 파이프라인에 대한 종합 가이드입니다.

## 📋 목차

1. [워크플로우 개요](#워크플로우-개요)
2. [배포 전략](#배포-전략)
3. [워크플로우 상세 설명](#워크플로우-상세-설명)
4. [필수 GitHub Secrets 설정](#필수-github-secrets-설정)
5. [브랜치 전략](#브랜치-전략)
6. [사용 방법](#사용-방법)
7. [트러블슈팅](#트러블슈팅)

---

## 워크플로우 개요

프로젝트에는 다음 4개의 워크플로우가 구성되어 있습니다:

| 워크플로우 | 파일명 | 트리거 | 목적 |
|-----------|--------|--------|------|
| **CI** | `ci.yml` | PR 생성/업데이트, push to develop/staging/master | 코드 품질 체크 및 빌드 테스트 |
| **Production Deployment** | `cd-production.yml` | push to master | 프로덕션 환경 자동 배포 |
| **Staging Deployment** | `cd-staging.yml` | push to staging | 스테이징 환경 자동 배포 |
| **PR Checks** | `pr-checks.yml` | PR 생성/업데이트 | PR 분석, 영향도 평가, 자동 라벨링 |

---

## 배포 전략

### 환경별 배포 플로우

```
Feature Branch
    ↓
    PR → develop (CI 실행)
    ↓
    Merge → develop
    ↓
    PR → staging (CI 실행)
    ↓
    Merge → staging (Staging 배포)
    ↓
    테스트 및 QA 검증
    ↓
    PR → master (CI 실행, 리뷰 필수)
    ↓
    Merge → master (Production 배포)
```

### 배포 환경 구성

#### 1. Development (로컬/개발)
- **브랜치**: `develop`, feature branches
- **자동 배포**: ❌ 없음
- **CI 실행**: ✅ 코드 품질 체크, 빌드 테스트
- **용도**: 개발 중인 기능 통합 및 테스트

#### 2. Staging (스테이징)
- **브랜치**: `staging`
- **자동 배포**: ✅ staging 브랜치로 push 시
- **CI 실행**: ✅ 전체 CI + 배포
- **용도**: 프로덕션 배포 전 최종 검증
- **배포 방식**: Docker Compose via SSH
- **롤백**: 자동 (실패 시 이전 버전으로)

#### 3. Production (프로덕션)
- **브랜치**: `master`
- **자동 배포**: ✅ master 브랜치로 push 시
- **CI 실행**: ✅ 전체 CI + 보안 스캔 + 배포
- **승인 프로세스**: GitHub Environment 설정 가능
- **배포 방식**: Docker Compose via SSH
- **보안**: Trivy 취약점 스캔
- **롤백**: 수동 (workflow_dispatch)

---

## 워크플로우 상세 설명

### 1. CI Workflow (`ci.yml`)

**목적**: 코드 품질 보증 및 빌드 검증

**실행 조건**:
- Pull Request가 `develop`, `staging`, `master`로 생성/업데이트될 때
- `develop`, `staging`, `master` 브랜치로 직접 push될 때

**실행 단계**:

1. **Code Quality Checks**
   - ESLint 실행 (코드 스타일 검증)
   - TypeScript 타입 체크
   - npm audit (보안 취약점 검사)

2. **Build Test**
   - Next.js 애플리케이션 빌드
   - 빌드 아티팩트 크기 확인
   - 빌드 결과물 업로드 (3일 보관)

3. **Docker Build Test**
   - Docker 이미지 빌드 테스트
   - 멀티 스테이지 빌드 검증
   - 이미지 레이어 캐싱 (빌드 속도 최적화)

4. **CI Summary**
   - 전체 CI 결과 요약
   - 실패 시 명확한 에러 메시지 제공

**특징**:
- Fail-fast 전략: 품질 체크 실패 시 즉시 중단
- 병렬 실행: Quality Check, Build Test, Docker Build 동시 실행
- 캐싱: npm 패키지 및 Docker 레이어 캐싱으로 속도 최적화

---

### 2. Production Deployment (`cd-production.yml`)

**목적**: 프로덕션 환경에 안전하게 배포

**실행 조건**:
- `master` 브랜치로 push
- 수동 트리거 (workflow_dispatch)

**실행 단계**:

1. **Build and Push**
   - Docker 이미지 빌드
   - 이미지 태깅 (latest, production, SHA, timestamp)
   - Docker Hub/GHCR로 푸시
   - Trivy 보안 스캔 실행

2. **Deploy to Server**
   - SSH를 통해 프로덕션 서버 접속
   - 최신 Docker 이미지 pull
   - 무중단 배포 (docker compose up -d)
   - 헬스 체크 실행

3. **Notification**
   - 배포 결과 요약
   - Slack 알림 (설정 시)
   - GitHub Step Summary

4. **Rollback** (실패 시)
   - 이전 버전으로 자동 롤백
   - 롤백 상태 알림

**보안 특징**:
- 프로덕션 환경 보호 (GitHub Environment)
- 승인 프로세스 설정 가능
- 취약점 스캔 (Trivy)
- SARIF 결과를 GitHub Security로 업로드
- 동시 배포 방지

---

### 3. Staging Deployment (`cd-staging.yml`)

**목적**: 스테이징 환경에서 빠른 테스트 및 검증

**실행 조건**:
- `staging` 브랜치로 push
- 수동 트리거

**실행 단계**:
1. Docker 이미지 빌드 및 푸시 (staging 태그)
2. 스테이징 서버 배포
3. 헬스 체크
4. 배포 결과 알림

**특징**:
- 빠른 배포 (보안 스캔 생략)
- 새 배포 시작 시 이전 배포 취소
- 실패 시 경고만 출력 (배포는 진행)

---

### 4. PR Checks (`pr-checks.yml`)

**목적**: Pull Request 자동 분석 및 리뷰 지원

**실행 조건**:
- PR이 `develop`, `staging`, `master`로 생성/업데이트될 때
- Draft PR은 제외

**실행 단계**:

1. **PR Information & Analysis**
   - 변경된 파일 수, 라인 수 계산
   - 민감한 파일 체크 (.env, .key 등)
   - 대용량 파일 체크 (>1MB)
   - 파일 타입별 변경 통계

2. **Dependency Review**
   - 새로 추가된 의존성 검토
   - 라이선스 체크 (GPL, AGPL 차단)
   - 보안 취약점이 있는 패키지 감지

3. **Impact Analysis**
   - API 라우트 변경 감지
   - Docker 설정 변경 감지
   - 보안 관련 파일 변경 감지
   - 변경 영향도 체크리스트 생성

4. **PR Size Labeling**
   - PR 크기 자동 계산
   - 크기별 라벨 자동 추가
     - `size/XS`: 0-50 lines
     - `size/S`: 51-200 lines
     - `size/M`: 201-500 lines
     - `size/L`: 501-1000 lines
     - `size/XL`: 1000+ lines
   - 대규모 PR에 대한 경고

**특징**:
- 자동 코드 리뷰 보조
- PR 작성자에게 체크리스트 제공
- 리뷰어에게 영향도 정보 제공

---

## 필수 GitHub Secrets 설정

### Repository Secrets 설정 방법

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 아래 목록의 Secret을 추가

### Docker Registry Secrets

#### Docker Hub 사용 시

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `DOCKER_USERNAME` | Docker Hub 사용자명 | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub 액세스 토큰 | `dckr_pat_xxxxx...` |

> **Docker Hub 액세스 토큰 생성**:
> 1. Docker Hub 로그인
> 2. Account Settings → Security → New Access Token
> 3. Token 이름 입력 (예: "GitHub Actions")
> 4. 생성된 토큰 복사 및 `DOCKER_PASSWORD`에 저장

#### GitHub Container Registry 사용 시 (대안)

Docker Hub 대신 GHCR 사용 시:
- `DOCKER_USERNAME` 불필요
- `DOCKER_PASSWORD` 불필요
- `GITHUB_TOKEN` 자동 제공됨

워크플로우 파일 수정 필요:
```yaml
# cd-production.yml, cd-staging.yml 수정
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

# 이미지 이름도 변경
images: ghcr.io/${{ github.repository }}
```

---

### Production Server Secrets

| Secret Name | 설명 | 필수 | 예시 |
|-------------|------|------|------|
| `PRODUCTION_SERVER_HOST` | 프로덕션 서버 IP/도메인 | ✅ | `123.456.789.0` 또는 `prod.example.com` |
| `PRODUCTION_SERVER_USER` | SSH 접속 사용자명 | ✅ | `deploy` 또는 `ubuntu` |
| `PRODUCTION_SERVER_SSH_KEY` | SSH Private Key | ✅ | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SERVER_PORT` | SSH 포트 | ❌ | `22` (기본값) |
| `PRODUCTION_DEPLOY_PATH` | 배포 디렉토리 경로 | ❌ | `/opt/ksenior` (기본값) |
| `PRODUCTION_APP_URL` | 앱 헬스체크 URL | ❌ | `https://kseniorusa.org` |

---

### Staging Server Secrets

| Secret Name | 설명 | 필수 | 예시 |
|-------------|------|------|------|
| `STAGING_SERVER_HOST` | 스테이징 서버 IP/도메인 | ✅ | `staging.example.com` |
| `STAGING_SERVER_USER` | SSH 접속 사용자명 | ✅ | `deploy` |
| `STAGING_SERVER_SSH_KEY` | SSH Private Key | ✅ | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_SERVER_PORT` | SSH 포트 | ❌ | `22` (기본값) |
| `STAGING_DEPLOY_PATH` | 배포 디렉토리 경로 | ❌ | `/opt/ksenior-staging` (기본값) |
| `STAGING_APP_URL` | 앱 헬스체크 URL | ❌ | `http://staging.example.com:8003` |

---

### SSH Key 생성 및 설정 방법

#### 1. SSH Key Pair 생성

로컬 또는 서버에서:

```bash
# 새로운 SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 또는 RSA 사용 시
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

- 패스프레이즈 입력 없이 Enter (GitHub Actions는 패스프레이즈 미지원)
- 생성된 파일:
  - `~/.ssh/github_actions_deploy` (Private Key) → GitHub Secret
  - `~/.ssh/github_actions_deploy.pub` (Public Key) → 서버에 등록

#### 2. Public Key를 서버에 등록

```bash
# 서버에 SSH 접속
ssh user@your-server

# authorized_keys에 Public Key 추가
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# 권한 설정
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

#### 3. Private Key를 GitHub Secret으로 등록

```bash
# Private Key 내용 출력
cat ~/.ssh/github_actions_deploy

# 출력된 전체 내용을 복사 (-----BEGIN ... -----END 포함)
```

GitHub Repository → Settings → Secrets → New secret:
- Name: `PRODUCTION_SERVER_SSH_KEY` (또는 `STAGING_SERVER_SSH_KEY`)
- Value: 복사한 Private Key 전체 내용 붙여넣기

#### 4. SSH 접속 테스트

```bash
# 로컬에서 Private Key로 서버 접속 테스트
ssh -i ~/.ssh/github_actions_deploy user@your-server

# 성공하면 GitHub Actions도 정상 작동
```

---

### Optional: Slack Notification Secrets

Slack 알림을 받고 싶은 경우:

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook URL | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX` |

**Slack Webhook 생성 방법**:
1. Slack 워크스페이스 → Apps → Incoming Webhooks
2. "Add to Slack" 클릭
3. 채널 선택 및 Webhook URL 복사

---

## 브랜치 전략

### Git Flow 기반 브랜치 모델

```
master (프로덕션)
  ↑
staging (스테이징)
  ↑
develop (개발)
  ↑
feature/* (기능 개발)
```

### 브랜치별 역할

- **`master`**: 프로덕션 배포 브랜치
  - 항상 배포 가능한 상태 유지
  - 직접 커밋 금지 (PR only)
  - PR merge 시 자동 배포

- **`staging`**: 스테이징 배포 브랜치
  - 프로덕션 배포 전 최종 검증
  - develop에서 PR로 merge
  - merge 시 자동 배포

- **`develop`**: 개발 통합 브랜치
  - 개발 중인 기능들이 통합되는 브랜치
  - feature 브랜치가 merge되는 타겟

- **`feature/*`**: 기능 개발 브랜치
  - 새로운 기능 개발
  - develop에서 분기
  - develop으로 PR

---

## 사용 방법

### 1. 새로운 기능 개발

```bash
# develop 브랜치에서 시작
git checkout develop
git pull origin develop

# 새 기능 브랜치 생성
git checkout -b feature/new-feature

# 개발 진행
# ...

# 커밋 및 푸시
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature
```

**GitHub에서**:
1. `feature/new-feature` → `develop` PR 생성
2. CI 워크플로우 자동 실행 (코드 품질 체크)
3. PR Checks 워크플로우 실행 (분석 및 라벨링)
4. 리뷰 후 merge

---

### 2. Staging 배포

```bash
# develop이 안정화되면 staging으로 배포
git checkout staging
git pull origin staging
git merge develop

# 또는 GitHub에서 develop → staging PR 생성 및 merge
```

**자동 실행**:
- CI 워크플로우 (코드 검증)
- Staging Deployment 워크플로우 (자동 배포)

---

### 3. Production 배포

```bash
# staging 테스트 완료 후
git checkout master
git pull origin master
git merge staging

# 또는 GitHub에서 staging → master PR 생성
```

**자동 실행**:
- CI 워크플로우
- Production Deployment 워크플로우
- 보안 스캔
- 자동 배포

**권장사항**:
- master로의 merge는 팀 리더/시니어 개발자가 리뷰
- 반드시 staging에서 충분한 테스트 후 진행
- 배포 시간대 고려 (트래픽이 적은 시간)

---

### 4. 수동 배포 (Emergency)

긴급 배포가 필요한 경우:

1. GitHub → Actions 탭
2. 원하는 워크플로우 선택 (CD - Production/Staging)
3. "Run workflow" 클릭
4. 브랜치 선택 및 실행

---

### 5. 롤백 (배포 실패 시)

#### 자동 롤백
- Production 배포 실패 시 자동으로 이전 버전으로 롤백 시도

#### 수동 롤백

**방법 1: 서버에서 직접**
```bash
# 서버 접속
ssh user@production-server

cd /opt/ksenior

# 이전 이미지로 재배포
docker compose down
docker compose pull <previous-tag>
docker compose up -d
```

**방법 2: GitHub에서 이전 커밋으로 재배포**
```bash
# 로컬에서 이전 커밋으로 돌아가기
git checkout master
git reset --hard <previous-commit-sha>
git push origin master --force

# 또는 revert 사용 (권장)
git revert <bad-commit-sha>
git push origin master
```

---

## 서버 환경 설정

배포가 작동하려면 서버에 다음이 준비되어야 합니다:

### 1. 서버 사전 준비

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 배포 사용자 추가 (선택사항)
sudo adduser deploy
sudo usermod -aG docker deploy

# 배포 디렉토리 생성
sudo mkdir -p /opt/ksenior
sudo chown deploy:deploy /opt/ksenior
```

---

### 2. 서버에 docker-compose.yml 및 .env 배치

#### `/opt/ksenior/docker-compose.yml`

```yaml
version: '3.8'

services:
  ksenior-app:
    image: YOUR_DOCKERHUB_USERNAME/ksenior-app:production
    container_name: ksenior-app
    ports:
      - "8003:8003"
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - ksenior-network

networks:
  ksenior-network:
    driver: bridge
```

#### `/opt/ksenior/.env`

```bash
NODE_ENV=production
ADMIN_ID=your_admin_id
ADMIN_PASSWORD_HASH=$2b$12$your_bcrypt_hash
WORDPRESS_URL=https://kseniorusa.org
WORDPRESS_USERNAME=your_wp_username
WORDPRESS_APP_PASSWORD=your_wp_password
EMAIL_API_URL=https://apisvr.boranet.net:3300/api/v2/send
EMAIL_API_KEY=your_email_api_key
NOTIFICATION_EMAIL=your-email@example.com
```

> **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

---

### 3. Docker Hub 로그인 (서버에서)

```bash
# 서버에서 Docker Hub 로그인
docker login

# Username과 Password 입력
# 또는 Access Token 사용 권장
```

---

## GitHub Environments 설정 (선택사항)

프로덕션 배포에 승인 프로세스를 추가하려면:

1. GitHub Repository → Settings → Environments
2. "New environment" → `production` 입력
3. Protection rules 설정:
   - ✅ Required reviewers (승인자 지정)
   - ✅ Wait timer (대기 시간 설정)
   - ✅ Deployment branches (master만 허용)
4. Environment secrets 추가 (선택사항)

이제 master로 배포 시 지정된 승인자의 승인이 필요합니다.

---

## 모니터링 및 로그

### 1. GitHub Actions 로그 확인

- Repository → Actions 탭
- 실행된 워크플로우 클릭
- 각 Job 및 Step별 로그 확인

### 2. 서버 로그 확인

```bash
# 서버 접속
ssh user@production-server

cd /opt/ksenior

# 실시간 로그
docker compose logs -f ksenior-app

# 최근 100줄
docker compose logs --tail=100 ksenior-app

# 특정 시간대 로그
docker compose logs --since 2024-01-01T10:00:00 ksenior-app
```

### 3. 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너
docker ps

# 컨테이너 상세 정보
docker inspect ksenior-app

# 리소스 사용량
docker stats ksenior-app
```

---

## 트러블슈팅

### 문제 1: CI 워크플로우에서 빌드 실패

**증상**: `npm run build` 실패

**원인**:
- TypeScript 타입 에러
- ESLint 에러
- 환경 변수 누락

**해결**:
```bash
# 로컬에서 재현
npm run build

# 타입 체크
npx tsc --noEmit

# Lint 체크
npm run lint
```

---

### 문제 2: Docker 이미지 빌드 실패

**증상**: Docker build 단계에서 실패

**원인**:
- Dockerfile 문법 오류
- node_modules 권한 문제
- 메모리 부족

**해결**:
```bash
# 로컬에서 Docker 빌드 테스트
docker build -t ksenior-app:test .

# 캐시 없이 빌드
docker build --no-cache -t ksenior-app:test .

# 빌드 로그 상세 확인
docker build --progress=plain -t ksenior-app:test .
```

---

### 문제 3: 서버 배포 실패 (SSH 연결 에러)

**증상**: `Permission denied (publickey)` 또는 `Connection refused`

**원인**:
- SSH Key가 잘못 설정됨
- 서버 방화벽 차단
- SSH 포트 변경

**해결**:

1. **SSH Key 확인**:
```bash
# 로컬에서 SSH 접속 테스트
ssh -i ~/.ssh/github_actions_deploy user@server-ip

# GitHub Secret의 SSH Key 재확인
# - BEGIN/END 라인 포함되어 있는지
# - 줄바꿈이 제대로 되어 있는지
```

2. **서버 방화벽 확인**:
```bash
# SSH 포트 확인
sudo netstat -tuln | grep :22

# UFW 방화벽 확인 (Ubuntu)
sudo ufw status

# 필요시 SSH 허용
sudo ufw allow 22/tcp
```

3. **서버 authorized_keys 확인**:
```bash
# 서버에서
cat ~/.ssh/authorized_keys

# 권한 확인
ls -la ~/.ssh/
# drwx------ .ssh
# -rw------- authorized_keys
```

---

### 문제 4: 배포 후 애플리케이션 응답 없음

**증상**: 헬스 체크 실패, 502 Bad Gateway

**원인**:
- 컨테이너가 시작되지 않음
- 포트 바인딩 문제
- 환경 변수 오류

**해결**:

```bash
# 서버에서 컨테이너 상태 확인
docker ps -a | grep ksenior

# 컨테이너 로그 확인
docker compose logs ksenior-app

# 컨테이너 재시작
docker compose restart ksenior-app

# 환경 변수 확인
docker exec ksenior-app env | grep NODE_ENV

# 포트 바인딩 확인
sudo netstat -tuln | grep 8003
```

**일반적인 원인**:
- `.env` 파일의 `ADMIN_PASSWORD_HASH` 형식 오류
- `WORDPRESS_APP_PASSWORD` 공백 문제
- 데이터베이스 연결 실패 (있는 경우)

---

### 문제 5: Docker Hub Rate Limit 초과

**증상**: `Too Many Requests` 에러

**원인**:
- Docker Hub 익명 사용자 pull 제한 (6시간당 100회)
- 인증된 사용자도 제한 있음 (6시간당 200회)

**해결**:

1. **GitHub Container Registry로 전환** (무료, 무제한):
   - `cd-production.yml`, `cd-staging.yml` 수정
   - Docker Hub 로그인 대신 GHCR 로그인 사용

2. **Docker Hub 유료 플랜** (Pro/Team):
   - Pull 제한 대폭 증가

3. **캐싱 최적화**:
   - 워크플로우의 cache 설정 최대 활용
   - 불필요한 빌드 줄이기

---

### 문제 6: Secrets 접근 불가

**증상**: `${{ secrets.XXX }}` 값이 비어있음

**원인**:
- Secret 이름 오타
- Environment 설정 문제
- Fork된 저장소 (외부 기여자)

**해결**:

1. **Secret 이름 확인**:
   - Repository Settings → Secrets에서 이름 재확인
   - 대소문자 구분

2. **Environment 확인**:
   - 워크플로우 Job에 `environment: production` 설정 확인
   - Environment Secrets는 해당 Environment에서만 접근 가능

3. **Permissions 확인**:
   - Fork에서 PR 시 Secrets 접근 불가 (보안상 이유)
   - 본인 저장소에서만 정상 작동

---

## 베스트 프랙티스

### 1. 코드 품질
- ✅ Commit 전에 항상 `npm run lint` 실행
- ✅ PR 전에 로컬에서 `npm run build` 성공 확인
- ✅ 의미 있는 커밋 메시지 작성

### 2. PR 관리
- ✅ PR은 가능한 한 작게 유지 (500 라인 이하 권장)
- ✅ PR 설명에 변경 이유와 영향도 명시
- ✅ 리뷰어에게 충분한 컨텍스트 제공

### 3. 배포 관리
- ✅ 배포 전에 staging에서 충분히 테스트
- ✅ 프로덕션 배포는 트래픽이 적은 시간대에
- ✅ 배포 후 로그와 모니터링 확인

### 4. 보안
- ✅ Secrets는 절대 코드에 하드코딩하지 않기
- ✅ SSH Private Key는 패스프레이즈 없이 생성
- ✅ 정기적으로 `npm audit` 실행 및 취약점 패치

### 5. 모니터링
- ✅ Slack 알림 설정으로 배포 상태 실시간 파악
- ✅ GitHub Actions 실패 시 즉시 대응
- ✅ 서버 로그 정기적으로 확인

---

## 추가 개선 사항 (향후)

### 1. 테스트 추가
```yaml
# ci.yml에 추가
- name: Run tests
  run: npm test
```

현재는 테스트가 없지만, 향후 Jest 등을 사용한 유닛/통합 테스트 추가 권장.

### 2. 성능 모니터링
- Lighthouse CI 통합
- Bundle size 모니터링
- 로드 타임 추적

### 3. 자동화된 백업
- 배포 전 자동 백업
- 데이터베이스 백업 (있는 경우)

### 4. Blue-Green 배포
- 무중단 배포 개선
- 트래픽 전환 자동화

### 5. Kubernetes 마이그레이션
- 현재: Docker Compose
- 향후: Kubernetes (확장성 향상)

---

## 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [Docker 공식 문서](https://docs.docker.com/)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## 문의 및 지원

문제가 해결되지 않거나 추가 지원이 필요한 경우:
1. GitHub Issues에 문제 등록
2. 팀 리더에게 문의
3. DevOps 팀에 에스컬레이션

---

**마지막 업데이트**: 2024-12-08
**문서 버전**: 1.0.0

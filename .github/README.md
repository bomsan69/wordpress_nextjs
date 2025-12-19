# GitHub Workflows 가이드

이 디렉토리에는 ksenior 프로젝트의 CI/CD 파이프라인을 위한 GitHub Actions 워크플로우가 포함되어 있습니다.

## 목차

1. [워크플로우 개요](#워크플로우-개요)
2. [Self-Hosted Runner 설정](#self-hosted-runner-설정)
3. [Cloudflare SSH Tunnel 배포](#cloudflare-ssh-tunnel-배포)
4. [필수 Secrets 설정](#필수-secrets-설정)
5. [워크플로우 상세](#워크플로우-상세)
6. [문제 해결](#문제-해결)

---

## 워크플로우 개요

### CI Workflows (자동 실행)

| 워크플로우 | 파일 | 트리거 | 목적 |
|-----------|------|--------|------|
| **CI - Code Quality & Build** | `ci.yml` | Push/PR to develop, staging, master | 코드 품질 체크, TypeScript 검증, 빌드 테스트 |
| **PR - Pull Request Checks** | `pr-checks.yml` | Pull Request 생성/업데이트 | PR 분석, 의존성 검토, 영향도 분석 |

### CD Workflows (배포)

| 워크플로우 | 파일 | 트리거 | 목적 |
|-----------|------|--------|------|
| **CD - Production Deployment** | `cd-production.yml` | Push to master | 프로덕션 배포 (Docker 이미지 빌드 및 서버 배포) |

---

## Self-Hosted Runner 설정

모든 워크플로우는 **self-hosted runner**를 사용하도록 구성되어 있습니다.

### Runner 요구사항

- **OS**: Linux (Ubuntu 20.04 이상 권장)
- **Labels**: `self-hosted`, `linux`
- **필수 소프트웨어**:
  - Docker
  - Docker Compose
  - Node.js 20.x
  - npm
  - Git

### Runner 설치

1. **GitHub Repository Settings**로 이동
2. **Actions** → **Runners** → **New self-hosted runner** 클릭
3. Linux 선택 후 안내에 따라 설치:

```bash
# Download
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure
./config.sh --url https://github.com/YOUR_ORG/ksenior --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

4. **Runner 상태 확인**:
   - Settings → Actions → Runners에서 "Idle" 상태 확인

### 필수 소프트웨어 설치 (Runner 서버)

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Node.js 20.x 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 설치 확인
docker --version
docker-compose --version
node --version
npm --version
```

---

## Cloudflare SSH Tunnel 배포

프로덕션 배포는 **Cloudflare Access SSH Tunnel**을 통해 안전하게 이루어집니다.

### 아키텍처

```
GitHub Actions (Self-Hosted Runner)
    ↓
cloudflared (Cloudflare Tunnel)
    ↓
Cloudflare Access (인증)
    ↓
ssh.askmebysms.com
    ↓
Production Server
```

### Cloudflare Access SSH 설정

#### 1. Cloudflare Access 설정 (관리자)

Cloudflare Zero Trust Dashboard에서:

1. **Access** → **Applications** → **Add an Application**
2. Application Type: **SSH**
3. Application Domain: `ssh.askmebysms.com`
4. Access Policies 설정:
   - Service Token 생성 (GitHub Actions용)
   - 허용할 IP/이메일 설정

#### 2. Service Token 생성

1. **Access** → **Service Auth** → **Create Service Token**
2. Token 정보 복사:
   - Client ID: `CF_ACCESS_CLIENT_ID`
   - Client Secret: `CF_ACCESS_CLIENT_SECRET`

#### 3. SSH 서버 설정

프로덕션 서버에서:

```bash
# 배포용 사용자 생성
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# SSH 키 생성 (GitHub Actions용)
sudo su - deploy
ssh-keygen -t ed25519 -C "github-actions@ksenior" -f ~/.ssh/id_ed25519 -N ""

# 공개키를 authorized_keys에 추가
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 개인키 복사 (GitHub Secrets에 등록할 내용)
cat ~/.ssh/id_ed25519
```

#### 4. 배포 디렉토리 준비

```bash
# 배포 디렉토리 생성
sudo mkdir -p /opt/ksenior
sudo chown deploy:deploy /opt/ksenior

# docker-compose.yml 및 .env 파일 배치
cd /opt/ksenior
# (docker-compose.yml과 .env 파일을 서버에 복사)
```

### 로컬에서 Cloudflare SSH 테스트

```bash
# cloudflared 설치
curl -L -o cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# SSH 연결 테스트
ssh -i ~/.ssh/id_ed25519 \
  -o ProxyCommand="cloudflared access ssh --hostname ssh.askmebysms.com \
    --service-token-id YOUR_CLIENT_ID \
    --service-token-secret YOUR_CLIENT_SECRET" \
  deploy@ssh.askmebysms.com
```

---

## 필수 Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions에서 다음 Secrets를 등록하세요.

### 🔴 필수 Secrets

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access Service Token Client ID | `abc123...` |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access Service Token Secret | `def456...` |
| `PRODUCTION_SSH_KEY` | SSH Private Key (개인키 전체 내용) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SERVER_USER` | 배포 서버 SSH 사용자명 | `deploy` |
| `DOCKER_USERNAME` | Docker Hub 사용자명 | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub Access Token | `dckr_pat_...` |

### 🟢 선택 Secrets

| Secret Name | 설명 | 기본값 |
|-------------|------|--------|
| `PRODUCTION_DEPLOY_PATH` | 배포 디렉토리 경로 | `/opt/ksenior` |
| `PRODUCTION_APP_URL` | 헬스체크 URL | (없음) |
| `SLACK_WEBHOOK_URL` | Slack 알림 Webhook URL | (없음) |

### Secrets 등록 예시

**CF_ACCESS_CLIENT_ID**:
```
Name: CF_ACCESS_CLIENT_ID
Value: abc123def456ghi789jkl
```

**CF_ACCESS_CLIENT_SECRET**:
```
Name: CF_ACCESS_CLIENT_SECRET
Value: xyz789uvw456rst123opq
```

**PRODUCTION_SSH_KEY**:
```
Name: PRODUCTION_SSH_KEY
Value:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(전체 개인키 내용 복사)
...
-----END OPENSSH PRIVATE KEY-----
```

**PRODUCTION_SERVER_USER**:
```
Name: PRODUCTION_SERVER_USER
Value: deploy
```

자세한 설정 가이드는 [SECRETS_SETUP.md](./SECRETS_SETUP.md)를 참조하세요.

---

## 워크플로우 상세

### 1. CI - Code Quality & Build (`ci.yml`)

#### 트리거
- Pull Request 생성/업데이트 (대상: develop, staging, master)
- Push to develop, staging, master 브랜치

#### Jobs

**1. quality-check**
- ESLint 실행
- TypeScript 타입 체크
- npm audit (보안 취약점)

**2. build-test**
- Next.js 빌드
- 빌드 아티팩트 크기 체크
- Standalone 빌드 검증

**3. docker-build-test**
- Docker 이미지 빌드 테스트
- 레지스트리 푸시 없이 빌드만 수행

**4. ci-summary**
- 전체 CI 상태 요약
- 실패 시 종료 코드 1 반환

#### 실행 예시
```bash
# develop 브랜치에 Push
git checkout develop
git add .
git commit -m "feat: Add new feature"
git push origin develop

# GitHub Actions에서 자동으로 CI 실행
```

---

### 2. PR - Pull Request Checks (`pr-checks.yml`)

#### 트리거
- Pull Request 생성/업데이트 (대상: develop, staging, master)
- Draft PR은 제외

#### Jobs

**1. pr-info**
- 변경된 파일 수, 추가/삭제 라인 수 분석
- 민감한 파일 감지 (.env, .key 등)
- 대용량 파일 감지 (>1MB)

**2. dependency-review**
- 의존성 변경 검토
- 취약점이 있는 라이브러리 감지
- GPL/AGPL 라이선스 체크

**3. impact-analysis**
- API 라우트 변경 감지
- Docker 설정 변경 감지
- 보안 관련 파일 변경 감지

**4. pr-size-labeling**
- PR 크기에 따른 자동 라벨링
  - XS: < 50 lines
  - S: 50-200 lines
  - M: 200-500 lines
  - L: 500-1000 lines
  - XL: > 1000 lines

---

### 3. CD - Production Deployment (`cd-production.yml`)

#### 트리거
- Push to master 브랜치
- 수동 실행 (workflow_dispatch)

#### Jobs

**1. build-and-push**
- Docker 이미지 빌드
- Docker Hub에 푸시
- 태그:
  - `master-{SHA}`
  - `production`
  - `latest`
  - `YYYYMMDD-HHmmss`
- Trivy 보안 스캔

**2. deploy-to-server**
- cloudflared 설치
- SSH 키 설정
- Cloudflare Access를 통한 SSH 연결
- Docker Compose로 배포:
  ```bash
  docker compose pull
  docker compose up -d --remove-orphans
  docker image prune -f
  ```
- 헬스체크

**3. notify-deployment**
- Slack 알림 (선택)
- 배포 요약 생성

**4. rollback** (실패 시)
- 이전 버전으로 롤백
- Docker Compose 재시작

#### 수동 배포 실행

1. GitHub → **Actions** 탭
2. **CD - Production Deployment** 선택
3. **Run workflow** 클릭
4. 브랜치: **master**
5. **Run workflow** 버튼 클릭

#### 배포 플로우

```
1. master 브랜치에 Push
   ↓
2. Docker 이미지 빌드 및 푸시
   ↓
3. Trivy 보안 스캔
   ↓
4. Cloudflare SSH Tunnel로 서버 접속
   ↓
5. Docker Compose로 배포
   ↓
6. 헬스체크
   ↓
7. Slack 알림 (선택)
```

---

## 문제 해결

### 문제 1: Self-Hosted Runner가 오프라인

**증상**:
```
No runner matching the label 'self-hosted, linux' is available
```

**해결**:
1. Runner 서버 상태 확인:
   ```bash
   sudo ./svc.sh status
   ```
2. Runner 재시작:
   ```bash
   sudo ./svc.sh stop
   sudo ./svc.sh start
   ```
3. GitHub Settings → Actions → Runners에서 상태 확인

---

### 문제 2: Cloudflare SSH 연결 실패

**증상**:
```
cloudflared: command not found
```
또는
```
Permission denied (publickey)
```

**해결**:

1. **cloudflared 설치 확인** (Runner 서버):
   ```bash
   cloudflared --version
   ```

2. **SSH 키 권한 확인**:
   ```bash
   chmod 600 ~/.ssh/id_ed25519
   ```

3. **Cloudflare Service Token 확인**:
   - `CF_ACCESS_CLIENT_ID`가 올바른지
   - `CF_ACCESS_CLIENT_SECRET`가 올바른지

4. **SSH 키 확인**:
   - `PRODUCTION_SSH_KEY`에 개인키 전체 내용이 포함되어 있는지
   - 개인키 형식이 올바른지 (BEGIN/END 포함)

5. **로컬 테스트**:
   ```bash
   ssh -i ~/.ssh/id_ed25519 \
     -o ProxyCommand="cloudflared access ssh --hostname ssh.askmebysms.com \
       --service-token-id $CF_ACCESS_CLIENT_ID \
       --service-token-secret $CF_ACCESS_CLIENT_SECRET" \
     deploy@ssh.askmebysms.com "echo 'Connection successful'"
   ```

---

### 문제 3: Docker 이미지 빌드 실패

**증상**:
```
ERROR [internal] load metadata for docker.io/library/node:20-alpine
```

**해결**:

1. **Docker Hub 로그인 확인**:
   - `DOCKER_USERNAME`이 올바른지
   - `DOCKER_PASSWORD`가 Access Token인지 (비밀번호 아님)

2. **네트워크 확인** (Runner 서버):
   ```bash
   docker pull node:20-alpine
   ```

3. **Docker Hub Rate Limit 확인**:
   ```bash
   # 로그인 상태 확인
   docker login
   ```

---

### 문제 4: 배포 후 컨테이너가 시작되지 않음

**증상**:
```
docker ps | grep ksenior-app
(no output)
```

**해결**:

1. **서버에서 로그 확인**:
   ```bash
   cd /opt/ksenior
   docker compose logs --tail=100 ksenior-app
   ```

2. **환경 변수 확인**:
   ```bash
   cat /opt/ksenior/.env
   # 모든 필수 환경 변수가 설정되어 있는지 확인
   ```

3. **이미지 Pull 확인**:
   ```bash
   docker compose pull
   docker images | grep ksenior
   ```

4. **수동 시작 테스트**:
   ```bash
   docker compose up -d
   docker compose ps
   ```

---

### 문제 5: 헬스체크 실패

**증상**:
```
Health check failed with status: 000
```

**해결**:

1. **PRODUCTION_APP_URL 확인**:
   - Secret에 올바른 URL이 설정되어 있는지
   - URL 형식: `https://your-domain.com` (끝에 슬래시 없음)

2. **애플리케이션 상태 확인**:
   ```bash
   # 서버에서 직접 테스트
   curl http://localhost:3000/api/health
   ```

3. **방화벽 확인**:
   - 외부에서 애플리케이션 접근 가능한지
   - Cloudflare 설정 확인

4. **헬스체크 스킵**:
   - `continue-on-error: true` 설정으로 인해 배포는 계속 진행됨
   - 수동으로 애플리케이션 상태 확인 필요

---

## 보안 권장사항

### Secrets 관리

- ✅ 정기적으로 SSH 키 교체 (6개월마다)
- ✅ Service Token 최소 권한 설정
- ✅ Docker Hub Access Token 사용 (비밀번호 사용 금지)
- ✅ Secrets 절대 로그에 출력하지 않기
- ❌ Secrets를 코드에 하드코딩 금지
- ❌ Secrets를 Slack/이메일로 공유 금지

### Self-Hosted Runner 보안

- ✅ Runner 서버 정기 업데이트
- ✅ 방화벽 설정으로 불필요한 포트 차단
- ✅ Runner를 격리된 환경에서 실행
- ❌ Public 저장소에서 self-hosted runner 사용 금지

### Cloudflare Access

- ✅ Service Token에 만료 시간 설정
- ✅ 접근 로그 정기 검토
- ✅ IP 화이트리스트 설정
- ❌ Service Token을 여러 서비스에서 재사용 금지

---

## 추가 리소스

- [SECRETS_SETUP.md](./SECRETS_SETUP.md) - Secrets 설정 상세 가이드
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Access SSH](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/use-cases/ssh/)
- [Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)

---

**문서 버전**: 3.0.0
**마지막 업데이트**: 2024-12-19
**변경사항**: Self-Hosted Runner 및 Cloudflare SSH Tunnel 배포 방식으로 전환

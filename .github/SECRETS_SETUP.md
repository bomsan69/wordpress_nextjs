# GitHub Secrets 설정 가이드

이 문서는 ksenior 프로젝트의 CI/CD 파이프라인 작동을 위해 필요한 모든 GitHub Secrets 설정 방법을 단계별로 안내합니다.

## 목차

1. [Secrets 설정 위치](#secrets-설정-위치)
2. [필수 Secrets 목록](#필수-secrets-목록)
3. [단계별 설정 가이드](#단계별-설정-가이드)
4. [검증 방법](#검증-방법)
5. [문제 해결](#문제-해결)

---

## Secrets 설정 위치

### Repository Secrets

1. GitHub 저장소 페이지로 이동
2. **Settings** 탭 클릭
3. 좌측 메뉴에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭

---

## 필수 Secrets 목록

### 우선순위별 분류

#### 🔴 필수 (즉시 설정 필요)

CI/CD 파이프라인 작동을 위해 반드시 필요한 Secrets입니다.

| Secret Name | 설명 | 예시 |
|-------------|------|------|
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access Service Token Client ID | `abc123def456...` |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access Service Token Secret | `xyz789uvw456...` |
| `PRODUCTION_SSH_KEY` | 프로덕션 서버 SSH Private Key (전체 내용) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_SERVER_USER` | 프로덕션 서버 SSH 사용자명 | `deploy` |
| `DOCKER_USERNAME` | Docker Hub 사용자명 | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub Access Token | `dckr_pat_...` |

#### 🟢 선택 (추가 기능)

선택적으로 설정할 수 있는 Secrets입니다.

| Secret Name | 설명 | 기본값 |
|-------------|------|--------|
| `PRODUCTION_DEPLOY_PATH` | 배포 디렉토리 경로 | `/opt/ksenior` |
| `PRODUCTION_APP_URL` | 헬스체크 URL | (없음) |
| `SLACK_WEBHOOK_URL` | Slack 배포 알림용 Webhook | (없음) |

---

## 단계별 설정 가이드

### 1. Cloudflare Access Service Token 생성

Cloudflare Access를 통한 SSH 접속을 위해 Service Token이 필요합니다.

#### 1-1. Cloudflare Zero Trust Dashboard 접속

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. **Zero Trust** 메뉴 클릭
3. **Access** → **Service Auth** 선택

#### 1-2. Service Token 생성

1. **Create Service Token** 버튼 클릭
2. Token Name 입력: `GitHub Actions - ksenior`
3. **Generate Token** 클릭
4. **즉시 복사** (다시 볼 수 없음!):
   - **Client ID**: `CF_ACCESS_CLIENT_ID`로 사용
   - **Client Secret**: `CF_ACCESS_CLIENT_SECRET`로 사용

#### 1-3. GitHub Secrets 등록

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

> ⚠️ **중요**: Service Token은 한 번만 표시되므로 반드시 즉시 복사하세요!

---

### 2. SSH Private Key 생성 및 설정

프로덕션 서버에 SSH 키 기반 인증으로 접속합니다.

#### 2-1. 프로덕션 서버에서 SSH 키 생성

프로덕션 서버에 SSH로 접속한 후:

```bash
# 배포용 사용자 생성 (이미 있다면 스킵)
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# deploy 사용자로 전환
sudo su - deploy

# SSH 키 생성
ssh-keygen -t ed25519 -C "github-actions@ksenior" -f ~/.ssh/id_ed25519 -N ""

# 공개키를 authorized_keys에 추가
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 개인키 출력 (GitHub Secret에 등록할 내용)
cat ~/.ssh/id_ed25519
```

#### 2-2. SSH Private Key 복사

`cat ~/.ssh/id_ed25519` 명령어의 출력을 **전체** 복사합니다:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBqL0K+...
...중간 내용...
...
-----END OPENSSH PRIVATE KEY-----
```

> ⚠️ **중요**:
> - `-----BEGIN OPENSSH PRIVATE KEY-----`부터
> - `-----END OPENSSH PRIVATE KEY-----`까지
> - **전체 내용을 정확히** 복사해야 합니다!

#### 2-3. GitHub Secret 등록

**PRODUCTION_SSH_KEY**:
```
Name: PRODUCTION_SSH_KEY
Value:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(전체 개인키 내용)
...
-----END OPENSSH PRIVATE KEY-----
```

**PRODUCTION_SERVER_USER**:
```
Name: PRODUCTION_SERVER_USER
Value: deploy
```

#### 2-4. SSH 키 로컬 테스트

로컬에서 Cloudflare SSH Tunnel을 통해 접속 테스트:

```bash
# cloudflared 설치 (macOS)
brew install cloudflare/cloudflare/cloudflared

# cloudflared 설치 (Linux)
curl -L -o cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# SSH 키를 로컬에 저장
echo "YOUR_PRIVATE_KEY_CONTENT" > ~/.ssh/ksenior_deploy
chmod 600 ~/.ssh/ksenior_deploy

# Cloudflare SSH Tunnel 연결 테스트
ssh -i ~/.ssh/ksenior_deploy \
  -o ProxyCommand="cloudflared access ssh --hostname ssh.askmebysms.com \
    --service-token-id YOUR_CLIENT_ID \
    --service-token-secret YOUR_CLIENT_SECRET" \
  deploy@ssh.askmebysms.com "echo 'Connection successful'"
```

성공 시 출력:
```
Connection successful
```

---

### 3. Docker Hub Secrets 설정

#### 3-1. Docker Hub Access Token 생성

1. [Docker Hub](https://hub.docker.com/) 로그인
2. 우측 상단 프로필 → **Account Settings** 클릭
3. 좌측 메뉴에서 **Security** 클릭
4. **New Access Token** 버튼 클릭
5. Access Token Description: `GitHub Actions ksenior`
6. Access Permissions: **Read, Write, Delete** 선택
7. **Generate** 클릭
8. **생성된 토큰을 즉시 복사** (다시 볼 수 없음!)

#### 3-2. GitHub Secrets 등록

**DOCKER_USERNAME**:
```
Name: DOCKER_USERNAME
Value: your-dockerhub-username
```
예시: `johndoe`

**DOCKER_PASSWORD**:
```
Name: DOCKER_PASSWORD
Value: dckr_pat_xxxxxxxxxxxxxxxxxxxxx
```
예시: `dckr_pat_1a2b3c4d5e6f7g8h9i0j`

> ⚠️ **주의**: Docker Hub 비밀번호가 아닌 **Access Token**을 사용하세요!

---

### 4. 프로덕션 서버 배포 환경 준비

#### 4-1. 배포 디렉토리 생성

프로덕션 서버에서:

```bash
# 배포 디렉토리 생성
sudo mkdir -p /opt/ksenior
sudo chown deploy:deploy /opt/ksenior

# 디렉토리 이동
cd /opt/ksenior
```

#### 4-2. docker-compose.yml 작성

`/opt/ksenior/docker-compose.yml`:

```yaml
version: '3.8'

services:
  ksenior-app:
    image: ${DOCKER_USERNAME}/ksenior-app:production
    container_name: ksenior-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    networks:
      - ksenior-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  ksenior-network:
    driver: bridge
```

#### 4-3. .env 파일 작성

`/opt/ksenior/.env`:

```bash
# Docker
DOCKER_USERNAME=your-dockerhub-username

# Application
ADMIN_ID=admin
ADMIN_PASSWORD_HASH=$2b$12$...your-bcrypt-hash...
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-wp-username
WORDPRESS_APP_PASSWORD=your-wp-app-password
EMAIL_API_URL=https://your-email-api.com
EMAIL_API_KEY=your-email-api-key
NOTIFICATION_EMAIL=admin@yourdomain.com
```

#### 4-4. Docker 및 Docker Compose 설치 확인

```bash
# Docker 버전 확인
docker --version
# Docker version 24.0.7, build afdd53b

# Docker Compose 버전 확인
docker-compose --version
# Docker Compose version v2.23.0

# Docker 권한 확인
docker ps
# 오류 없이 실행되어야 함

# 수동 배포 테스트
cd /opt/ksenior
docker compose pull
docker compose up -d
docker compose ps
```

---

### 5. 추가 Secrets 설정 (선택사항)

#### 5-1. 배포 경로 커스터마이징

기본값 `/opt/ksenior`가 아닌 다른 경로를 사용하는 경우:

**PRODUCTION_DEPLOY_PATH**:
```
Name: PRODUCTION_DEPLOY_PATH
Value: /home/deploy/ksenior
```

#### 5-2. 헬스체크 URL 설정

외부에서 접근 가능한 애플리케이션 URL이 있는 경우:

**PRODUCTION_APP_URL**:
```
Name: PRODUCTION_APP_URL
Value: https://kseniorusa.org
```

> 💡 헬스체크는 `{PRODUCTION_APP_URL}/api/health` 엔드포인트를 호출합니다.

---

### 6. Slack Notification 설정 (선택사항)

배포 완료 시 Slack으로 알림을 받고 싶은 경우:

#### 6-1. Slack Incoming Webhook 생성

1. Slack 워크스페이스에서 [Incoming Webhooks 앱](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) 페이지 접속
2. **Add to Slack** 버튼 클릭
3. 알림을 받을 채널 선택 (예: `#deployments`)
4. **Add Incoming WebHooks integration** 클릭
5. **Webhook URL** 복사
   - 형식: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

#### 6-2. GitHub Secret 등록

**SLACK_WEBHOOK_URL**:
```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

#### 6-3. Webhook 테스트

```bash
# curl로 테스트 메시지 전송
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from GitHub Actions setup"}' \
  YOUR_WEBHOOK_URL
```

Slack 채널에 메시지가 도착하면 성공!

---

## 검증 방법

### 1. Secrets 등록 확인

1. GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. 모든 필수 Secret이 목록에 표시되는지 확인:
   - ✅ `CF_ACCESS_CLIENT_ID`
   - ✅ `CF_ACCESS_CLIENT_SECRET`
   - ✅ `PRODUCTION_SSH_KEY`
   - ✅ `PRODUCTION_SERVER_USER`
   - ✅ `DOCKER_USERNAME`
   - ✅ `DOCKER_PASSWORD`

> 💡 Secret 값은 보안상 표시되지 않지만, 이름과 생성 날짜는 확인 가능합니다.

---

### 2. Self-Hosted Runner 확인

1. GitHub Repository → **Settings** → **Actions** → **Runners**
2. Runner 상태가 **Idle** (대기 중)인지 확인
3. Labels: `self-hosted`, `linux` 표시 확인

Runner가 없는 경우 [README.md](./README.md#self-hosted-runner-설정)를 참조하여 설치하세요.

---

### 3. CI/CD 워크플로우 테스트

#### 방법 1: 테스트 커밋 (권장)

```bash
# develop 브랜치에서 작은 변경 커밋
git checkout develop
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "test: Verify CI/CD setup"
git push origin develop
```

GitHub → **Actions** 탭에서:
- CI 워크플로우가 자동 실행되는지 확인
- 모든 Job이 성공 (🟢 초록색)하는지 확인

#### 방법 2: 수동 배포 테스트

```bash
# master 브랜치에서 배포 워크플로우 수동 실행
git checkout master
git push origin master
```

또는 GitHub UI에서:
1. **Actions** 탭
2. **CD - Production Deployment** 선택
3. **Run workflow** 클릭
4. 브랜치: `master` 선택
5. **Run workflow** 버튼 클릭

실행 결과:
- 🟢 초록색: 성공
- 🔴 빨간색: 실패 (로그 확인)

---

### 4. Cloudflare SSH 연결 테스트

워크플로우가 실패하면 SSH 연결부터 확인:

```bash
# cloudflared 설치 (macOS)
brew install cloudflare/cloudflare/cloudflared

# cloudflared 설치 (Linux)
curl -L -o cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# SSH 연결 테스트
ssh -i ~/.ssh/ksenior_deploy \
  -o ProxyCommand="cloudflared access ssh --hostname ssh.askmebysms.com \
    --service-token-id YOUR_CLIENT_ID \
    --service-token-secret YOUR_CLIENT_SECRET" \
  deploy@ssh.askmebysms.com "docker --version"
```

성공 시 Docker 버전이 출력됩니다.

---

### 5. 배포 후 애플리케이션 확인

```bash
# 프로덕션 서버에서 확인
ssh deploy@ssh.askmebysms.com  # (Cloudflare Tunnel 통해)
cd /opt/ksenior

# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs --tail=50 ksenior-app

# 헬스체크
curl http://localhost:3000/api/health
```

---

## 문제 해결

### 문제 1: "Secret not found" 에러

**증상**:
```
Error: Secret CF_ACCESS_CLIENT_ID not found
```

**원인**: Secret 이름 오타 또는 미등록

**해결**:
1. **Settings** → **Secrets and variables** → **Actions**에서 Secret 이름 확인
2. 대소문자 **정확히** 일치하는지 확인
3. 워크플로우 파일의 `${{ secrets.XXX }}` 확인

---

### 문제 2: SSH 연결 실패 (Permission denied)

**증상**:
```
Permission denied (publickey)
```

**원인**: SSH 키 설정 오류

**해결 체크리스트**:

1. **SSH Private Key 확인**:
   - `PRODUCTION_SSH_KEY`에 개인키 **전체 내용**이 포함되어 있는가?
   - `-----BEGIN OPENSSH PRIVATE KEY-----`부터 `-----END OPENSSH PRIVATE KEY-----`까지 모두 포함?
   - 줄바꿈이 정확히 유지되었는가?

2. **서버의 authorized_keys 확인**:
```bash
# 서버에서 확인
sudo su - deploy
cat ~/.ssh/authorized_keys
# 해당 공개키가 포함되어 있는지 확인

# 권한 확인
ls -la ~/.ssh
# drwx------ (700) ~/.ssh
# -rw------- (600) ~/.ssh/authorized_keys
```

3. **SSH 키 매칭 테스트**:
```bash
# 로컬에서 개인키로 공개키 생성
ssh-keygen -y -f ~/.ssh/ksenior_deploy

# 출력된 공개키가 서버의 authorized_keys와 일치하는지 확인
```

4. **SSH 로그 확인**:
```bash
# 서버에서 SSH 로그 확인
sudo tail -f /var/log/auth.log  # Ubuntu/Debian
sudo tail -f /var/log/secure    # CentOS/RHEL
```

---

### 문제 3: Cloudflare Access 인증 실패

**증상**:
```
cloudflared access: authentication failed
```

**원인**: Service Token 오류

**해결**:

1. **Service Token 확인**:
   - Cloudflare Zero Trust → Access → Service Auth에서 토큰 상태 확인
   - 토큰이 활성화되어 있는지 확인

2. **Secret 값 재확인**:
   - `CF_ACCESS_CLIENT_ID`가 정확한지
   - `CF_ACCESS_CLIENT_SECRET`가 정확한지
   - 복사 시 공백이나 특수문자가 추가되지 않았는지

3. **Service Token 재생성**:
   - Cloudflare에서 기존 토큰 삭제
   - 새 Service Token 생성
   - GitHub Secrets 업데이트

4. **Access Policy 확인**:
   - Cloudflare Zero Trust → Access → Applications
   - SSH 애플리케이션의 Policy에 Service Token이 허용되어 있는지 확인

---

### 문제 4: cloudflared 설치 실패

**증상**:
```
curl: (22) The requested URL returned error: 404
```

**원인**: cloudflared 다운로드 URL 변경

**해결**:

최신 릴리스 URL 확인:
```bash
# GitHub에서 최신 릴리스 확인
curl -s https://api.github.com/repos/cloudflare/cloudflared/releases/latest | \
  grep "browser_download_url.*linux-amd64.deb" | \
  cut -d '"' -f 4

# 또는 직접 설치
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

---

### 문제 5: Docker Hub Rate Limit

**증상**:
```
Error response from daemon: toomanyrequests: Too Many Requests
```

**원인**: Docker Hub Pull 제한 초과

**해결**:

1. **Docker Hub 로그인 확인**:
   - `DOCKER_PASSWORD`가 제대로 설정되었는지 확인
   - Access Token이 유효한지 확인

2. **로그인 단계 확인**:
   - 워크플로우 로그에서 "Login to Docker Hub" 단계가 성공했는지 확인

3. **GitHub Container Registry로 전환** (권장):

```yaml
# cd-production.yml 수정
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

# 이미지 이름 변경
images: ghcr.io/${{ github.repository_owner }}/ksenior-app
```

이 경우 `DOCKER_USERNAME`, `DOCKER_PASSWORD` Secret이 필요 없습니다.

---

### 문제 6: 배포 후 컨테이너가 시작되지 않음

**증상**:
```
docker ps | grep ksenior-app
(no output)
```

**원인**: 환경 변수 오류 또는 이미지 문제

**해결**:

1. **로그 확인**:
```bash
cd /opt/ksenior
docker compose logs --tail=100 ksenior-app
```

2. **환경 변수 확인**:
```bash
cat /opt/ksenior/.env
# 모든 필수 환경 변수가 설정되어 있는지 확인
```

3. **이미지 확인**:
```bash
docker images | grep ksenior
# 최신 이미지가 Pull되었는지 확인

docker compose pull
# 최신 이미지 강제 Pull
```

4. **수동 시작**:
```bash
docker compose down
docker compose up -d
docker compose ps
```

5. **컨테이너 내부 확인**:
```bash
docker compose exec ksenior-app sh
# 또는
docker compose logs -f ksenior-app
```

---

### 문제 7: Slack 알림 미수신

**증상**: 배포는 성공했지만 Slack 알림이 안 옴

**원인**: Webhook URL 오류 또는 조건 미충족

**해결**:

1. **Webhook URL 테스트**:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from command line"}' \
  YOUR_WEBHOOK_URL
```

2. **Secret 확인**:
   - `SLACK_WEBHOOK_URL`이 정확히 등록되었는지
   - URL이 `https://hooks.slack.com/services/`로 시작하는지

3. **워크플로우 조건 확인**:
```yaml
if: secrets.SLACK_WEBHOOK_URL != ''
```
Secret이 비어있으면 알림 단계가 스킵됩니다.

4. **워크플로우 로그 확인**:
   - notify-deployment job이 실행되었는지
   - Slack notification 단계가 성공했는지

---

## Secrets 보안 권장사항

### DO (해야 할 것)

- ✅ 정기적으로 Service Token 교체 (6개월마다)
- ✅ SSH 키 정기 교체 (6개월마다)
- ✅ Docker Hub Access Token 사용 (비밀번호 사용 금지)
- ✅ 최소 권한 원칙 적용 (deploy 전용 계정 사용)
- ✅ Secrets 값 변경 시 즉시 GitHub에서도 업데이트
- ✅ 팀원 퇴사 시 모든 관련 Secrets 즉시 교체
- ✅ SSH Private Key를 안전하게 보관 (암호화된 저장소)

### DON'T (하지 말아야 할 것)

- ❌ Secrets를 코드나 로그에 출력
- ❌ 여러 프로젝트에서 동일한 SSH 키 재사용
- ❌ root 계정으로 배포
- ❌ Secrets를 Slack이나 이메일로 공유
- ❌ SSH Private Key를 평문으로 Slack/이메일 전송
- ❌ Public 저장소에 Secrets 노출

---

## Secrets 설정 체크리스트

배포 전 최종 확인:

### 필수 항목 (Production 배포)

- [ ] `CF_ACCESS_CLIENT_ID` 등록됨
- [ ] `CF_ACCESS_CLIENT_SECRET` 등록됨
- [ ] `PRODUCTION_SSH_KEY` 등록됨 (전체 내용)
- [ ] `PRODUCTION_SERVER_USER` 등록됨
- [ ] `DOCKER_USERNAME` 등록됨
- [ ] `DOCKER_PASSWORD` 등록됨 (Access Token)
- [ ] Cloudflare SSH Tunnel 연결 테스트 성공
- [ ] 서버에 Docker 및 Docker Compose 설치됨
- [ ] 서버에 배포 디렉토리 생성됨 (`/opt/ksenior`)
- [ ] 서버에 `docker-compose.yml` 및 `.env` 파일 배치됨
- [ ] Self-Hosted Runner 설치 및 Idle 상태 확인

### 추가 기능

- [ ] `PRODUCTION_DEPLOY_PATH` 등록됨 (기본값 변경 시)
- [ ] `PRODUCTION_APP_URL` 등록됨 (헬스체크 원하는 경우)
- [ ] `SLACK_WEBHOOK_URL` 등록됨 (알림 원하는 경우)
- [ ] Slack 채널에서 테스트 메시지 수신 확인
- [ ] GitHub Environment 설정 (승인 프로세스 필요 시)

---

## 요약: 10분 빠른 설정

최소한의 설정으로 빠르게 시작하려면:

### 1단계: Cloudflare Service Token (2분)
1. Cloudflare Zero Trust → Access → Service Auth
2. Create Service Token
3. GitHub Secrets에 `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` 등록

### 2단계: SSH 키 생성 (3분)
```bash
# 서버에서 실행
sudo su - deploy
ssh-keygen -t ed25519 -C "github-actions@ksenior" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/id_ed25519  # GitHub Secret에 등록
```

### 3단계: Docker Hub (2분)
1. Docker Hub → Account Settings → Security
2. New Access Token 생성
3. GitHub Secrets에 `DOCKER_USERNAME`, `DOCKER_PASSWORD` 등록

### 4단계: GitHub Secrets (2분)
- `PRODUCTION_SSH_KEY`: 서버에서 복사한 개인키
- `PRODUCTION_SERVER_USER`: `deploy`

### 5단계: Self-Hosted Runner 설치 (1분)
- GitHub Repository → Settings → Actions → Runners
- New self-hosted runner 안내에 따라 설치

### 테스트
```bash
git checkout master
git commit --allow-empty -m "test: CI/CD setup"
git push origin master
```

GitHub Actions 탭에서 배포 진행 상황 확인!

---

## 추가 지원

- 📖 상세 가이드: [.github/README.md](./README.md)
- 🔒 Cloudflare Access: [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- 🐳 Docker Hub: [Docker Hub Security Settings](https://hub.docker.com/settings/security)
- 🐛 문제 발생 시: GitHub Issues 생성
- 💬 문의: DevOps 팀 또는 프로젝트 관리자

---

**문서 버전**: 3.0.0
**마지막 업데이트**: 2024-12-19
**변경사항**: Cloudflare SSH Tunnel 및 SSH Key 기반 인증으로 전환, Self-Hosted Runner 지원

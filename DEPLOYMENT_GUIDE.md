# 배포 가이드

## 🚀 Docker 배포

### 1. 환경 변수 설정

배포 전 `.env` 파일을 생성하거나 `docker-compose.yml`에 환경 변수를 설정하세요.

**중요**: 프로덕션 환경에서는 반드시 새로운 credentials를 사용하세요!

```bash
# .env 파일 생성
cat > .env << EOF
# 로그인 정보
ADMIN_ID=kseniorusa
ADMIN_PASSWORD_HASH=\$2b\$12\$XCGJUiSeAlz8JrIXtTrH6.sEmd19pjHMdI.9hZ7o95yHnyWJHNiM6

# WordPress 연동
WORDPRESS_URL=https://kseniorusa.org
WORDPRESS_USERNAME=bomsan
WORDPRESS_APP_PASSWORD=새로운_앱_비밀번호_재발급_필요

# Email API
EMAIL_API_URL=https://apisvr.boranet.net:3300/api/v2/send
EMAIL_API_KEY=새로운_API_키_재발급_필요

# Email 수신자
NOTIFICATION_EMAIL=bomsan69@gmail.com

# Node 환경
NODE_ENV=production
EOF

chmod 600 .env
```

### 2. Docker 이미지 빌드

```bash
# 이미지 빌드
docker build -t ksenior:latest .

# 빌드 확인
docker images | grep ksenior
```

### 3. Docker Compose로 실행

**docker-compose.yml:**
```yaml
services:
  ksenior:
    image: ksenior:latest
    container_name: ksenior-app
    ports:
      - "8003:8003"
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - ksenior-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8003', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  ksenior-network:
    driver: bridge
```

```bash
# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

### 4. 단독 Docker 실행

```bash
# 컨테이너 실행
docker run -d \
  --name ksenior-app \
  -p 8003:8003 \
  --env-file .env \
  --restart unless-stopped \
  ksenior:latest

# 로그 확인
docker logs -f ksenior-app

# 컨테이너 중지
docker stop ksenior-app

# 컨테이너 제거
docker rm ksenior-app
```

---

## 🔧 프로덕션 체크리스트

### 배포 전 확인사항

#### 1. 보안 Credentials 재발급 ⚠️

**필수**: 다음 credentials가 소스코드에 노출되었으므로 반드시 재발급하세요!

- [ ] **WordPress Application Password** 재발급
  - 위치: WordPress Admin → Users → Profile → Application Passwords
  - 이전: `0eZE wgkM 3gYV Pbqt D5yX uJaN` (노출됨)
  - 새 비밀번호로 `.env` 업데이트

- [ ] **Email API Key** 재발급
  - Bora Net 담당자에게 연락
  - 이전: `d91f0a72929403aee77799434c9a0fd230e681ff0bb095d3dc556393ab752c50` (노출됨)
  - 새 API 키로 `.env` 업데이트

- [ ] **Admin Password** 변경 (선택사항)
  - 더 강력한 비밀번호 사용 권장
  - `node scripts/generate-password-hash.js "새비밀번호"`
  - 생성된 해시를 `.env`에 적용

#### 2. 환경 변수

- [ ] `.env` 파일 생성 완료
- [ ] 모든 필수 환경 변수 설정 확인
- [ ] 파일 권한 600으로 설정 (`chmod 600 .env`)
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인

#### 3. Docker 빌드

- [ ] Docker 이미지 빌드 성공
- [ ] 이미지 크기 확인 (최적화 필요시)
- [ ] Multi-stage 빌드로 최종 이미지 크기 최소화 확인

#### 4. 네트워크 및 포트

- [ ] 포트 8003이 사용 가능한지 확인
- [ ] 방화벽 설정 (필요시)
- [ ] HTTPS 리버스 프록시 설정 (Nginx/Caddy)

#### 5. 보안 설정

- [ ] HTTPS 강제 활성화 (프로덕션)
- [ ] 보안 헤더 적용 확인 (next.config.mjs)
- [ ] CORS 설정 확인
- [ ] 로그 레벨 적절히 설정

---

## 🌐 Nginx 리버스 프록시 설정 (권장)

### 설정 예시

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 인증서 설정
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 보안 헤더 (Next.js에서도 설정되지만 이중 방어)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 프록시 설정
    location / {
        proxy_pass http://localhost:8003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 정적 파일 캐싱
    location /_next/static {
        proxy_pass http://localhost:8003;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 로그
    access_log /var/log/nginx/ksenior-access.log;
    error_log /var/log/nginx/ksenior-error.log;
}
```

---

## 📊 모니터링 및 로그

### Docker 로그 확인

```bash
# 실시간 로그 보기
docker logs -f ksenior-app

# 최근 100줄
docker logs --tail 100 ksenior-app

# 타임스탬프 포함
docker logs -t ksenior-app
```

### 로그 로테이션 설정

```bash
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Docker 재시작
sudo systemctl restart docker
```

### Health Check

```bash
# 컨테이너 헬스 체크 상태
docker inspect --format='{{.State.Health.Status}}' ksenior-app

# 헬스 체크 로그
docker inspect --format='{{json .State.Health}}' ksenior-app | jq
```

---

## 🔄 업데이트 및 재배포

### 코드 업데이트 시

```bash
# 1. 최신 코드 pull
git pull origin main

# 2. 의존성 업데이트 (필요시)
npm install

# 3. 로컬 빌드 테스트
npm run build

# 4. Docker 이미지 재빌드
docker build -t ksenior:latest .

# 5. 기존 컨테이너 중지 및 제거
docker-compose down

# 6. 새 컨테이너 시작
docker-compose up -d

# 7. 로그 확인
docker-compose logs -f
```

### 무중단 배포 (Blue-Green)

```bash
# 1. 새 이미지 빌드
docker build -t ksenior:v2 .

# 2. 새 컨테이너 시작 (다른 포트)
docker run -d \
  --name ksenior-app-v2 \
  -p 8004:8003 \
  --env-file .env \
  ksenior:v2

# 3. 헬스 체크
curl http://localhost:8004/login

# 4. Nginx에서 포트 전환 (8003 → 8004)

# 5. 이전 컨테이너 중지
docker stop ksenior-app
docker rm ksenior-app
```

---

## 🐛 트러블슈팅

### 컨테이너가 시작하지 않음

```bash
# 로그 확인
docker logs ksenior-app

# 일반적인 원인:
# - 환경 변수 누락
# - 포트 충돌 (8003 이미 사용 중)
# - 잘못된 .env 파일 형식
```

### 로그인 불가

```bash
# 환경 변수 확인
docker exec ksenior-app printenv | grep ADMIN

# 비밀번호 해시 재생성
node scripts/generate-password-hash.js "your-password"

# .env 업데이트 후 컨테이너 재시작
docker-compose restart
```

### WordPress 연동 실패

```bash
# 네트워크 확인
docker exec ksenior-app ping kseniorusa.org

# 환경 변수 확인
docker exec ksenior-app printenv | grep WORDPRESS

# Application Password 재발급 필요 여부 확인
```

### 메모리 부족

```bash
# 메모리 사용량 확인
docker stats ksenior-app

# 메모리 제한 설정 (docker-compose.yml)
services:
  ksenior:
    mem_limit: 512m
    mem_reservation: 256m
```

---

## 📈 성능 최적화

### 1. Next.js 최적화

```javascript
// next.config.mjs
const nextConfig = {
  // ... existing config

  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // 압축 활성화
  compress: true,

  // 프로덕션 소스맵 비활성화 (이미 적용됨)
  productionBrowserSourceMaps: false,
};
```

### 2. Docker 이미지 최적화

```dockerfile
# .dockerignore 확인
node_modules
.next
.git
.env*
*.md
```

### 3. 캐싱 전략

- Nginx에서 정적 파일 캐싱
- CDN 사용 고려 (Cloudflare, AWS CloudFront)
- Redis 세션 저장소 (현재 in-memory에서 업그레이드)

---

## 🔐 보안 강화 (추가 권장사항)

### 1. 자동 백업 설정

```bash
# 일일 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d)
docker exec ksenior-app node -e "console.log('App running')" > /backup/healthcheck-$DATE.log
# 데이터베이스 백업 (해당되는 경우)
```

### 2. 모니터링 설정

- **Sentry**: 에러 트래킹
- **Datadog/New Relic**: 성능 모니터링
- **Uptime Robot**: 가동 시간 모니터링

### 3. 보안 업데이트

```bash
# 정기적으로 의존성 업데이트
npm audit
npm update

# Docker 이미지 재빌드
docker build -t ksenior:latest .
```

---

## ✅ 배포 완료 체크리스트

- [ ] 모든 credentials 재발급 완료
- [ ] .env 파일 설정 완료
- [ ] Docker 빌드 성공
- [ ] 컨테이너 정상 실행 확인
- [ ] 로그인 테스트 완료
- [ ] 포스트 생성/수정/삭제 테스트
- [ ] 파일 업로드 테스트
- [ ] 이메일 발송 테스트
- [ ] HTTPS 설정 완료 (프로덕션)
- [ ] 보안 헤더 적용 확인
- [ ] 모니터링 설정 완료
- [ ] 백업 시스템 구축

---

**작성일**: 2025-12-07
**버전**: 1.0.0

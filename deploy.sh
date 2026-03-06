#!/bin/bash
# ==============================================================
# deploy.sh - 원커맨드 배포 스크립트
# ==============================================================
# 사용법:
#   ./deploy.sh                                              # 전체 스택 시작만
#   ./deploy.sh --pg-dump anzu_backup.backup                 # DB 복구 포함
#   ./deploy.sh --pg-dump anzu_backup.backup \
#               --redis-dump redis_backup.rdb                # DB + Redis 복구
#
# 옵션:
#   --pg-dump   <파일명>   docker/dumps/ 안의 PostgreSQL 덤프 파일명
#   --redis-dump <파일명>  docker/dumps/ 안의 Redis RDB 파일명
#   --build                app 이미지를 새로 빌드
# ==============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PG_DUMP=""
REDIS_DUMP=""
DO_BUILD=false

# ── 인자 파싱 ──────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pg-dump)    PG_DUMP="$2";    shift 2 ;;
    --redis-dump) REDIS_DUMP="$2"; shift 2 ;;
    --build)      DO_BUILD=true;   shift   ;;
    *) echo "❌ 알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

echo "=========================================="
echo "  Anzu Info 배포 시작"
echo "=========================================="

# ── 0. 환경설정 로드 (.env) ──────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# ── 1. 이미지 빌드 (옵션) ─────────────────────────────────────
if $DO_BUILD; then
  echo "🔨 [1/5] app 이미지 빌드..."
  docker compose build app
else
  echo "⏭️  [1/5] 빌드 생략 (--build 옵션 없음)"
fi

# ── 2. DB / Redis 먼저 기동 ───────────────────────────────────
echo "🚀 [2/5] postgres, redis 기동..."
docker compose up -d postgres redis jenkins

echo "⏳  postgres healthy 대기..."
until docker exec anzu-postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" > /dev/null 2>&1; do
  sleep 2
done
echo "✅  postgres 준비 완료"

# ── 3. dump 복구 ────────────────────────────────────────────────
if [ -n "$PG_DUMP" ]; then
  echo "📦 [3/5] PostgreSQL 덤프 복구: $PG_DUMP"
  bash "$SCRIPT_DIR/docker/restore.sh" "$PG_DUMP"
else
  echo "⏭️  [3/5] PostgreSQL 복구 생략"
fi

if [ -n "$REDIS_DUMP" ]; then
  echo "📦       Redis 덤프 복구: $REDIS_DUMP"
  bash "$SCRIPT_DIR/docker/restore.sh" "$REDIS_DUMP"
else
  echo "⏭️        Redis 복구 생략"
fi

# ── 4. app & nginx 기동 ──────────────────────────────────────────
echo "🚀 [4/5] app, nginx 기동..."
docker compose up -d app nginx

echo "⏳  app 부팅 대기 (10초)..."
sleep 10

# ── 5. Prisma migrate (app 내부에서 실행) ───────────────────────
echo "🔄 [5/5] Prisma migrate deploy..."
MIGRATIONS_DIR="$SCRIPT_DIR/prisma/migrations"
if [ -d "$MIGRATIONS_DIR" ]; then
  INIT_DIR=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d -name "*_init" | head -1)
  if [ -n "$INIT_DIR" ] && [ -n "$PG_DUMP" ]; then
    INIT_NAME=$(basename "$INIT_DIR")
    echo "🔄  [Prisma] migration 히스토리 초기화 (덤프 복구 대응)..."
    docker exec anzu-postgres bash -c "psql -U postgres -d postgres -c 'TRUNCATE _prisma_migrations;'" 2>/dev/null || true
    echo "🔄  [Prisma] baseline migration 적용: $INIT_NAME"
    docker compose exec app npx prisma migrate resolve --applied "$INIT_NAME" || true
  fi
fi

docker compose exec app npx prisma migrate deploy

echo ""
echo "=========================================="
echo "  ✅  배포 완료!"
echo "  App  → http://localhost:3000"
echo "  Jenkins → http://localhost:8080"
echo "=========================================="

#!/bin/bash
# ==============================================================
# restore.sh - PostgreSQL 및 Redis 덤프 복구 스크립트
# ==============================================================
# 사용법:
#   bash docker/restore.sh <덤프파일명>
#
# 지원 포맷:
#   *.backup / *.dump  → pg_restore (PostgreSQL custom-format)
#   *.sql              → psql       (PostgreSQL plain SQL)
#   *.rdb              → Redis RDB  (컨테이너 재시작 방식)
#
# 예시:
#   bash docker/restore.sh anzu_backup.backup
#   bash docker/restore.sh redis_backup.rdb
# ==============================================================

set -e

DUMP_FILE="$1"
PG_CONTAINER="anzu-postgres"
REDIS_CONTAINER="anzu-redis"
DB_USER="postgres"
DB_NAME="postgres"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DUMPS_DIR="$SCRIPT_DIR/dumps"

if [ -z "$DUMP_FILE" ]; then
  echo "❌  덤프 파일명을 인자로 전달해주세요."
  echo "    사용법: bash docker/restore.sh <덤프파일명>"
  exit 1
fi

FULL_PATH="$DUMPS_DIR/$DUMP_FILE"

if [ ! -f "$FULL_PATH" ]; then
  echo "❌  파일을 찾을 수 없습니다: $FULL_PATH"
  echo "    docker/dumps/ 디렉토리에 덤프 파일이 있는지 확인해주세요."
  exit 1
fi

EXT="${DUMP_FILE##*.}"

# ──────────────────────────────────────────
# Redis RDB 복구
# ──────────────────────────────────────────
if [ "$EXT" = "rdb" ]; then
  echo "🔄  [Redis] RDB 복구를 시작합니다..."

  docker stop "$REDIS_CONTAINER" 2>/dev/null || true

  echo "📦  [Redis] RDB 파일을 볼륨에 복사합니다..."
  TEMP_CONTAINER="redis-cp-temp-$$"
  docker run -d --name "$TEMP_CONTAINER" \
    -v anzuinfo-porable-be_redis_data:/data \
    alpine tail -f /dev/null

  docker cp "$FULL_PATH" "${TEMP_CONTAINER}:/data/dump.rdb"
  docker rm -f "$TEMP_CONTAINER"

  echo "🚀  [Redis] 컨테이너를 재시작합니다..."
  docker start "$REDIS_CONTAINER"
  echo "✅  [Redis] 복구 완료!"
  exit 0
fi

# ──────────────────────────────────────────
# PostgreSQL 복구
# ──────────────────────────────────────────
echo "📦  [Postgres] 덤프 파일을 컨테이너로 복사합니다..."
docker cp "$FULL_PATH" "$PG_CONTAINER:/tmp/$DUMP_FILE"

echo "🔄  [Postgres] public 스키마 초기화 (DROP CASCADE)..."
docker exec "$PG_CONTAINER" bash -c \
  "psql -U $DB_USER -d $DB_NAME -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $DB_USER;'"

echo "🔄  [Postgres] 복구를 시작합니다 (DB: $DB_NAME, User: $DB_USER)..."
if [ "$EXT" = "sql" ]; then
  docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f "/tmp/$DUMP_FILE"
else
  docker exec -i "$PG_CONTAINER" pg_restore \
    --no-owner \
    --role="$DB_USER" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    "/tmp/$DUMP_FILE"
fi
echo "✅  [Postgres] 복구 완료!"

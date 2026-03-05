param(
    [string]$PgDump    = "",
    [string]$RedisDump = "",
    [switch]$Build
)
# ==============================================================
# deploy.ps1 - Windows 원커맨드 배포 스크립트
# ==============================================================
# 사용법:
#   .\deploy.ps1                                          # 전체 스택 시작만
#   .\deploy.ps1 -PgDump anzu_backup.backup               # DB 복구 포함
#   .\deploy.ps1 -PgDump anzu_backup.backup `
#                -RedisDump redis_backup.rdb              # DB + Redis 복구
#   .\deploy.ps1 -Build                                   # 이미지 새로 빌드
# ==============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Anzu Info 배포 시작" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ── 1. 이미지 빌드 (옵션) ─────────────────────────────────────
if ($Build) {
    Write-Host "[1/5] app 이미지 빌드..." -ForegroundColor Yellow
    docker compose build app
} else {
    Write-Host "[1/5] 빌드 생략 (-Build 없음)" -ForegroundColor Gray
}

# ── 2. DB / Redis / Jenkins 먼저 기동 ────────────────────────
Write-Host "[2/5] postgres, redis, jenkins 기동..." -ForegroundColor Yellow
docker compose up -d postgres redis jenkins

Write-Host "  postgres healthy 대기..." -ForegroundColor Gray
$PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$PgDb   = if ($env:POSTGRES_DB)   { $env:POSTGRES_DB }   else { "postgres" }

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    $result = docker exec anzu-postgres pg_isready -U $PgUser -d $PgDb 2>&1
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ready) { Write-Error "postgres 기동 실패"; exit 1 }
Write-Host "  postgres 준비 완료" -ForegroundColor Green

# ── 3. dump 복구 ────────────────────────────────────────────────
if ($PgDump) {
    Write-Host "[3/5] PostgreSQL 덤프 복구: $PgDump" -ForegroundColor Yellow
    & "$ScriptDir\docker\restore.ps1" -DumpFile $PgDump
} else {
    Write-Host "[3/5] PostgreSQL 복구 생략" -ForegroundColor Gray
}

if ($RedisDump) {
    Write-Host "      Redis 덤프 복구: $RedisDump" -ForegroundColor Yellow
    & "$ScriptDir\docker\restore.ps1" -DumpFile $RedisDump
} else {
    Write-Host "      Redis 복구 생략" -ForegroundColor Gray
}

# ── 4. app & nginx 기동 ──────────────────────────────────────────
Write-Host "[4/5] app, nginx 기동..." -ForegroundColor Yellow
docker compose up -d app nginx

Write-Host "  app 부팅 대기 (10초)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# ── 5. Prisma migrate ────────────────────────────────────────────
Write-Host "[5/5] Prisma migrate deploy..." -ForegroundColor Yellow
docker exec anzu-info npx prisma migrate deploy

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  배포 완료!" -ForegroundColor Green
Write-Host "  App     -> http://localhost:3000" -ForegroundColor Green
Write-Host "  Jenkins -> http://localhost:8080" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

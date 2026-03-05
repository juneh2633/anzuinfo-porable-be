param(
    [Parameter(Mandatory=$true)]
    [string]$DumpFile
)

$PgContainer    = "anzu-postgres"
$RedisContainer = "anzu-redis"
$DbUser         = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$DbName         = if ($env:POSTGRES_DB)   { $env:POSTGRES_DB }   else { "postgres" }
$DumpsDir       = Join-Path $PSScriptRoot "dumps"
$FullPath       = Join-Path $DumpsDir $DumpFile

if (-not (Test-Path $FullPath)) {
    Write-Error "File not found: $FullPath"
    exit 1
}

$Ext = [System.IO.Path]::GetExtension($DumpFile).TrimStart(".")

# Redis RDB restore
if ($Ext -eq "rdb") {
    Write-Host "[Redis] Stopping container..."
    docker stop $RedisContainer 2>$null

    Write-Host "[Redis] Copying RDB to volume via temp container..."
    docker run --rm `
        -v "anzuinfo-porable-be_redis_data:/data" `
        alpine sh -c "rm -f /data/dump.rdb"

    $TempContainer = "redis-cp-temp"
    docker run -d --name $TempContainer `
        -v "anzuinfo-porable-be_redis_data:/data" `
        alpine tail -f /dev/null | Out-Null

    docker cp "$FullPath" "${TempContainer}:/data/dump.rdb"
    docker rm -f $TempContainer | Out-Null

    Write-Host "[Redis] Restarting container..."
    docker start $RedisContainer
    Write-Host "[Redis] Done."
    exit 0
}

# PostgreSQL restore
Write-Host "[Postgres] Copying dump to container..."
docker cp "$FullPath" "${PgContainer}:/tmp/${DumpFile}"

Write-Host "[Postgres] Dropping and recreating public schema..."
docker exec $PgContainer bash -c "psql -U $DbUser -d $DbName -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $DbUser;'"

Write-Host "[Postgres] Restoring DB: $DbName (user: $DbUser)..."
if ($Ext -eq "sql") {
    docker exec -i $PgContainer psql -U $DbUser -d $DbName -f "/tmp/$DumpFile"
} else {
    docker exec -i $PgContainer pg_restore `
        --no-owner `
        "--role=$DbUser" `
        -U $DbUser `
        -d $DbName `
        "/tmp/$DumpFile"
}

Write-Host "[Postgres] Done."

# Prisma: migration 폴더가 있을 때만 처리
$MigrationsDir = Join-Path (Join-Path $PSScriptRoot "..") "prisma\migrations"
if (Test-Path $MigrationsDir) {
    $InitDir = Get-ChildItem $MigrationsDir -Directory | Where-Object { $_.Name -match "_init$" } | Select-Object -First 1
    if ($InitDir) {
        Write-Host "[Prisma] Resetting migration history..."
        docker exec $PgContainer bash -c "psql -U $DbUser -d $DbName -c 'TRUNCATE _prisma_migrations;'"
        Write-Host "[Prisma] Marking baseline migration as applied: $($InitDir.Name)"
        npx prisma migrate resolve --applied $InitDir.Name
        Write-Host "[Prisma] Done."
    } else {
        Write-Host "[Prisma] No 'init' migration found. Run 'npx prisma migrate dev --name init' first."
    }
} else {
    Write-Host "[Prisma] No migrations folder found. Run 'npx prisma migrate dev --name init' first."
}

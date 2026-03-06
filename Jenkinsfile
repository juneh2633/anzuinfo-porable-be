pipeline {
    agent any

    environment {
        APP_NAME    = 'anzu-info'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    triggers {
        githubPush() // GitHub webhook 전용 (폴링 제거)
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh """
                    /usr/bin/docker compose -f ${COMPOSE_FILE} build app
                """
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'anzu-production-env', variable: 'ENV_FILE')]) {
                    sh """
                        set -euo pipefail
                        cp "\$ENV_FILE" \$WORKSPACE/.env
                        chmod 600 \$WORKSPACE/.env
                    """
                }
                
                sh """
                    set -euo pipefail
                    # app, nginx 컨테이너만 재시작 (DB/Redis 유지)
                    /usr/bin/docker compose -f ${COMPOSE_FILE} up -d --no-deps --force-recreate app nginx
                """
            }
            post {
                always {
                    sh 'rm -f $WORKSPACE/.env || true'
                }
            }
        }

        stage('Prisma Migrate') {
            steps {
                sh """
                    set -euo pipefail
                    
                    # app 컨테이너 내부 서비스가 준비될 때까지 대기
                    until /usr/bin/docker compose -f ${COMPOSE_FILE} exec -T app npx prisma -v >/dev/null 2>&1; do
                      sleep 2
                    done

                    # 컨테이너 종속성을 벗어나 compose exec 로 실행, 실패 시 배포 중단
                    /usr/bin/docker compose -f ${COMPOSE_FILE} exec -T app npx prisma migrate deploy
                """
            }
        }

        stage('Cache Init') {
            steps {
                // Jenkins Credentials(Username with password)에서 관리자 ID/PW 가져와서 환경변수에 세팅
                withCredentials([usernamePassword(credentialsId: 'anzu-admin-credential', passwordVariable: 'ADMIN_PW', usernameVariable: 'ADMIN_ID')]) {
                    sh '''
                        set -euo pipefail
                        set +x  # 로그에 민감정보 안 찍히게

                        # 서버 뜰 때까지 대기(timeout 실패 처리 포함)
                        READY=0
                        for i in $(seq 1 20); do
                          if curl -fsS http://localhost:3000/chart/version >/dev/null 2>&1; then
                            READY=1
                            break
                          fi
                          sleep 2
                        done

                        if [ "$READY" -ne 1 ]; then
                          echo "ERROR: app not ready (timeout)"
                          exit 1
                        fi

                        TOKEN=$(curl -fsS -X POST http://localhost:3000/auth/login \
                            -H "Content-Type: application/json" \
                            -d "{\\"id\\":\\"${ADMIN_ID}\\",\\"pw\\":\\"${ADMIN_PW}\\"}" \
                            | jq -r '.accessToken')
                        
                        if [ -z "$TOKEN" ]; then
                          echo "ERROR: login failed (no token)"
                          exit 1
                        fi

                        curl -fsS -H "Authorization: Bearer $TOKEN" http://localhost:3000/chart/cache >/dev/null
                        curl -fsS -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/chart/meta >/dev/null
                        echo "Cache init complete"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ 배포 성공!'
        }
        failure {
            echo '❌ 배포 실패. 로그를 확인해주세요.'
        }
    }
}

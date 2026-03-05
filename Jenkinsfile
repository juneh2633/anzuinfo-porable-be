pipeline {
    agent any

    environment {
        APP_NAME    = 'anzu-info'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    triggers {
        // GitHub webhook 또는 SCM 폴링 (1분)
        pollSCM('* * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose -f ${COMPOSE_FILE} build app'
            }
        }

        stage('Deploy') {
            steps {
                // app, nginx 컨테이너만 재시작 (DB/Redis 유지)
                sh 'docker compose -f ${COMPOSE_FILE} up -d --no-deps --force-recreate app nginx'
            }
        }

        stage('Prisma Migrate') {
            steps {
                // 컨테이너 기동 대기
                sh 'sleep 5'
                sh 'docker exec ${APP_NAME} npx prisma migrate deploy || true'
            }
        }

        stage('Cache Init') {
            steps {
                // chart 캐시 & 메타 데이터 재빌드
                sh '''
                    sleep 3
                    TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
                        -H "Content-Type: application/json" \
                        -d "{\\"id\\":\\"${ADMIN_ID}\\",\\"pw\\":\\"${ADMIN_PW}\\"}" \
                        | python3 -c "import sys,json; print(json.load(sys.stdin).get(\'accessToken\',\'\'))")
                    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/chart/cache
                    curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/chart/meta
                    echo "Cache init complete"
                '''
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

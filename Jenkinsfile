pipeline {
    agent any
 
    environment {
        APP_NAME = 'anzu-info'
        COMPOSE_FILE = 'docker-compose.yml'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        REGISTRY = 'ghcr.io'
        // GitHub Username and Image Name
        GITHUB_USER = 'juneh2633'
        IMAGE_NAME = "ghcr.io/${GITHUB_USER}/anzu-info"
        
        // --- PRODUCTION DEPLOYMENT VARIABLES ---
        // Change these or set them via Jenkins Environment Variables
        PROD_SSH_USER = 'ubuntu' 
        PROD_SERVER_IP = 'juneh2633.ddns.net' // Make sure this matches your Prod Server IP/Domain
        DEPLOY_DIR = '/home/ubuntu/anzuinfo-porable-be'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Registry Login') {
            steps {
                // To push to GHCR, you need a Jenkins Credential named 'github-registry-cred'
                // Type: "Username with password" (Username = github_id, Password = Personal Access Token)
                withCredentials([usernamePassword(credentialsId: 'github-registry-cred', passwordVariable: 'GH_TOKEN', usernameVariable: 'GH_USER')]) {
                    sh 'echo $GH_TOKEN | docker login ghcr.io -u $GH_USER --password-stdin'
                }
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy to Production') {
            steps {
                // To deploy, you need a Jenkins Credential named 'prod-server-ssh'
                // Type: "SSH Username with private key"
                sshagent(credentials: ['prod-server-ssh']) {
                    sh '''
                        set -euo pipefail
                        
                        echo "🚀 Triggering remote deployment on ${PROD_SERVER_IP}..."
                        ssh -o StrictHostKeyChecking=no ${PROD_SSH_USER}@${PROD_SERVER_IP} "
                            cd ${DEPLOY_DIR} &&
                            docker pull ${IMAGE_NAME}:${IMAGE_TAG} &&
                            export IMAGE_TAG=${IMAGE_TAG} &&
                            docker compose -p anzuinfo-porable-be up -d --no-deps --force-recreate app
                        "
                    '''
                }
            }
        }
        
        stage('Remote Prisma Migrate & Cache') {
            steps {
                sshagent(credentials: ['prod-server-ssh']) {
                    sh '''
                        set -euo pipefail
                        
                        echo "🔄 Waiting for Application to become ready..."
                        ssh -o StrictHostKeyChecking=no ${PROD_SSH_USER}@${PROD_SERVER_IP} '
                            ready=false
                            for i in $(seq 1 15); do
                                if curl -s http://localhost:3000/healthcheck > /dev/null; then
                                    echo "✅ Application is ready for migration!"
                                    ready="true"
                                    break
                                fi
                                echo "Waiting... ($i/15)"
                                sleep 2
                            done

                            if [ "$ready" != "true" ]; then
                                echo "❌ Error: Application failed to become ready within the timeout period."
                                exit 1
                            fi
                        '

                        echo "🔄 Running DB Migrations..."
                        ssh -o StrictHostKeyChecking=no ${PROD_SSH_USER}@${PROD_SERVER_IP} "
                            cd ${DEPLOY_DIR} &&
                            docker compose -p anzuinfo-porable-be exec -T app npx prisma migrate deploy
                        "
                        
                        echo "🌐 Triggering Cache Initialization..."
                        ssh -o StrictHostKeyChecking=no ${PROD_SSH_USER}@${PROD_SERVER_IP} "
                            curl -fsS -X GET http://localhost:3000/chart/cache > /dev/null || true
                        "
                    '''
                }
            }
        }

        stage('Docker Cleanup (CI Server)') {
            steps {
                sh '''
                    echo "🧹 Pruning dangling Docker images to free up CI space..."
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build & Deployment Pipeline Completed Successfully!'
        }
        failure {
            echo '❌ Pipeline Failed. Check the logs.'
        }
    }
}

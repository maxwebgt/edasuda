pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE = 'docker-compose'
        MONGO_URI = credentials('mongo-uri')
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out repository at ${env.GIT_COMMIT}"
            }
        }
        
        stage('Build') {
            steps {
                sh 'echo "Building application..."'
                sh 'cd backend && npm install'
                sh 'cd tg_bot && npm install'
            }
        }
        
        stage('Test') {
            steps {
                sh 'echo "Running tests..."'
                sh 'cd backend && npm test || true'
                sh 'cd tg_bot && npm test || true'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'echo "Deploying application..."'
                sh "${DOCKER_COMPOSE} down || true"
                sh "${DOCKER_COMPOSE} build"
                sh "${DOCKER_COMPOSE} up -d"
                sh 'echo "Deployment completed successfully"'
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline succeeded! The application has been deployed.'
        }
        failure {
            echo 'Pipeline failed! Please check the logs for details.'
        }
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}

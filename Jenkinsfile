pipeline {
    agent any
    
    // Environment variables
    environment {
        REPOSITORY_URL = "${params.REPOSITORY_URL ?: 'https://github.com/maxwebgt/edasuda.git'}"
        BRANCH = "${params.BRANCH ?: 'main'}"
        NODE_VERSION = "16" // Specify Node.js version
    }
    
    // Parameters for build
    parameters {
        string(name: 'REPOSITORY_URL', defaultValue: 'https://github.com/maxwebgt/edasuda.git', description: 'URL GitHub репозитория')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Ветка для сборки')
    }
    
    // Build triggers
    triggers {
        pollSCM('H/5 * * * *')
    }
    
    stages {
        // Verify tools installation
        stage('Verify Tools') {
            steps {
                sh '''
                    echo "Node version:"
                    node --version
                    
                    echo "NPM version:"
                    npm --version
                    
                    echo "Looking for Docker Compose..."
                    if command -v docker-compose &> /dev/null; then
                        echo "docker-compose found at: $(which docker-compose)"
                        docker-compose --version
                    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
                        echo "docker compose plugin found"
                        docker compose version
                    else
                        echo "Warning: Docker Compose not found"
                    fi
                '''
            }
        }
        
        // Checkout from Git
        stage('Checkout') {
            steps {
                echo "Клонирование репозитория ${REPOSITORY_URL}, ветка ${BRANCH}"
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${BRANCH}"]],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [[$class: 'CleanBeforeCheckout']],
                    submoduleCfg: [],
                    userRemoteConfigs: [[
                        url: "${REPOSITORY_URL}"
                    ]]
                ])
            }
        }
        
        // Build Backend
        stage('Build Backend') {
            steps {
                echo "Building backend..."
                sh 'ls -la'
                
                dir('backend') {
                    sh 'ls -la || true'
                    sh 'npm --version && node --version'
                    sh 'npm install || true'
                    sh 'npm run build || true'
                }
            }
        }
        
        // Deploy using Docker
        stage('Deploy') {
            steps {
                echo "Deploying application..."
                sh '''
                    # First try docker-compose command
                    if command -v docker-compose &> /dev/null; then
                        echo "Using docker-compose command"
                        docker-compose down || true
                        docker-compose build
                        docker-compose up -d
                        
                    # Next try docker compose plugin
                    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
                        echo "Using docker compose plugin"
                        docker compose down || true
                        docker compose build
                        docker compose up -d
                        
                    else
                        echo "Error: Docker Compose not available"
                        exit 1
                    fi
                '''
            }
        }
    }
    
    // Post-build actions
    post {
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Pipeline failed! Check the logs for details.'
        }
        always {
            echo 'Cleaning up workspace...'
            deleteDir()
        }
    }
}

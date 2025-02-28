#!/bin/bash

echo "=== Jenkins Pipeline Repair Script ==="

# Stopping Jenkins
echo "Stopping Jenkins container..."
docker-compose stop jenkins

# Create the credentials directory if it doesn't exist
mkdir -p jenkins/init.groovy.d

# Rebuilding Jenkins
echo "Rebuilding Jenkins with updated plugins..."
docker-compose build jenkins

# Starting Jenkins
echo "Starting Jenkins..."
docker-compose up -d jenkins

echo "Waiting for Jenkins to start..."
sleep 30

# Getting the default password
echo "Jenkins should be available at http://localhost:8082"
echo "Username: admin"
echo "To see password: docker-compose logs jenkins | grep 'initialAdminPassword'"

echo "=== Done ==="
echo "After Jenkins is up, go to:"
echo "1. http://localhost:8082/credentials/store/system/domain/_/"
echo "2. Add GitHub, MongoDB URI, and Telegram Bot credentials"
echo "3. Then run the pipeline: http://localhost:8082/job/Projects/job/edasuda-pipeline/"

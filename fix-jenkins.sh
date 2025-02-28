#!/bin/bash

echo "Stopping Jenkins container..."
docker-compose stop jenkins

echo "Removing Jenkins container..."
docker-compose rm -f jenkins

echo "Removing Jenkins volume data..."
docker volume rm edasuda2_jenkins_home

echo "Creating required directories..."
mkdir -p jenkins/init.groovy.d

echo "Rebuilding Jenkins container..."
docker-compose build jenkins

echo "Starting Jenkins container..."
docker-compose up -d jenkins

echo "Waiting for Jenkins to start..."
sleep 30

echo "Done! You can now access Jenkins at http://localhost:8082"
echo "Username: admin"
echo "Password: adminpass (or the value of JENKINS_ADMIN_PASSWORD in .env)"

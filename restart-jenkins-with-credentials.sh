#!/bin/bash

echo "========================================"
echo "Jenkins Restart with Credentials Setup"
echo "========================================"

# Stop Jenkins
echo "Stopping Jenkins..."
docker-compose stop jenkins

# Make directories if they don't exist
mkdir -p jenkins/init.groovy.d

# Copy the credentials setup script if it's not already there
if [ -f "jenkins/init.groovy.d/add-credentials.groovy" ]; then
    echo "Credentials script found"
else
    echo "Copying credentials script..."
    cp -f jenkins/init.groovy.d/add-credentials.groovy jenkins/init.groovy.d/
fi

# Start Jenkins
echo "Starting Jenkins..."
docker-compose up -d jenkins

echo "Waiting for Jenkins to start (30 seconds)..."
sleep 30

# Check if Jenkins is running
docker-compose ps jenkins

echo "========================================"
echo "Jenkins should now be running with credentials set up"
echo "Visit: http://localhost:8082"
echo "Username: admin"
echo "========================================"

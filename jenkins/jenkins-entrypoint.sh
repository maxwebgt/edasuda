#!/bin/bash

# Fix permissions
mkdir -p /var/jenkins_home/workspace/Projects
chown -R jenkins:jenkins /var/jenkins_home
chmod -R 777 /var/jenkins_home/workspace

# Start Jenkins
exec /usr/local/bin/jenkins.sh

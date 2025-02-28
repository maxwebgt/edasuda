#!/bin/bash

# Create required directories
mkdir -p /var/jenkins_home/workspace/Projects
mkdir -p /var/jenkins_home/init.groovy.d

# Fix permissions for workspace
if [ -d "/var/jenkins_home/workspace" ]; then
  chmod -R 777 /var/jenkins_home/workspace
  echo "Fixed workspace permissions"
fi

# Ensure disable-security.groovy exists and has the correct content
cat > /var/jenkins_home/init.groovy.d/disable-security.groovy << 'EOL'
import jenkins.model.*
import hudson.security.*

// Get Jenkins instance
def jenkins = Jenkins.getInstance()

// Disable security
def strategy = new hudson.security.AuthorizationStrategy.Unsecured()
jenkins.setAuthorizationStrategy(strategy)

def realm = new HudsonPrivateSecurityRealm(false)
jenkins.setSecurityRealm(realm)

// Save configuration
jenkins.save()

println "Security has been disabled"
EOL

# Check Docker Compose installation at container startup
echo "Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose binary directly..."
  curl -SL "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
  echo "Docker Compose installed at /usr/local/bin/docker-compose"
else
  echo "Docker Compose is already installed at $(which docker-compose)"
  docker-compose --version
fi

# Set proper permissions
chmod 644 /var/jenkins_home/init.groovy.d/*.groovy 2>/dev/null || true

# Start Jenkins
exec /usr/local/bin/jenkins.sh

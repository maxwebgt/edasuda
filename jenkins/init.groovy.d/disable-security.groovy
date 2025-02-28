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
  
  # Copy scripts from mounted volume if they exist
  cp -f /workspace/jenkins/init.groovy.d/*.groovy /var/jenkins_home/init.groovy.d/ 2>/dev/null || true;
  
  # Verify Docker Compose installation
  if ! command -v docker-compose &> /dev/null; then
    echo 'Docker Compose not found, installing directly...';
    curl -SL "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose;
    chmod +x /usr/local/bin/docker-compose;
    echo 'Docker Compose installed successfully:';
    docker-compose --version;
  else
    echo 'Docker Compose is available at:';
    which docker-compose;
    docker-compose --version;
  fi
  
  # Set proper permissions for groovy scripts
  chmod 644 /var/jenkins_home/init.groovy.d/*.groovy 2>/dev/null || true;
  
  # Start Jenkins
  exec /usr/local/bin/jenkins.sh

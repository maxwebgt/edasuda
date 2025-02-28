FROM jenkins/jenkins:lts

USER root

# Install prerequisites including Node.js and Docker Compose
RUN apt-get update && \
    apt-get install -y apt-transport-https \
                       ca-certificates \
                       curl \
                       gnupg \
                       lsb-release && \
    # Install Node.js and npm
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    # Add Docker's official GPG key 
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    # Install Docker CLI
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    # Download docker-compose binary directly (multiple installation methods for reliability)
    curl -SL "https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    # Create symlink from plugin if needed
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/bin/docker-compose 2>/dev/null || true && \
    # Print installed versions
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "Docker CLI version:" && docker --version || true && \
    echo "Docker Compose version:" && docker-compose --version || true && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up group for docker socket access
RUN groupadd -g 999 docker 2>/dev/null || true && \
    usermod -aG docker jenkins

# Install Jenkins plugins from a file
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Create necessary directories
RUN mkdir -p /var/jenkins_home/workspace/Projects /var/jenkins_home/casc_configs/ 

# Copy Groovy scripts
COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/

# Create a script that will be executed when the container starts
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set ownership and fix permissions
RUN chown -R jenkins:jenkins /var/jenkins_home /usr/local/bin/entrypoint.sh

# Skip initial setup wizard
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

# Switch back to jenkins user
USER jenkins

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

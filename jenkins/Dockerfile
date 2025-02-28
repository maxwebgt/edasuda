FROM jenkins/jenkins:lts

USER root

# Install Docker CLI and docker-compose
RUN apt-get update && \
    apt-get install -y apt-transport-https \
                       ca-certificates \
                       curl \
                       gnupg \
                       lsb-release && \
    # Install Docker CLI 
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
    https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up Docker group permissions
RUN groupadd -g 999 docker && \
    usermod -aG docker jenkins

# Install Jenkins plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Create init directories
RUN mkdir -p /usr/share/jenkins/ref/init.groovy.d
COPY init.groovy.d/* /usr/share/jenkins/ref/init.groovy.d/

# Skip initial setup wizard
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

USER jenkins

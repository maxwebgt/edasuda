docker-compose -f docker-compose.jenkins.yml down --volumes --remove-orphans
docker-compose -f docker-compose.jenkins.yml up -d --build
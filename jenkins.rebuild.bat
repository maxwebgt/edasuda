docker-compose down --volumes --remove-orphans
docker-compose build jenkins
docker-compose up -d jenkins
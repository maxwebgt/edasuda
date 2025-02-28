#!/bin/bash

echo "Исправление прав доступа для Jenkins..."

# Остановим контейнер Jenkins для безопасного изменения прав
docker-compose stop jenkins

# Запустим временный контейнер с доступом к тому же volume
docker run --rm -v jenkins_home:/var/jenkins_home -u root alpine sh -c "mkdir -p /var/jenkins_home/workspace/Projects && chown -R 1000:1000 /var/jenkins_home/workspace && chmod -R 777 /var/jenkins_home/workspace"

# Запустим Jenkins снова
docker-compose start jenkins

echo "Права доступа исправлены. Jenkins теперь должен иметь доступ к директории Projects."

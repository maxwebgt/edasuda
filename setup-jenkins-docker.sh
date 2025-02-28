#!/bin/bash

# Скрипт для настройки доступа Jenkins к Docker

echo "Настройка доступа Jenkins к Docker..."

# Добавление пользователя jenkins в группу docker
docker exec -u root jenkins usermod -aG docker jenkins

# Перезапуск Jenkins для применения изменений
docker-compose restart jenkins

echo "✅ Настройка завершена. Jenkins теперь имеет доступ к Docker."

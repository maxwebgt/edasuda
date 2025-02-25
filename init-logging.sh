#!/bin/bash

# Проверяем наличие плагина Loki
if ! docker plugin ls | grep -q "loki"; then
    echo "Installing Loki Docker plugin..."
    docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
fi

# Создаем необходимые директории
mkdir -p loki/data promtail/data pm2_logs

# Устанавливаем правильные разрешения
chmod -R 777 pm2_logs
chmod -R 777 loki/data
chmod -R 777 promtail/data

# Перезапускаем контейнеры
docker-compose down
docker-compose up -d
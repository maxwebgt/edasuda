#!/bin/bash

# Скрипт для тестирования webhook

# URL вашего Jenkins webhook
JENKINS_URL="http://localhost:8082/github-webhook/"

# Тестовый payload для webhook
PAYLOAD='{
  "ref": "refs/heads/main",
  "repository": {
    "url": "https://github.com/maxwebgt/edasuda.git",
    "name": "edasuda",
    "full_name": "maxwebgt/edasuda"
  },
  "pusher": {
    "name": "maxwebgt",
    "email": "maxwebgt@example.com"
  }
}'

# Отправка webhook с помощью curl
echo "Отправка webhook на $JENKINS_URL..."
curl -X POST -H "Content-Type: application/json" -d "$PAYLOAD" $JENKINS_URL

echo "Webhook отправлен. Проверьте логи Jenkins для подтверждения получения."

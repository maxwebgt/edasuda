#!/bin/bash

# Скрипт для запуска сборки в Jenkins через REST API

# Параметры Jenkins
JENKINS_URL="http://localhost:8082"
JOB_NAME="Projects/edasuda-pipeline"
USERNAME="admin"
API_TOKEN="admin" # Используйте ваш токен API из Jenkins или пароль

echo "Запуск сборки $JOB_NAME в Jenkins..."
curl -X POST -u "$USERNAME:$API_TOKEN" "$JENKINS_URL/job/$JOB_NAME/build"

echo "Запрос на сборку отправлен в Jenkins."

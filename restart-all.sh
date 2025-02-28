#!/bin/bash

echo "=== Restarting All Services ==="

# Stop and remove conflicting containers
echo "Stopping and removing existing containers..."
docker stop jenkins || true
docker rm jenkins || true

# Start all services with docker-compose
echo "Starting all services..."
docker-compose up -d

echo "=== Done ==="
echo "All services should now be running."

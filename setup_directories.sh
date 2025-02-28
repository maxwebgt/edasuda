#!/bin/bash

# Create necessary directories for the project
mkdir -p ./backend/uploads/videos
mkdir -p ./backend/uploads/images
mkdir -p ./mongo_data
mkdir -p ./logs
mkdir -p ./jenkins
mkdir -p ./prometheus
mkdir -p ./grafana/provisioning/datasources
mkdir -p ./grafana/provisioning/dashboards
mkdir -p ./loki/config
mkdir -p ./loki/data
mkdir -p ./loki/wal
mkdir -p ./loki/chunks
mkdir -p ./loki/compactor
mkdir -p ./loki/rules
mkdir -p ./promtail

echo "Directory structure created successfully!"

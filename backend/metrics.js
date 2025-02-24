const promClient = require('prom-client');

// Создаем новый реестр
const register = new promClient.Registry();

// Добавляем стандартные метрики Node.js
promClient.collectDefaultMetrics({
    register,
    prefix: 'node_',
});

// HTTP метрики
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// MongoDB метрики
const mongoDbOperations = new promClient.Counter({
    name: 'mongodb_operations_total',
    help: 'Total number of MongoDB operations',
    labelNames: ['operation', 'collection']
});

const mongoDbOperationDuration = new promClient.Histogram({
    name: 'mongodb_operation_duration_seconds',
    help: 'Duration of MongoDB operations',
    labelNames: ['operation', 'collection'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

// Регистрируем метрики
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(mongoDbOperations);
register.registerMetric(mongoDbOperationDuration);

module.exports = {
    register,
    metrics: {
        httpRequestDuration,
        httpRequestsTotal,
        mongoDbOperations,
        mongoDbOperationDuration
    }
};
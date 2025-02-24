const prometheus = require('prom-client');

// Создаем реестр метрик
const register = new prometheus.Registry();

// Добавляем стандартные метрики Node.js
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ register });

// Метрики для HTTP запросов
const httpRequestDurationMicroseconds = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Регистрируем метрики
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

module.exports = {
    register,
    metrics: {
        httpRequestDurationMicroseconds,
        httpRequestsTotal
    }
};
const prometheus = require('prom-client');

const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

// Метрики для Telegram бота
const botMessagesTotal = new prometheus.Counter({
    name: 'telegram_bot_messages_total',
    help: 'Total number of Telegram messages processed',
    labelNames: ['type', 'command']
});

const botMessageProcessingDuration = new prometheus.Histogram({
    name: 'telegram_bot_message_processing_seconds',
    help: 'Duration of Telegram message processing in seconds',
    labelNames: ['type', 'command'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const botActiveUsers = new prometheus.Gauge({
    name: 'telegram_bot_active_users',
    help: 'Number of active users in the last 5 minutes'
});

register.registerMetric(botMessagesTotal);
register.registerMetric(botMessageProcessingDuration);
register.registerMetric(botActiveUsers);

module.exports = {
    register,
    metrics: {
        botMessagesTotal,
        botMessageProcessingDuration,
        botActiveUsers
    }
};
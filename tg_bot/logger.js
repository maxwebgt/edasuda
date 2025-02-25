const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'tg_bot' },
    transports: [
        new winston.transports.File({
            filename: '/var/log/pm2/error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: '/var/log/pm2/combined.log'
        })
    ]
});

// Добавляем консольный вывод в development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
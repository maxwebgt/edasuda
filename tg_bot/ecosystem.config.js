module.exports = {
    apps: [{
        name: "tg_bot",
        script: "app.js",
        instances: 1, // для телеграм бота лучше использовать один инстанс
        exec_mode: "fork", // для бота используем fork режим
        watch: false, // отключаем watch в production
        max_memory_restart: "1G",
        env: {
            NODE_ENV: "production",
            TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
        },
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        error_file: "/var/log/pm2/error.log",
        out_file: "/var/log/pm2/out.log",
        merge_logs: true,
        // Добавляем метки для Loki
        log_type: "json",
        log: true,
        env_production: {
            LOKI_URL: "http://loki:3100"
        }
    }]
}
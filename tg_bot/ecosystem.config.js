module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'app.js',
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    out_file: '/var/log/pm2/telegram-bot-out.log',
    error_file: '/var/log/pm2/telegram-bot-error.log',
    merge_logs: true
  }]
};
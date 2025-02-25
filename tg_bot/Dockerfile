FROM node:18

# Устанавливаем PM2 глобально
RUN npm install pm2 -g

WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код и конфигурационные файлы
COPY . .
COPY ecosystem.config.js .

# Создаем директорию для логов PM2
RUN mkdir -p /var/log/pm2

# Запускаем приложение через PM2 в production режиме
CMD ["pm2-runtime", "ecosystem.config.js"]
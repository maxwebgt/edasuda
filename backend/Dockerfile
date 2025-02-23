FROM node:16

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы с зависимостями
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Для разработки можно установить nodemon глобально (если используется)
RUN npm install -g nodemon

# Копируем остальные файлы проекта
COPY . .

# Открываем порт 5000 для доступа
EXPOSE 5000

# Запускаем приложение через nodemon
CMD ["nodemon", "server.js"]
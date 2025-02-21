# Используем официальный образ Node.js
FROM node:16

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json в контейнер
#COPY package*.json ./

# Устанавливаем зависимости


# Устанавливаем nodemon глобально
RUN npm install -g nodemon
#RUN npm install
# Копируем весь код в контейнер
COPY . .

# Открываем порт 5000 для доступа
EXPOSE 5000

# Запуск через nodemon для разработки
CMD ["nodemon", "server.js"]

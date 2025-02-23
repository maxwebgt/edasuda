# Используем официальный Node.js образ
FROM node:16

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json /app
RUN npm install

# Копируем весь код бота в контейнер
COPY . /app

# Устанавливаем nodemon глобально
RUN npm install -g nodemon

# Открываем порт, на котором будет работать бот
EXPOSE 5001

# Запускаем бота с помощью nodemon
CMD ["npm", "start"]
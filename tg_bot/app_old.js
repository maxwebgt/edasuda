// Загружаем переменные окружения из .env файла
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const axios = require('axios');

// Берем токен из переменной окружения
const token = process.env.TELEGRAM_BOT_TOKEN;

// Проверка на наличие токена в переменных окружения
if (!token) {
    console.error('Telegram bot token is missing in the environment variables.');
    process.exit(1);
}

// Создание бота
const bot = new TelegramBot(token, { polling: true });

// Приветственное сообщение с доступными командами
const welcomeMessage = `
Добро пожаловать в наш магазин!
`;

// Инлайн клавиатура для главного меню
const mainMenu = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [
                { text: 'Сосиски', callback_data: 'order' },
                { text: 'Рыба', callback_data: 'products' },
            ],
            [
                { text: 'Ветчина', callback_data: 'status' },
                { text: 'Хлеб', callback_data: 'help' },
            ]
        ]
    })
};
const replyMenu = {
    reply_markup: JSON.stringify({
        keyboard: [
            ['🛒Каталог', 'Заказы'],
            ['Помощь']
        ],
        resize_keyboard: true, // Автоматически подстраивает размер клавиатуры
        one_time_keyboard: true // Клавиатура исчезнет после нажатия
    })
};


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    // bot.sendMessage(chatId, welcomeMessage);
    // bot.sendMessage(chatId, 'Добро пожаловать в наш магазин!', mainMenu);
    bot.sendMessage(chatId, welcomeMessage, replyMenu);
});

// Обработка нажатия кнопок Reply клавиатуры
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '🛒Каталог') {
        try {
            const response = await axios.get('http://api:5000/api/products'); // Примерный URL твоего API
            const products = response.data;
            let productList = 'Вот список доступных продуктов:\n';

            products.forEach(product => {
                productList += `${product.id}. ${product.name}\n`;
            });

            bot.sendMessage(chatId, productList);
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, 'Произошла ошибка при получении списка продуктов.');
        }
    } else {
        bot.sendMessage(chatId, 'Привет! Введите команду /start для начала.');
    }
});

// Настроим веб-сервер для подключения к Telegram
app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});

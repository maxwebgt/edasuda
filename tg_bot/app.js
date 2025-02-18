require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const app = express();

// Берем токен из переменной окружения
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error('Telegram bot token is missing in the environment variables.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Состояние пользователя (для выбора продукта и количества)
const userState = {};

const mainMenu = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '🛒Просмотреть продукты', callback_data: 'view_products' }],
            [{ text: 'Помощь', callback_data: 'help' }]
        ]
    })
};

// Команда /start (приветствие нового пользователя)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать в наш магазин! Вот что у нас сейчас есть вкусненького:', mainMenu);
});

// Обработка нажатий на Inline кнопки
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'view_products') {
        try {
            const response = await axios.get('http://api:5000/api/products'); // Примерный URL твоего API
            const products = response.data;

            let productList = 'Вот список доступных продуктов:\n';
            products.forEach(product => {
                productList += `${product.id}. ${product.name}\n`;
            });

            userState[chatId] = { step: 'select_product', products };
            bot.sendMessage(chatId, productList + 'Выберите продукт, отправив его номер (например, "1" для Сосисок).');
        } catch (error) {
            console.error('Error fetching products:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при получении списка продуктов.');
        }
    } else if (data === 'help') {
        bot.sendMessage(chatId, 'Вот что можно сделать:\n1. Просмотреть продукты /view_products\n2. Оформить заказ');
    }
});

// Обработка выбора продукта и запроса количества
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].step === 'select_product') {
        // Проверяем, что введен номер продукта
        const selectedProduct = userState[chatId].products.find(p => p.id === parseInt(text));

        if (selectedProduct) {
            userState[chatId].selectedProduct = selectedProduct;
            userState[chatId].step = 'select_quantity';

            bot.sendMessage(chatId, `Вы выбрали ${selectedProduct.name}. Теперь укажите количество (например, 2).`);
        } else {
            bot.sendMessage(chatId, 'Неверный выбор продукта. Пожалуйста, отправьте номер продукта из списка.');
        }
    } else if (userState[chatId] && userState[chatId].step === 'select_quantity') {
        const quantity = parseInt(text);

        if (isNaN(quantity) || quantity <= 0) {
            bot.sendMessage(chatId, 'Введите корректное количество.');
        } else {
            const order = {
                productId: userState[chatId].selectedProduct.id,
                quantity,
                userId: chatId
            };

            try {
                const response = await axios.post('http://localhost:5000/api/orders', order); // Примерный URL для создания заказа
                bot.sendMessage(chatId, `Ваш заказ принят! Продукт: ${userState[chatId].selectedProduct.name}, Количество: ${quantity}`);
            } catch (error) {
                console.error('Error creating order:', error);
                bot.sendMessage(chatId, 'Произошла ошибка при создании заказа.');
            }

            // Очистить состояние после завершения заказа
            delete userState[chatId];
        }
    } else {
        bot.sendMessage(chatId, 'Привет! Введите команду /start для начала.');
    }
});

// Настроим веб-сервер для подключения к Telegram
app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});

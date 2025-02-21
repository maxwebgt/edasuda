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

// Состояние пользователя (для выбора действия)
const userState = {};

// Главное меню
const mainMenu = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '🛒Просмотреть продукты', callback_data: 'view_products' }],
            [{ text: 'Добавить продукт', callback_data: 'add_product' }],
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
    } else if (data === 'add_product') {
        userState[chatId] = { step: 'add_product_name' };
        bot.sendMessage(chatId, 'Введите название продукта:');
    } else if (data === 'help') {
        bot.sendMessage(chatId, 'Вот что можно сделать:\n1. Просмотреть продукты /view_products\n2. Оформить заказ\n3. Добавить продукт /add_product');
    }
});

// Обработка ввода сообщения от пользователя (для добавления нового продукта)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userState[chatId] && userState[chatId].step === 'add_product_name') {
        userState[chatId].productName = text;
        userState[chatId].step = 'add_product_description';
        bot.sendMessage(chatId, 'Введите описание продукта:');
    } else if (userState[chatId] && userState[chatId].step === 'add_product_description') {
        userState[chatId].productDescription = text;
        userState[chatId].step = 'add_product_price';
        bot.sendMessage(chatId, 'Введите цену продукта:');
    } else if (userState[chatId] && userState[chatId].step === 'add_product_price') {
        const price = parseFloat(text);
        if (isNaN(price) || price <= 0) {
            bot.sendMessage(chatId, 'Введите корректную цену продукта.');
        } else {
            userState[chatId].productPrice = price;
            userState[chatId].step = 'add_product_category';
            bot.sendMessage(chatId, 'Введите категорию продукта:');
        }
    } else if (userState[chatId] && userState[chatId].step === 'add_product_category') {
        userState[chatId].productCategory = text;
        const newProduct = {
            name: userState[chatId].productName,
            description: userState[chatId].productDescription,
            price: userState[chatId].productPrice,
            category: userState[chatId].productCategory
        };

        try {
            const response = await axios.post('http://api:5000/api/products', newProduct); // Примерный URL API для добавления продукта
            bot.sendMessage(chatId, `Продукт "${newProduct.name}" успешно добавлен!`);
        } catch (error) {
            console.error('Error adding product:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при добавлении продукта.');
        }

        delete userState[chatId];  // Очистить состояние после добавления продукта
    } else {
        bot.sendMessage(chatId, 'Привет! Введите команду /start для начала.');
    }
});

// Настроим веб-сервер для подключения к Telegram
app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});

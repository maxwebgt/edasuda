require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const FormData = require('form-data');
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
            const response = await axios.get('http://api:5000/api/products');
            const products = response.data;

            const productButtons = products.map((product, index) => {
                return [{ text: product.name, callback_data: `product_${index}` }];
            });

            userState[chatId] = { step: 'select_product', products };
            bot.sendMessage(chatId, 'Вот список доступных продуктов:', {
                reply_markup: JSON.stringify({
                    inline_keyboard: productButtons
                })
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при получении списка продуктов.');
        }
    } else if (data.startsWith('product_')) {
        const index = parseInt(data.split('_')[1], 10);
        const selectedProduct = userState[chatId].products[index];
        const productInfo = `Вы выбрали продукт: ${selectedProduct.name}\nОписание: ${selectedProduct.description}\nЦена: ${selectedProduct.price} ₽`;

        console.log('Selected product data:', selectedProduct);

        if (selectedProduct.filename || selectedProduct.image) {
            try {
                const filename = selectedProduct.filename || selectedProduct.image;
                // Получаем изображение с нашего API
                const imageResponse = await axios.get(`http://api:5000/api/images/file/${filename}`, {
                    responseType: 'arraybuffer'
                });

                console.log('Image response received, content length:', imageResponse.data.length);

                // Отправляем изображение в Telegram напрямую
                await bot.sendPhoto(chatId, Buffer.from(imageResponse.data), {
                    caption: productInfo
                });
            } catch (error) {
                console.error('Error sending photo:', error);
                console.error('Error details:', error.response?.data);
                bot.sendMessage(chatId, productInfo);
            }
        } else {
            bot.sendMessage(chatId, productInfo);
        }
    } else if (data === 'add_product') {
        userState[chatId] = { step: 'add_product_name' };
        bot.sendMessage(chatId, 'Введите название продукта:');
    } else if (data === 'help') {
        bot.sendMessage(chatId, 'Вот что можно сделать:\n1. Просмотреть продукты\n2. Оформить заказ\n3. Добавить продукт');
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
        userState[chatId].step = 'add_product_image';
        bot.sendMessage(chatId, 'Пожалуйста, отправьте изображение продукта:');
    } else if (userState[chatId] && userState[chatId].step === 'add_product_image' && msg.photo) {
        const photo = msg.photo[msg.photo.length - 1]; // Берем фото с максимальным разрешением
        const fileId = photo.file_id;

        try {
            const fileLink = await bot.getFileLink(fileId);
            console.log('Telegram file link:', fileLink);

            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            console.log('Image downloaded, size:', response.data.length);

            const buffer = Buffer.from(response.data);
            const timestamp = Date.now();
            const filename = `${timestamp}.jpg`;

            const form = new FormData();
            form.append('image', buffer, {
                filename: filename,
                contentType: 'image/jpeg'
            });

            console.log('Uploading image with filename:', filename);

            const imageResponse = await axios.post('http://api:5000/api/images/upload', form, {
                headers: form.getHeaders()
            });

            console.log('Image upload response data:', imageResponse.data);

            const newProduct = {
                name: userState[chatId].productName,
                description: userState[chatId].productDescription,
                price: userState[chatId].productPrice,
                category: userState[chatId].productCategory,
                image: imageResponse.data.image.filename,
                filename: imageResponse.data.image.filename
            };

            console.log('New product data before sending:', newProduct);

            try {
                const productResponse = await axios.post('http://api:5000/api/products', newProduct);
                console.log('Product creation response data:', productResponse.data);

                // Проверим структуру созданного продукта
                const createdProduct = await axios.get(`http://api:5000/api/products/${productResponse.data._id}`);
                console.log('Created product data:', createdProduct.data);

                bot.sendMessage(chatId, `Продукт "${newProduct.name}" успешно добавлен!`);

                // Возвращаем стартовое сообщение
                bot.sendMessage(chatId, 'Добро пожаловать в наш магазин! Вот что у нас сейчас есть вкусненького:', mainMenu);
            } catch (error) {
                console.error('Error adding product:', error);
                console.error('Error response data:', error.response?.data);
                bot.sendMessage(chatId, 'Произошла ошибка при добавлении продукта.');
            }

            delete userState[chatId];  // Очистить состояние после добавления продукта
        } catch (error) {
            console.error('Error downloading or uploading image:', error);
            console.error('Error response data:', error.response?.data);
            bot.sendMessage(chatId, 'Произошла ошибка при обработке изображения.');
        }
    }
});

// Настроим веб-сервер для подключения к Telegram
app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});
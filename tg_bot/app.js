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

        // Сохраняем выбранный продукт в состоянии пользователя
        userState[chatId] = {
            step: 'enter_quantity',
            selectedProduct: selectedProduct
        };

        console.log('Selected product data:', selectedProduct);

        // Отправляем фото продукта и запрашиваем количество
        if (selectedProduct.filename || selectedProduct.image) {
            try {
                const filename = selectedProduct.filename || selectedProduct.image;
                const imageResponse = await axios.get(`http://api:5000/api/images/file/${filename}`, {
                    responseType: 'arraybuffer'
                });

                await bot.sendPhoto(chatId, Buffer.from(imageResponse.data), {
                    caption: productInfo + '\n\nПожалуйста, введите желаемое количество:'
                });
            } catch (error) {
                console.error('Error sending photo:', error);
                bot.sendMessage(chatId, productInfo + '\n\nПожалуйста, введите желаемое количество:');
            }
        } else {
            bot.sendMessage(chatId, productInfo + '\n\nПожалуйста, введите желаемое количество:');
        }
    } else if (data === 'add_product') {
        userState[chatId] = { step: 'add_product_name' };
        bot.sendMessage(chatId, 'Введите название продукта:');
    } else if (data === 'help') {
        bot.sendMessage(chatId, 'Вот что можно сделать:\n1. Просмотреть продукты\n2. Оформить заказ\n3. Добавить продукт');
    }
});

// Обработка ввода сообщения от пользователя
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!userState[chatId]) {
        return;
    }

    if (userState[chatId].step === 'add_product_name') {
        userState[chatId].productName = text;
        userState[chatId].step = 'add_product_description';
        bot.sendMessage(chatId, 'Введите описание продукта:');
    }
    else if (userState[chatId].step === 'add_product_description') {
        userState[chatId].productDescription = text;
        userState[chatId].step = 'add_product_price';
        bot.sendMessage(chatId, 'Введите цену продукта:');
    }
    else if (userState[chatId].step === 'add_product_price') {
        const price = parseFloat(text);
        if (isNaN(price) || price <= 0) {
            bot.sendMessage(chatId, 'Введите корректную цену продукта.');
        } else {
            userState[chatId].productPrice = price;
            userState[chatId].step = 'add_product_category';
            bot.sendMessage(chatId, 'Введите категорию продукта:');
        }
    }
    else if (userState[chatId].step === 'add_product_category') {
        userState[chatId].productCategory = text;
        userState[chatId].step = 'add_product_image';
        bot.sendMessage(chatId, 'Пожалуйста, отправьте изображение продукта:');
    }
    else if (userState[chatId].step === 'add_product_image' && msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
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
                image: imageResponse.data.image.filename
            };

            console.log('New product data before sending:', newProduct);

            const productResponse = await axios.post('http://api:5000/api/products', newProduct);
            console.log('Product creation response data:', productResponse.data);

            bot.sendMessage(chatId, `Продукт "${newProduct.name}" успешно добавлен!`);
            bot.sendMessage(chatId, 'Добро пожаловать в наш магазин! Вот что у нас сейчас есть вкусненького:', mainMenu);

            delete userState[chatId];
        } catch (error) {
            console.error('Error creating product:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при создании продукта.');
        }
    }
    else if (userState[chatId].step === 'enter_quantity') {
        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity <= 0) {
            bot.sendMessage(chatId, 'Пожалуйста, введите корректное количество (положительное число).');
            return;
        }

        userState[chatId].quantity = quantity;
        userState[chatId].step = 'enter_description';
        bot.sendMessage(chatId, 'Введите описание к заказу (например, особые пожелания):');
    }
    else if (userState[chatId].step === 'enter_description') {
        userState[chatId].description = text;
        userState[chatId].step = 'enter_phone';
        bot.sendMessage(chatId, 'Введите ваш контактный телефон:');
    }
    else if (userState[chatId].step === 'enter_phone') {
        // Простая проверка формата телефона
        if (!/^\+?\d{10,12}$/.test(text.replace(/\s/g, ''))) {
            bot.sendMessage(chatId, 'Пожалуйста, введите корректный номер телефона (10-12 цифр).');
            return;
        }

        userState[chatId].phone = text;
        userState[chatId].step = 'enter_address';
        bot.sendMessage(chatId, 'Введите адрес доставки:');
    }
    else if (userState[chatId].step === 'enter_address') {
        try {
            const order = {
                clientId: chatId.toString(),
                products: [{
                    productId: userState[chatId].selectedProduct._id,
                    quantity: userState[chatId].quantity
                }],
                description: userState[chatId].description,
                status: 'В процессе',
                totalAmount: userState[chatId].selectedProduct.price * userState[chatId].quantity,
                paymentStatus: 'Не оплачено',
                paymentMethod: 'Наличные',
                shippingAddress: text,
                contactPhone: userState[chatId].phone,
                contactEmail: `${chatId}@telegram.com`
            };

            console.log('Creating order:', order);

            const response = await axios.post('http://api:5000/api/orders', order);
            console.log('Order creation response:', response.data);

            const orderInfo = `Заказ успешно создан!\n\n` +
                `Продукт: ${userState[chatId].selectedProduct.name}\n` +
                `Количество: ${userState[chatId].quantity}\n` +
                `Сумма: ${order.totalAmount} ₽\n` +
                `Телефон: ${userState[chatId].phone}\n` +
                `Адрес: ${text}\n` +
                `Описание: ${userState[chatId].description}`;

            bot.sendMessage(chatId, orderInfo);
            bot.sendMessage(chatId, 'Что желаете сделать дальше?', mainMenu);

            delete userState[chatId];
        } catch (error) {
            console.error('Error creating order:', error);
            bot.sendMessage(chatId, 'Произошла ошибка при создании заказа. Пожалуйста, попробуйте снова.');
            bot.sendMessage(chatId, 'Что желаете сделать дальше?', mainMenu);
        }
    }
});

// Настроим веб-сервер для подключения к Telegram
app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});
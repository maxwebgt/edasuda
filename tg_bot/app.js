/**
 * Telegram Bot for E-commerce
 * @lastModified 2025-02-23 02:40:00 UTC
 * @user maxwebgt
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const FormData = require('form-data');
const app = express();

// Get the Telegram Bot Token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Telegram bot token is missing in the environment variables.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// In-memory state for flows and last messages for deletion
const userState = {};
const lastBotMessages = {};

function prepareReplyMarkup(options = {}) {
    console.log('[prepareReplyMarkup] Incoming options:', options);
    if (options.reply_markup) {
        try {
            const markup = typeof options.reply_markup === 'string'
                ? JSON.parse(options.reply_markup)
                : options.reply_markup;
            console.log('[prepareReplyMarkup] Parsed markup:', markup);
            if (markup.inline_keyboard) {
                console.log('[prepareReplyMarkup] Detected inline_keyboard. Returning inline markup.');
                return markup;
            }
        } catch (error) {
            console.error('[prepareReplyMarkup] Error parsing reply_markup:', error);
        }
    }
    // Updated keyboard layout:
    // Row 1: "🍞 Каталог" (bread icon for neutrality and vegan-friendly) and "📋 Заказы"
    // Row 2: "⚙️ Управление"
    // Row 3: "❓ Помощь"
    const replyKeyboard = {
        keyboard: [
            ['🍞 Каталог', '📋 Заказы'],
            ['⚙️ Управление'],
            ['❓ Помощь']
        ],
        resize_keyboard: true,
    };
    console.log('[prepareReplyMarkup] Returning default reply keyboard:', replyKeyboard);
    return replyKeyboard;
}

async function sendMessageWithDelete(chatId, text, options = {}) {
    try {
        if (lastBotMessages[chatId]) {
            try {
                await bot.deleteMessage(chatId, lastBotMessages[chatId]);
                console.log(`[sendMessageWithDelete] Deleted previous message for chat ${chatId}`);
            } catch (error) {
                console.log(`[sendMessageWithDelete] Error deleting previous message: ${error.message}`);
            }
        }
        const replyMarkup = prepareReplyMarkup(options);
        const messageOptions = { ...options, reply_markup: replyMarkup };
        console.log(
            `[sendMessageWithDelete] Sending message to chat ${chatId} with text: "${text}" and options:`,
            messageOptions
        );
        const message = await bot.sendMessage(chatId, text, messageOptions);
        lastBotMessages[chatId] = message.message_id;
        console.log(`[sendMessageWithDelete] Message sent. ID: ${message.message_id}`);
        return message;
    } catch (error) {
        console.error('[sendMessageWithDelete] Error sending message:', error);
        throw error;
    }
}

async function sendPhotoWithDelete(chatId, photo, options = {}) {
    try {
        if (lastBotMessages[chatId]) {
            try {
                await bot.deleteMessage(chatId, lastBotMessages[chatId]);
                console.log(`[sendPhotoWithDelete] Deleted previous message for chat ${chatId}`);
            } catch (error) {
                console.log(`[sendPhotoWithDelete] Error deleting previous message: ${error.message}`);
            }
        }
        const replyMarkup = prepareReplyMarkup(options);
        const messageOptions = { ...options, reply_markup: replyMarkup };
        console.log(`[sendPhotoWithDelete] Sending photo to chat ${chatId} with options:`, messageOptions);
        const message = await bot.sendPhoto(chatId, photo, messageOptions);
        lastBotMessages[chatId] = message.message_id;
        console.log(`[sendPhotoWithDelete] Photo sent. ID: ${message.message_id}`);
        return message;
    } catch (error) {
        console.error('[sendPhotoWithDelete] Error sending photo:', error);
        throw error;
    }
}

const mainMenu = {
    reply_markup: {
        keyboard: [
            ['🍞 Каталог', '📋 Заказы'],
            ['⚙️ Управление'],
            ['❓ Помощь']
        ],
        resize_keyboard: true,
    },
};

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`[onText /start] Received /start from chat ${chatId}`);

    const telegramLogin = msg.from.username || '';
    if (!telegramLogin) {
        console.error(`[onText /start] Telegram login is missing for chat ${chatId}. Cannot create user.`);
    } else {
        const apiUrlUsers = 'http://api:5000/api/users';
        try {
            console.log(`[onText /start] Fetching users from API to check for telegramId: ${telegramLogin}`);
            const response = await axios.get(apiUrlUsers);
            const users = response.data;
            const existingUser = users.find((u) => u.telegramId === telegramLogin);
            if (!existingUser) {
                console.log(`[onText /start] No user found with telegramId "${telegramLogin}". Creating new user.`);
                const payload = { telegramId: telegramLogin, role: 'client', username: telegramLogin };
                console.log(`[onText /start] Creating user with payload:`, payload);
                await axios.post(apiUrlUsers, payload);
                console.log(`[onText /start] New user created with telegramId: ${telegramLogin}`);
            } else {
                console.log(`[onText /start] User with telegramId "${telegramLogin}" already exists.`);
            }
        } catch (error) {
            console.error('[onText /start] Error during API call to check/create user:', error.message);
            if (error.response && error.response.data) {
                console.error('[onText /start] Error response data:', error.response.data);
            }
        }
    }
    await sendMessageWithDelete(chatId, 'Добро пожаловать в наш магазин! 👋🥩🐟🍞🥓🍲', mainMenu);
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    console.log(`Received callback query from ${chatId}: ${data}`);

    if (data.startsWith('view_order_')) {
        const orderId = data.split('_')[2];
        console.log(`[Order View] Viewing order with id: ${orderId}`);
        let orderDetails;
        try {
            const response = await axios.get(`http://api:5000/api/orders/${orderId}`);
            orderDetails = response.data;
            console.log(`[Order View] Retrieved order details:`, orderDetails);
        } catch (error) {
            console.error(`[Order View] Error fetching details for order ${orderId}:`, error.message);
            await sendMessageWithDelete(chatId, `Ошибка: не удалось получить данные заказа ${orderId}`);
            return;
        }
        const order = orderDetails.order || orderDetails;
        console.log('[Order View] Using order object:', order);
        let detailsText = `Заказ №${order._id}\n`;
        detailsText += `Статус: ${order.status}\n`;
        detailsText += `Сумма: ${order.totalAmount} ₽\n`;
        detailsText += `Адрес доставки: ${order.shippingAddress}\n`;
        if (order.statusHistory && order.statusHistory.length > 0) {
            detailsText += `Дата создания: ${new Date(order.statusHistory[0].timestamp).toLocaleString()}\n`;
        }
        const inlineKeyboard = {
            inline_keyboard: [
                [{ text: '❌ Отменить', callback_data: `cancel_order_${order._id}` }],
                [{ text: '⬅️ Назад', callback_data: 'orders_list' }]
            ]
        };
        await sendMessageWithDelete(chatId, detailsText, { reply_markup: JSON.stringify(inlineKeyboard) });
    }
    else if (data === 'orders_list') {
        await displayOrdersList(chatId);
    }
    else if (data.startsWith('cancel_order_')) {
        const orderId = data.split('_')[2];
        console.log(`[Order Cancel] Received request to cancel order with id: ${orderId}`);
        try {
            console.log(`[Order Cancel] Sending API request to cancel order ${orderId}`);
            const cancelResponse = await axios.put(`http://api:5000/api/orders/${orderId}`, { status: 'Отменён' });
            console.log(`[Order Cancel] Response from API:`, cancelResponse.data);
            await sendMessageWithDelete(chatId, `Заказ ${orderId} успешно отменён! ❌`);
        } catch (error) {
            console.error(`[Order Cancel] Error cancelling order ${orderId}:`, error.message);
            await sendMessageWithDelete(chatId, `Ошибка при отмене заказа ${orderId}. Попробуйте снова.`);
        }
    }
    else if (data === 'view_products') {
        try {
            console.log('Fetching products from API');
            const response = await axios.get('http://api:5000/api/products');
            const products = response.data;
            console.log('Products:', products);
            if (products.length === 0) {
                await sendMessageWithDelete(chatId, 'В данный момент продукты недоступны.');
                return;
            }
            const productButtons = products.map((product, index) => {
                return [{ text: product.name, callback_data: `product_${index}` }];
            });
            productButtons.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);
            userState[chatId] = { step: 'select_product', products };
            await sendMessageWithDelete(chatId, 'Вот список доступных продуктов:', {
                reply_markup: JSON.stringify({ inline_keyboard: productButtons }),
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при получении списка продуктов.');
        }
    }
    else if (data.startsWith('product_')) {
        const index = parseInt(data.split('_')[1], 10);
        const selectedProduct = userState[chatId].products[index];
        const productInfo = `Вы выбрали продукт: ${selectedProduct.name}\nОписание: ${selectedProduct.description}\nЦена: ${selectedProduct.price} ₽`;
        userState[chatId] = { step: 'view_product', selectedProduct, products: userState[chatId].products };
        const productActionButtons = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '🛍 Купить', callback_data: 'buy_product' },
                        { text: '⬅️ Назад', callback_data: 'back_to_products' }]
                ]
            }),
        };
        if (selectedProduct.filename || selectedProduct.image) {
            try {
                const filename = selectedProduct.filename || selectedProduct.image;
                const imageResponse = await axios.get(`http://api:5000/api/images/file/${filename}`, { responseType: 'arraybuffer' });
                await sendPhotoWithDelete(chatId, Buffer.from(imageResponse.data), { caption: productInfo, ...productActionButtons });
            } catch (error) {
                console.error('Error sending photo:', error);
                await sendMessageWithDelete(chatId, productInfo, productActionButtons);
            }
        } else {
            await sendMessageWithDelete(chatId, productInfo, productActionButtons);
        }
    }
    else if (data === 'back_to_products') {
        const products = userState[chatId].products;
        const productButtons = products.map((product, index) => {
            return [{ text: product.name, callback_data: `product_${index}` }];
        });
        productButtons.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);
        userState[chatId].step = 'select_product';
        await sendMessageWithDelete(chatId, 'Вот список доступных продуктов:', { reply_markup: JSON.stringify({ inline_keyboard: productButtons }) });
    }
    else if (data === 'back_to_main') {
        userState[chatId] = { step: 'main_menu' };
        await sendMessageWithDelete(chatId, 'Добро пожаловать в наш магазин! 👋🥩🐟🍞🥓🍲', mainMenu);
    }
    else if (data === 'buy_product') {
        userState[chatId].step = 'enter_quantity';
        await sendMessageWithDelete(chatId, 'Пожалуйста, введите желаемое количество:');
    }
    else if (data === 'add_product') {
        userState[chatId] = { step: 'add_product_name' };
        await sendMessageWithDelete(chatId, 'Введите название продукта: (пример: ➕ Новый продукт)');
    }
    else if (data === 'help') {
        await sendMessageWithDelete(chatId, 'Вот что можно сделать:\n1. Просмотреть продукты\n2. Оформить заказ\n3. Добавить продукт');
    }
});

async function displayOrdersList(chatId) {
    const ordersUrl = `http://api:5000/api/orders/client/${chatId}`;
    console.log(`[Orders List] Requesting orders from URL: ${ordersUrl}`);
    try {
        const response = await axios.get(ordersUrl);
        let orders = [];
        if (Array.isArray(response.data)) {
            orders = response.data;
        } else if (response.data.orders) {
            orders = response.data.orders;
        }
        if (orders.length === 0) {
            await sendMessageWithDelete(chatId, 'У вас пока нет заказов.');
            return;
        }
        console.log('[Orders List] Returned orders:', JSON.stringify(orders, null, 2));
        const inlineKeyboard = orders.map(order => {
            return [{
                text: `Заказ №${order._id} - ${order.totalAmount} ₽`,
                callback_data: `view_order_${order._id}`
            }];
        });
        const keyboardOptions = { inline_keyboard: inlineKeyboard };
        await sendMessageWithDelete(chatId, 'Ваши заказы:', { reply_markup: JSON.stringify(keyboardOptions) });
    } catch (error) {
        console.error('[Orders List] Error fetching orders:', error.message);
        await sendMessageWithDelete(chatId, 'Произошла ошибка при получении списка заказов.');
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (text === '🍞 Каталог') {
        try {
            const response = await axios.get('http://api:5000/api/products');
            const products = response.data;
            if (products.length === 0) {
                await sendMessageWithDelete(chatId, 'В данный момент продукты недоступны.');
                return;
            }
            const productButtons = products.map((product, index) => {
                return [{ text: product.name, callback_data: `product_${index}` }];
            });
            productButtons.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);
            userState[chatId] = { step: 'select_product', products, telegramId: msg.from.username };
            await sendMessageWithDelete(chatId, 'Вот список доступных продуктов:', { reply_markup: JSON.stringify({ inline_keyboard: productButtons }) });
        } catch (error) {
            console.error('Error fetching products:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при получении списка продуктов.');
        }
        return;
    }
    if (text === '📋 Заказы') {
        await displayOrdersList(chatId);
        return;
    }
    if (text === '❓ Помощь') {
        await sendMessageWithDelete(chatId,
            'Вот что можно сделать:\n\n' +
            '1. 🍞 Каталог - просмотр всех доступных продуктов\n' +
            '2. 📋 Заказы - просмотр ваших заказов (подробная информация и отмена заказа)\n' +
            '3. ❓ Помощь - показать это сообщение\n\n' +
            'Для совершения покупки:\n' +
            '1. Откройте каталог\n' +
            '2. Выберите интересующий товар\n' +
            '3. Нажмите кнопку "Купить"\n' +
            '4. Следуйте инструкциям бота'
        );
        return;
    }
    if (text === '⚙️ Управление') {
        const managementMenu = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '➕ Добавить продукт', callback_data: 'add_product' }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_main' }]
                ],
            }),
        };
        await sendMessageWithDelete(chatId, 'Панель управления:', managementMenu);
        return;
    }
    if (!userState[chatId]) {
        return;
    }
    if (userState[chatId].step === 'add_product_name') {
        userState[chatId].productName = text;
        userState[chatId].step = 'add_product_description';
        await sendMessageWithDelete(chatId, 'Введите описание продукта:');
    } else if (userState[chatId].step === 'add_product_description') {
        userState[chatId].productDescription = text;
        userState[chatId].step = 'add_product_price';
        await sendMessageWithDelete(chatId, 'Введите цену продукта:');
    } else if (userState[chatId].step === 'add_product_price') {
        const price = parseFloat(text);
        if (isNaN(price) || price <= 0) {
            await sendMessageWithDelete(chatId, 'Введите корректную цену продукта.');
        } else {
            userState[chatId].productPrice = price;
            userState[chatId].step = 'add_product_category';
            await sendMessageWithDelete(chatId, 'Введите категорию продукта:');
        }
    } else if (userState[chatId].step === 'add_product_category') {
        userState[chatId].productCategory = text;
        userState[chatId].step = 'add_product_image';
        await sendMessageWithDelete(chatId, 'Пожалуйста, отправьте изображение продукта:');
    } else if (userState[chatId].step === 'add_product_image' && msg.photo) {
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        try {
            const fileLink = await bot.getFileLink(fileId);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            const timestamp = Date.now();
            const filename = `${timestamp}.jpg`;
            const form = new FormData();
            form.append('image', buffer, { filename: filename, contentType: 'image/jpeg' });
            const imageResponse = await axios.post('http://api:5000/api/images/upload', form, { headers: form.getHeaders() });
            const newProduct = {
                name: userState[chatId].productName,
                description: userState[chatId].productDescription,
                price: userState[chatId].productPrice,
                category: userState[chatId].productCategory,
                image: imageResponse.data.image.filename,
            };
            await axios.post('http://api:5000/api/products', newProduct);
            await sendMessageWithDelete(chatId, `Продукт "${newProduct.name}" успешно добавлен!`);
            setTimeout(async () => {
                await sendMessageWithDelete(chatId, 'Добро пожаловать в наш магазин! 👋🥩🐟🍞🥓🍲', mainMenu);
            }, 2000);
            delete userState[chatId];
        } catch (error) {
            console.error('Error creating product:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при создании продукта.');
        }
    } else if (userState[chatId].step === 'enter_quantity') {
        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity <= 0) {
            await sendMessageWithDelete(chatId, 'Пожалуйста, введите корректное количество (положительное число).');
            return;
        }
        userState[chatId].quantity = quantity;
        userState[chatId].step = 'enter_description';
        await sendMessageWithDelete(chatId, 'Введите описание к заказу (например, особые пожелания):');
    } else if (userState[chatId].step === 'enter_description') {
        userState[chatId].description = text;
        userState[chatId].step = 'enter_phone';
        await sendMessageWithDelete(chatId, 'Введите ваш контактный телефон:');
    } else if (userState[chatId].step === 'enter_phone') {
        if (!/^\+?\d{10,12}$/.test(text.replace(/\s/g, ''))) {
            await sendMessageWithDelete(chatId, 'Пожалуйста, введите корректный номер телефона (10-12 цифр).');
            return;
        }
        userState[chatId].phone = text;
        userState[chatId].step = 'enter_address';
        await sendMessageWithDelete(chatId, 'Введите адрес доставки:');
    } else if (userState[chatId].step === 'enter_address') {
        try {
            const order = {
                clientId: chatId.toString(),
                telegramId: msg.from.username || null,
                phone: userState[chatId].phone,
                products: [{
                    productId: userState[chatId].selectedProduct._id,
                    name: userState[chatId].selectedProduct.name,
                    quantity: userState[chatId].quantity,
                    price: userState[chatId].selectedProduct.price,
                }],
                description: userState[chatId].description,
                status: 'Новый',
                totalAmount: userState[chatId].selectedProduct.price * userState[chatId].quantity,
                paymentStatus: 'Ожидает оплаты',
                paymentMethod: 'Наличные',
                paymentDetails: { paidAmount: 0, paymentDate: null, transactionId: null, paymentProvider: null, receiptNumber: null },
                shippingAddress: text,
                deliveryInfo: { type: 'Курьер', trackingNumber: null, courierName: null, courierPhone: null, estimatedDeliveryDate: null, actualDeliveryDate: null, deliveryInstructions: userState[chatId].description },
                contactEmail: `${chatId}@telegram.com`,
                contactPhone: userState[chatId].phone,
                statusHistory: [{ status: 'Новый', timestamp: new Date(), comment: 'Заказ создан через Telegram бота', updatedBy: 'system' }]
            };
            console.log('Creating order with data:', JSON.stringify(order, null, 2));
            await axios.post('http://api:5000/api/orders', order);
            let orderInfo = `Заказ успешно создан!\n\nПродукт: ${userState[chatId].selectedProduct.name}\nКоличество: ${userState[chatId].quantity}\nСумма: ${order.totalAmount} ₽\nТелефон: ${userState[chatId].phone}\nАдрес доставки: ${text}\nОписание: ${userState[chatId].description}\n\nСтатус: ${order.status}\nОплата: ${order.paymentStatus}\n\nСостав заказа:\n`;
            order.products.forEach((prod, index) => {
                orderInfo += `  ${index + 1}. ${prod.name} `;
                if (prod.quantity) { orderInfo += `x ${prod.quantity} `; }
                if (prod.price) {
                    orderInfo += `— Цена за штуку: ${prod.price} ₽, Итого: ${prod.price * prod.quantity} ₽\n`;
                }
            });
            await sendMessageWithDelete(chatId, orderInfo);
            setTimeout(async () => {
                await sendMessageWithDelete(chatId, 'Что желаете сделать дальше?', mainMenu);
            }, 2000);
            delete userState[chatId];
        } catch (error) {
            console.error('Error creating order:', error);
            const errorMessage = error.response?.data?.message || 'Произошла ошибка при создании заказа';
            await sendMessageWithDelete(chatId, `Ошибка: ${errorMessage}. Пожалуйста, попробуйте снова.`);
            setTimeout(async () => {
                await sendMessageWithDelete(chatId, 'Что желаете сделать дальше?', mainMenu);
            }, 2000);
        }
    }
});

app.listen(5001, () => {
    console.log('Telegram bot is running on port 5001');
});
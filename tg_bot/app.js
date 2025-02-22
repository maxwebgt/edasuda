/**
 * Telegram Bot for E-commerce
 * @lastModified 2025-02-23 06:57:26 UTC
 * @user maxwebgt
 *
 * This solution notifies the user who placed an order about any status changes.
 * After updating the order status via a callback (update_status), the bot updates the
 * order via the API and sends a notification in the chat that performed the update.
 * In addition, it always sends a notification to the order creator using the clientId
 * (field order.clientId), even if that user is the one performing the operation.
 *
 * Change: For "regular orders" (i.e. not "My orders") the additional information view includes
 * a "Cancel Order" button.
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

/**
 * Helper to check byte length in UTF-8.
 */
function getByteLength(str) {
    return Buffer.byteLength(str, 'utf8');
}

/**
 * Prepares reply markup for messages.
 * If inline_keyboard is provided, returns it; else returns the default keyboard.
 */
function prepareReplyMarkup(options = {}) {
    console.log('[prepareReplyMarkup] Incoming options:', options);
    if (options.reply_markup) {
        try {
            const markup =
                typeof options.reply_markup === 'string'
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

/**
 * Sends a message to a chat and deletes the last sent message (if exists).
 */
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

/**
 * Sends a photo to a chat and deletes the last sent message (if exists).
 */
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

//////////////////////
// Status mapping //
//////////////////////

// Map user-friendly statuses to short ASCII codes to keep callback_data compact.
const statusMap = {
    "Новый": "new",
    "Принят в работу": "in_work",
    "Готовится": "in_prep",
    "Готов к отправке": "ready",
    "В доставке": "delivering",
    "Доставлен": "delivered",
    "Завершён": "done",
    "Отменён": "cancelled",
    "Возврат": "refund"
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
    await sendMessageWithDelete(msg.chat.id, 'Добро пожаловать в наш магазин! 👋🥩🐟🍞🥓🍲', mainMenu);
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
        if (order.phone) detailsText += `Телефон: ${order.phone}\n`;
        if (order.description) detailsText += `Описание: ${order.description}\n`;
        if (order.paymentStatus) detailsText += `Статус оплаты: ${order.paymentStatus}\n`;
        if (order.paymentMethod) detailsText += `Метод оплаты: ${order.paymentMethod}\n`;
        if (order.contactEmail) detailsText += `Email: ${order.contactEmail}\n`;
        if (order.contactPhone) detailsText += `Контактный телефон: ${order.contactPhone}\n`;
        if (order.statusHistory && order.statusHistory.length > 0) {
            detailsText += `Дата создания: ${new Date(order.statusHistory[0].timestamp).toLocaleString()}\n`;
        }
        if (order.products && order.products.length > 0) {
            detailsText += `\nСостав заказа:\n`;
            try {
                const productPromises = order.products.map(prod =>
                    axios.get(`http://api:5000/api/products/${prod.productId}`)
                        .then(res => ({
                            name: res.data.name,
                            quantity: prod.quantity,
                            price: prod.price
                        }))
                        .catch(err => ({
                            name: 'Неизвестный продукт',
                            quantity: prod.quantity,
                            price: prod.price
                        }))
                );
                const productDetails = await Promise.all(productPromises);
                productDetails.forEach((p, index) => {
                    detailsText += `  ${index + 1}. ${p.name} x${p.quantity} — ${p.price} ₽ за шт, Итого: ${p.price * p.quantity} ₽\n`;
                });
            } catch (error) {
                console.error('Error fetching product details:', error);
            }
        }
        if (order.deliveryInfo && order.deliveryInfo.deliveryInstructions) {
            detailsText += `\nИнструкция по доставке: ${order.deliveryInfo.deliveryInstructions}\n`;
        }
        // For "My orders" show only status update buttons.
        // For regular orders, include a "Cancel Order" button.
        if (userState[chatId] && userState[chatId].orderListType === 'my_orders') {
            const statuses = [
                'Новый',
                'Принят в работу',
                'Готовится',
                'Готов к отправке',
                'В доставке',
                'Доставлен',
                'Завершён',
                'Отменён',
                'Возврат'
            ];
            const inlineStatusButtons = [];
            for (let i = 0; i < statuses.length; i += 3) {
                const row = statuses.slice(i, i + 3).map(status => {
                    const shortStatus = statusMap[status] || status;
                    const callbackData = `update_status::${order._id}::${shortStatus}`;
                    console.log(`[Status Button] Generated callback_data: "${callbackData}", length: ${callbackData.length}, byte length: ${getByteLength(callbackData)}`);
                    return { text: status, callback_data: callbackData };
                });
                inlineStatusButtons.push(row);
            }
            inlineStatusButtons.push([{ text: '⬅️ Назад', callback_data: 'my_orders' }]);
            const inlineKeyboard = { inline_keyboard: inlineStatusButtons };
            await sendMessageWithDelete(chatId, detailsText, { reply_markup: JSON.stringify(inlineKeyboard) });
        } else {
            // Regular orders: add "Cancel Order" and "⬅️ Back" buttons.
            const inlineKeyboard = {
                inline_keyboard: [
                    [{ text: 'Отменить заказ', callback_data: `cancel_order_${order._id}` }],
                    [{ text: '⬅️ Назад', callback_data: 'orders_list' }]
                ]
            };
            await sendMessageWithDelete(chatId, detailsText, { reply_markup: JSON.stringify(inlineKeyboard) });
        }
    }
    else if (data.startsWith('update_status::')) {
        // Format: update_status::<order_id>::<newStatus>
        const parts = data.split("::");
        if (parts.length >= 3) {
            const orderId = parts[1];
            const newStatusCode = parts.slice(2).join("::");
            const userFriendlyStatus = Object.keys(statusMap).find(key => statusMap[key] === newStatusCode) || newStatusCode;
            console.log(`[Status Update] Updating order ${orderId} to status "${userFriendlyStatus}" (code: ${newStatusCode})`);
            try {
                const updateResponse = await axios.put(`http://api:5000/api/orders/${orderId}`, { status: userFriendlyStatus });
                console.log(`[Status Update] Response:`, updateResponse.data);
                await sendMessageWithDelete(chatId, `Статус заказа ${orderId} изменен на "${userFriendlyStatus}"`);

                // Always send notification to the order creator using clientId, even if the updater is also the creator.
                const orderResponse = await axios.get(`http://api:5000/api/orders/${orderId}`);
                const order = orderResponse.data.order || orderResponse.data;
                if (order.clientId) {
                    const notificationText = `Ваш заказ №${order._id} обновлен.\nНовый статус: ${userFriendlyStatus}`;
                    try {
                        await bot.sendMessage(order.clientId, notificationText);
                        console.log(`Уведомление отправлено пользователю с clientId ${order.clientId}`);
                    } catch (notificationError) {
                        console.error(`Ошибка отправки уведомления пользователю с clientId ${order.clientId}:`, notificationError.message);
                    }
                }
            } catch (error) {
                console.error(`[Status Update] Error updating order ${orderId}:`, error.message);
                await sendMessageWithDelete(chatId, `Ошибка обновления статуса заказа ${orderId}`);
            }
        }
    }
    else if (data === 'orders_list') {
        await displayOrdersList(chatId);
    }
    else if (data === 'my_orders') {
        await displayMyOrders(chatId);
    }
    else if (data.startsWith('cancel_order_')) {
        const orderId = data.split('_')[2];
        console.log(`[Order Cancel] Received request to cancel order with id: ${orderId}`);
        try {
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
            userState[chatId] = { step: 'select_product', products };
            await sendMessageWithDelete(chatId, 'Вот список доступных продуктов:', { reply_markup: JSON.stringify({ inline_keyboard: productButtons }) });
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
                    [
                        { text: '🛍 Купить', callback_data: 'buy_product' },
                        { text: '⬅️ Назад', callback_data: 'back_to_products' }
                    ]
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

// Function to display all orders (non-filtered). Sets orderListType to "all"
async function displayOrdersList(chatId) {
    const ordersUrl = `http://api:5000/api/orders/client/${chatId}`;
    console.log(`[Orders List] Requesting orders from URL: ${ordersUrl}`);
    try {
        const response = await axios.get(ordersUrl);
        let orders = [];
        if (Array.isArray(response.data)) orders = response.data;
        else if (response.data.orders) orders = response.data.orders;
        if (orders.length === 0) {
            await sendMessageWithDelete(chatId, 'У вас пока нет заказов.');
            return;
        }
        userState[chatId] = userState[chatId] || {};
        userState[chatId].orderListType = 'all';
        console.log('[Orders List] Returned orders:', JSON.stringify(orders, null, 2));
        const inlineKeyboard = orders.map(order => {
            const orderIdShort = order._id.slice(-4);
            return [{
                text: `№${orderIdShort} • ${order.totalAmount} ₽ • ${order.status}`,
                callback_data: `view_order_${order._id}`
            }];
        });
        inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);
        const keyboardOptions = { inline_keyboard: inlineKeyboard };
        await sendMessageWithDelete(chatId, 'Ваши заказы:', { reply_markup: JSON.stringify(keyboardOptions) });
    } catch (error) {
        console.error('[Orders List] Error fetching orders:', error.message);
        await sendMessageWithDelete(chatId, 'Произошла ошибка при получении списка заказов.');
    }
}

// Function to display "my orders" (orders with at least one product where chefId equals current chatId).
// Sets orderListType to "my_orders"
async function displayMyOrders(chatId) {
    const ordersUrl = `http://api:5000/api/orders/client/${chatId}`;
    console.log(`[My Orders] Requesting orders from URL: ${ordersUrl}`);
    try {
        const response = await axios.get(ordersUrl);
        let orders = [];
        if (Array.isArray(response.data)) orders = response.data;
        else if (response.data.orders) orders = response.data.orders;
        if (orders.length === 0) {
            await sendMessageWithDelete(chatId, 'У вас пока нет заказов.');
            return;
        }
        const filteredOrders = [];
        for (const order of orders) {
            const productDetailsPromises = order.products.map(prod =>
                axios.get(`http://api:5000/api/products/${prod.productId}`)
                    .then(res => res.data)
                    .catch(err => null)
            );
            const productDetails = await Promise.all(productDetailsPromises);
            const hasMatchingProduct = productDetails.some(prod => prod && prod.chefId && prod.chefId.toString() === chatId.toString());
            if (hasMatchingProduct) filteredOrders.push(order);
        }
        if (filteredOrders.length === 0) {
            await sendMessageWithDelete(chatId, 'У вас пока нет заказов с продуктами, привязанными к вам.');
            return;
        }
        userState[chatId] = userState[chatId] || {};
        userState[chatId].orderListType = 'my_orders';
        console.log('[My Orders] Filtered orders:', JSON.stringify(filteredOrders, null, 2));
        const inlineKeyboard = filteredOrders.map(order => {
            const orderIdShort = order._id.slice(-4);
            return [{
                text: `№${orderIdShort} • ${order.totalAmount} ₽ • ${order.status}`,
                callback_data: `view_order_${order._id}`
            }];
        });
        inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);
        const keyboardOptions = { inline_keyboard: inlineKeyboard };
        await sendMessageWithDelete(chatId, 'Мои заказы:', { reply_markup: JSON.stringify(keyboardOptions) });
    } catch (error) {
        console.error('[My Orders] Error fetching orders:', error.message);
        await sendMessageWithDelete(chatId, 'Произошла ошибка при получении вашего списка заказов.');
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
                    [{ text: 'Мои заказы', callback_data: 'my_orders' }],
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
                chefId: chatId.toString()
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
                const prodName = prod.name || prod.productName || 'Неизвестный продукт';
                orderInfo += `  ${index + 1}. ${prodName} x ${prod.quantity} — ${prod.price} ₽ за шт, Итого: ${prod.price * prod.quantity} ₽\n`;
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
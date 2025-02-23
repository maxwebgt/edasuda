/**
 * Telegram Bot for E-commerce
 * @lastModified 2025-02-23 07:15:00 UTC
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
 *
 * New Functionality: When a client cancels an order (via the "cancel_order" button) the bot
 * will additionally notify all chefs associated with the products in that order. For each product,
 * the chefId is used as the chat id to send a notification.
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
 * Gets user role from API
 */
async function getUserRole(chatId) {
    if (!chatId) {
        console.error('[getUserRole] chatId не предоставлен');
        return null;
    }

    try {
        console.log(`[getUserRole] Запрос роли для пользователя ${chatId}`);
        const response = await axios.get(`http://api:5000/api/users/telegram/${chatId}`);
        console.log(`[getUserRole] Получены данные пользователя ${chatId}:`, response.data);
        return response.data.role;
    } catch (error) {
        console.error(`[getUserRole] Ошибка получения роли пользователя ${chatId}:`, error.message);
        return null;
    }
}
/**
 * Prepares reply markup for messages.
 * If inline_keyboard is provided, returns it; else returns the default keyboard.
 */
async function prepareReplyMarkup(options = {}, chatId) {
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

    try {
        // Получаем роль пользователя
        console.log(`[prepareReplyMarkup] Запрос роли для пользователя с chatId: ${chatId}`);
        const userRole = await getUserRole(chatId.toString());
        console.log(`[prepareReplyMarkup] Роль пользователя ${chatId}: ${userRole}`);

        const keyboard = [
            ['🍞 Каталог', '📋 Заказы']
        ];

        // Добавляем кнопку "Управление" только для поваров
        if (userRole === 'chef') {
            keyboard.push(['⚙️ Управление']);
        }

        keyboard.push(['❓ Помощь']);

        const replyKeyboard = {
            keyboard: keyboard,
            resize_keyboard: true,
        };

        console.log('[prepareReplyMarkup] Returning keyboard:', replyKeyboard);
        return replyKeyboard;
    } catch (error) {
        console.error('[prepareReplyMarkup] Ошибка при формировании клавиатуры:', error);
        // Возвращаем базовую клавиатуру в случае ошибки
        return {
            keyboard: [
                ['🍞 Каталог', '📋 Заказы'],
                ['❓ Помощь']
            ],
            resize_keyboard: true,
        };
    }
}

/**
 * Sends a message to a chat and deletes the last sent message (if exists).
 */
async function sendMessageWithDelete(chatId, text, options = {}) {
    try {
        if (lastBotMessages[chatId]) {
            try {
                await bot.deleteMessage(chatId, lastBotMessages[chatId]);
                console.log(`[sendMessageWithDelete] Удалено предыдущее сообщение для чата ${chatId}`);
            } catch (error) {
                console.log(`[sendMessageWithDelete] Ошибка удаления предыдущего сообщения: ${error.message}`);
            }
        }

        console.log(`[sendMessageWithDelete] Подготовка сообщения для чата ${chatId}`);
        const replyMarkup = await prepareReplyMarkup(options, chatId);
        const messageOptions = { ...options, reply_markup: replyMarkup };

        console.log(`[sendMessageWithDelete] Отправка сообщения в чат ${chatId}:`, { text, options: messageOptions });
        const message = await bot.sendMessage(chatId, text, messageOptions);
        lastBotMessages[chatId] = message.message_id;
        console.log(`[sendMessageWithDelete] Сообщение отправлено. ID: ${message.message_id}`);
        return message;
    } catch (error) {
        console.error('[sendMessageWithDelete] Ошибка отправки сообщения:', error);
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
        const replyMarkup = await prepareReplyMarkup(options, chatId); // Добавлен параметр chatId
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
    const username = msg.from.username;
    console.log(`[onText /start] Получен /start от пользователя ${chatId}, username: ${username || 'отсутствует'}`);

    const apiUrlUsers = 'http://api:5000/api/users';
    try {
        console.log(`[onText /start] Проверяем существование пользователя с telegramId: ${chatId}`);
        const response = await axios.get(apiUrlUsers);
        const users = response.data;
        const existingUser = users.find((u) => u.telegramId === chatId.toString());

        if (!existingUser) {
            console.log(`[onText /start] Пользователь с telegramId "${chatId}" не найден. Создаем нового пользователя.`);
            const payload = {
                telegramId: chatId.toString(),
                role: 'client',
                username: username || `user_${chatId}`,
                name: username || `user_${chatId}`  // Используем username в качестве name
            };
            console.log(`[onText /start] Создаем пользователя с данными:`, payload);
            await axios.post(apiUrlUsers, payload);
            console.log(`[onText /start] Новый пользователь создан с telegramId: ${chatId}, name: ${payload.name}`);
        } else {
            console.log(`[onText /start] Пользователь с telegramId "${chatId}" уже существует.`);
        }
    } catch (error) {
        console.error('[onText /start] Ошибка при работе с API:', error.message);
        if (error.response && error.response.data) {
            console.error('[onText /start] Данные ошибки:', error.response.data);
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
        const parts = data.split("::");
        if (parts.length >= 3) {
            const orderId = parts[1];
            const newStatusCode = parts.slice(2).join("::");
            const userFriendlyStatus = Object.keys(statusMap)
                .find(key => statusMap[key] === newStatusCode) || newStatusCode;

            console.log(`[Обновление статуса] Обработка изменения статуса заказа ${orderId}`);
            console.log(`[Обновление статуса] Новый статус: "${userFriendlyStatus}" (код: ${newStatusCode})`);
            console.log(`[Обновление статуса] Изменение инициировано пользователем: ${chatId}`);

            try {
                // Получаем текущий заказ до обновления
                const currentOrderResponse = await axios.get(`http://api:5000/api/orders/${orderId}`);
                const currentOrder = currentOrderResponse.data.order || currentOrderResponse.data;
                console.log(`[Обновление статуса] Текущее состояние заказа:`, currentOrder);

                // Получаем информацию об инициаторе изменений
                const initiator = {
                    chatId: chatId.toString(),
                    isChef: currentOrder.chefId === chatId.toString(),
                    isClient: currentOrder.clientId === chatId.toString(),
                };
                console.log(`[Обновление статуса] Инициатор изменения:`, initiator);

                // Обновляем статус заказа
                const updateResponse = await axios.put(`http://api:5000/api/orders/${orderId}`, {
                    status: userFriendlyStatus
                });
                const updatedOrder = updateResponse.data.order || updateResponse.data;
                console.log(`[Обновление статуса] Заказ успешно обновлен:`, updatedOrder);

                // Получаем информацию о продуктах
                const productPromises = currentOrder.products.map(async prod => {
                    try {
                        const productResponse = await axios.get(`http://api:5000/api/products/${prod.productId}`);
                        return {
                            ...prod,
                            name: productResponse.data.name,
                            chefId: productResponse.data.chefId
                        };
                    } catch (err) {
                        console.error(`[Обновление статуса] Ошибка получения информации о продукте ${prod.productId}:`, err.message);
                        return prod;
                    }
                });

                const products = await Promise.all(productPromises);
                console.log(`[Обновление статуса] Информация о продуктах:`, products);

                // Формируем базовое уведомление
                const timestamp = new Date().toLocaleString('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const baseNotification =
                    `🔄 Обновление статуса заказа\n\n` +
                    `📦 Заказ №${orderId.slice(-4)}\n` +
                    `📝 Новый статус: ${userFriendlyStatus}\n` +
                    `🕒 Время изменения: ${timestamp}\n\n` +
                    `💰 Сумма заказа: ${updatedOrder.totalAmount} ₽\n` +
                    `📍 Адрес доставки: ${updatedOrder.shippingAddress}\n\n` +
                    `📋 Состав заказа:\n`;

                // Добавляем информацию о продуктах
                const productsInfo = products.map((prod, index) =>
                    `${index + 1}. ${prod.name || 'Товар'} x${prod.quantity} — ${prod.price} ₽`
                ).join('\n');

                // Определяем роль инициатора для уведомлений
                let initiatorRole = 'Пользователь';
                if (initiator.isChef) initiatorRole = 'Повар';
                else if (initiator.isClient) initiatorRole = 'Клиент';

                // Отправляем уведомление клиенту
                if (updatedOrder.clientId) {
                    const clientNotification =
                        `${baseNotification}${productsInfo}\n\n` +
                        `${initiator.isClient ? '🔔 Вы изменили' : `👨‍🍳 ${initiatorRole} изменил`} статус вашего заказа\n` +
                        `💬 Комментарий: ${updatedOrder.description || 'Нет'}\n` +
                        `📞 Телефон повара: ${updatedOrder.chefPhone || 'Не указан'}`;

                    try {
                        await bot.sendMessage(updatedOrder.clientId, clientNotification);
                        console.log(`[Обновление статуса] ✅ Уведомление отправлено клиенту ${updatedOrder.clientId}`);
                    } catch (error) {
                        console.error(`[Обновление статуса] ❌ Ошибка отправки уведомления клиенту ${updatedOrder.clientId}:`, error.message);
                    }
                }

                // Отправляем уведомление поварам
                const uniqueChefIds = [...new Set(products.map(p => p.chefId))];
                console.log(`[Обновление статуса] Найдены повара для уведомления:`, uniqueChefIds);

                for (const chefId of uniqueChefIds) {
                    if (chefId) {
                        const chefNotification =
                            `${baseNotification}${productsInfo}\n\n` +
                            `${chefId === initiator.chatId ? '🔔 Вы изменили' : `👤 ${initiatorRole} изменил`} статус заказа\n` +
                            `💬 Дополнительная информация: ${updatedOrder.description || 'Нет'}\n` +
                            `📱 Контакты клиента:\n` +
                            `   Телефон: ${updatedOrder.contactPhone || 'Не указан'}\n` +
                            `   Telegram: ${updatedOrder.telegramId ? '@' + updatedOrder.telegramId : 'Не указан'}`;

                        try {
                            await bot.sendMessage(chefId, chefNotification);
                            console.log(`[Обновление статуса] ✅ Уведомление отправлено повару ${chefId}`);
                        } catch (error) {
                            console.error(`[Обновление статуса] ❌ Ошибка отправки уведомления повару ${chefId}:`, error.message);
                        }
                    }
                }

                // Подтверждение в чат, где было произведено изменение
                await sendMessageWithDelete(chatId, `Статус заказа №${orderId.slice(-4)} изменен на "${userFriendlyStatus}"`);

            } catch (error) {
                console.error(`[Обновление статуса] Ошибка:`, error.message);
                if (error.response?.data) {
                    console.error(`[Обновление статуса] Ошибка API:`, error.response.data);
                }
                await sendMessageWithDelete(chatId, `Ошибка обновления статуса заказа №${orderId.slice(-4)}`);
            }
        }
    }
    else if (data === 'expenses_menu') {
        const expensesMenu = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '📊 Все расходы', callback_data: 'view_expenses' }],
                    [{ text: '➕ Добавить расход', callback_data: 'add_expense' }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_management' }]
                ],
            }),
        };
        await sendMessageWithDelete(chatId, 'Управление расходами:', expensesMenu);
    }
    else if (data === 'view_expenses') {
        try {
            const response = await axios.get(`http://api:5000/api/expenses/chef/${chatId}`);
            const expenses = response.data;

            if (expenses.length === 0) {
                await sendMessageWithDelete(chatId, 'У вас пока нет расходов.');
                return;
            }

            // Подсчитываем общую сумму расходов
            const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

            let expensesList = 'Ваши расходы:\n\n';
            expensesList += `💵 Общая сумма расходов: ${totalAmount} ₽\n\n`;
            expensesList += 'Нажмите на расход для подробной информации:\n';

            // Создаем клавиатуру, где каждый расход - отдельная кнопка
            const inlineKeyboard = expenses.map(expense => ([{
                text: `${expense.title} - ${expense.amount} ₽`,
                callback_data: `view_expense_${expense._id}`
            }]));

            // Добавляем кнопку "Назад"
            inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'expenses_menu' }]);

            const keyboard = {
                reply_markup: JSON.stringify({
                    inline_keyboard: inlineKeyboard
                })
            };

            await sendMessageWithDelete(chatId, expensesList, keyboard);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при получении списка расходов.');
        }
    }
    else if (data === 'add_expense') {
        userState[chatId] = { step: 'add_expense_title' };
        await sendMessageWithDelete(chatId, 'Введите название расхода:');
    }
    else if (data === 'back_to_management') {
        // Возврат к меню управления
        const managementMenu = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '➕ Добавить продукт', callback_data: 'add_product' }],
                    [{ text: '💰 Расходы', callback_data: 'expenses_menu' }],
                    [{ text: '👨‍🍳 Мои заказы', callback_data: 'my_orders' }],
                    [{ text: '⬅️ Назад', callback_data: 'back_to_main' }]
                ],
            }),
        };
        await sendMessageWithDelete(chatId, 'Панель управления:', managementMenu);
    }
    else if (data === 'orders_list') {
        await displayOrdersList(chatId);
    }
    else if (data === 'my_orders') {
        await displayMyOrders(chatId);
    }
    else if (data.startsWith('cancel_order_')) {
        const orderId = data.split('_')[2];
        console.log(`[Отмена заказа] Получен запрос на отмену заказа: ${orderId}`);

        try {
            // Получаем информацию о заказе до отмены
            const currentOrderResponse = await axios.get(`http://api:5000/api/orders/${orderId}`);
            const currentOrder = currentOrderResponse.data.order || currentOrderResponse.data;
            console.log(`[Отмена заказа] Текущее состояние заказа:`, currentOrder);

            // Обновляем статус заказа на "Отменён"
            const cancelResponse = await axios.put(`http://api:5000/api/orders/${orderId}`, {
                status: 'Отменён'
            });
            const updatedOrder = cancelResponse.data.order || cancelResponse.data;
            console.log(`[Отмена заказа] Заказ успешно отменён:`, updatedOrder);

            // Получаем информацию о продуктах
            const productPromises = currentOrder.products.map(async prod => {
                try {
                    const productResponse = await axios.get(`http://api:5000/api/products/${prod.productId}`);
                    return {
                        ...prod,
                        name: productResponse.data.name,
                        chefId: productResponse.data.chefId
                    };
                } catch (err) {
                    console.error(`[Отмена заказа] Ошибка получения информации о продукте ${prod.productId}:`, err.message);
                    return prod;
                }
            });

            const products = await Promise.all(productPromises);
            console.log(`[Отмена заказа] Информация о продуктах:`, products);

            // Формируем базовое уведомление
            const timestamp = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const baseNotification =
                `❌ Заказ отменен\n\n` +
                `📦 Заказ №${orderId.slice(-4)}\n` +
                `🕒 Время отмены: ${timestamp}\n\n` +
                `💰 Сумма заказа: ${updatedOrder.totalAmount} ₽\n` +
                `📍 Адрес доставки: ${updatedOrder.shippingAddress}\n\n` +
                `📋 Состав заказа:\n`;

            // Добавляем информацию о продуктах
            const productsInfo = products.map((prod, index) =>
                `${index + 1}. ${prod.name || 'Товар'} x${prod.quantity} — ${prod.price} ₽`
            ).join('\n');

            // Отправляем уведомление клиенту
            if (updatedOrder.clientId) {
                const clientNotification =
                    `${baseNotification}${productsInfo}\n\n` +
                    `❗️ Заказ отменен\n` +
                    `💬 Дополнительная информация: ${updatedOrder.description || 'Нет'}\n` +
                    `📞 При возникновении вопросов свяжитесь с поваром: ${updatedOrder.chefPhone || 'Телефон не указан'}`;

                try {
                    await bot.sendMessage(updatedOrder.clientId, clientNotification);
                    console.log(`[Отмена заказа] ✅ Уведомление отправлено клиенту ${updatedOrder.clientId}`);
                } catch (error) {
                    console.error(`[Отмена заказа] ❌ Ошибка отправки уведомления клиенту ${updatedOrder.clientId}:`, error.message);
                }
            }

            // Отправляем уведомление поварам
            const uniqueChefIds = [...new Set(products.map(p => p.chefId))];
            console.log(`[Отмена заказа] Найдены повара для уведомления:`, uniqueChefIds);

            for (const chefId of uniqueChefIds) {
                if (chefId) {
                    const chefNotification =
                        `${baseNotification}${productsInfo}\n\n` +
                        `❗️ Заказ отменен\n` +
                        `💬 Дополнительная информация: ${updatedOrder.description || 'Нет'}\n` +
                        `📱 Контакты клиента:\n` +
                        `   Телефон: ${updatedOrder.contactPhone || 'Не указан'}\n` +
                        `   Telegram: ${updatedOrder.telegramId ? '@' + updatedOrder.telegramId : 'Не указан'}`;

                    try {
                        await bot.sendMessage(chefId, chefNotification);
                        console.log(`[Отмена заказа] ✅ Уведомление отправлено повару ${chefId}`);
                    } catch (error) {
                        console.error(`[Отмена заказа] ❌ Ошибка отправки уведомления повару ${chefId}:`, error.message);
                    }
                }
            }

            // Подтверждение для того, кто отменил заказ
            await sendMessageWithDelete(chatId, `Заказ №${orderId.slice(-4)} успешно отменён! ❌`);

        } catch (error) {
            console.error(`[Отмена заказа] Ошибка:`, error.message);
            if (error.response?.data) {
                console.error(`[Отмена заказа] Ошибка API:`, error.response.data);
            }
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
    else if (data.startsWith('view_expense_')) {
        try {
            const expenseId = data.split('view_expense_')[1];
            const response = await axios.get(`http://api:5000/api/expenses/${expenseId}`);
            const expense = response.data;

            let expenseDetails = `📋 Детали расхода:\n\n`;
            expenseDetails += `🏷 Название: ${expense.title}\n`;
            expenseDetails += `💰 Сумма: ${expense.amount} ₽\n`;
            expenseDetails += `📁 Категория: ${expense.category}\n`;
            expenseDetails += `📅 Дата: ${new Date(expense.date).toLocaleDateString()}\n`;
            if (expense.description) {
                expenseDetails += `📝 Описание: ${expense.description}\n`;
            }

            const keyboard = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '🗑 Удалить расход', callback_data: `delete_expense_${expenseId}` }],
                        [{ text: '⬅️ Назад к списку', callback_data: 'view_expenses' }]
                    ]
                })
            };

            await sendMessageWithDelete(chatId, expenseDetails, keyboard);
        } catch (error) {
            console.error('Error fetching expense details:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при получении деталей расхода.');
        }
    }
// Добавляем обработчик для удаления расхода
    else if (data.startsWith('delete_expense_')) {
        try {
            const expenseId = data.split('delete_expense_')[1];

            // Запрашиваем подтверждение удаления
            const confirmKeyboard = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [
                            { text: '✅ Да, удалить', callback_data: `confirm_delete_expense_${expenseId}` },
                            { text: '❌ Отмена', callback_data: `view_expense_${expenseId}` }
                        ]
                    ]
                })
            };

            await sendMessageWithDelete(chatId, 'Вы уверены, что хотите удалить этот расход?', confirmKeyboard);
        } catch (error) {
            console.error('Error preparing expense deletion:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при подготовке к удалению расхода.');
        }
    }
// Добавляем обработчик для подтверждения удаления
    else if (data.startsWith('confirm_delete_expense_')) {
        try {
            const expenseId = data.split('confirm_delete_expense_')[1];
            await axios.delete(`http://api:5000/api/expenses/${expenseId}`);

            await sendMessageWithDelete(chatId, 'Расход успешно удален!');

            // Возвращаемся к списку расходов через небольшую задержку
            setTimeout(async () => {
                try {
                    const response = await axios.get(`http://api:5000/api/expenses/chef/${chatId}`);
                    const expenses = response.data;

                    if (expenses.length === 0) {
                        await sendMessageWithDelete(chatId, 'У вас больше нет расходов.');
                        return;
                    }

                    // Повторно вызываем отображение списка расходов
                    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
                    let expensesList = 'Ваши расходы:\n\n';
                    expensesList += `💵 Общая сумма расходов: ${totalAmount} ₽\n\n`;
                    expensesList += 'Нажмите на расход для подробной информации:\n';

                    const inlineKeyboard = expenses.map(expense => ([{
                        text: `${expense.title} - ${expense.amount} ₽`,
                        callback_data: `view_expense_${expense._id}`
                    }]));
                    inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'expenses_menu' }]);

                    const keyboard = {
                        reply_markup: JSON.stringify({
                            inline_keyboard: inlineKeyboard
                        })
                    };

                    await sendMessageWithDelete(chatId, expensesList, keyboard);
                } catch (error) {
                    console.error('Error refreshing expenses list:', error);
                    await sendMessageWithDelete(chatId, 'Произошла ошибка при обновлении списка расходов.');
                }
            }, 1000);
        } catch (error) {
            console.error('Error deleting expense:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при удалении расхода.');
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
        console.log(`[buy_product] Starting purchase process for chat ${chatId}`);
        console.log(`[buy_product] Current user state:`, userState[chatId]);

        userState[chatId].step = 'enter_quantity';
        console.log(`[buy_product] Updated user state:`, userState[chatId]);

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
// Функция для отображения "моих заказов" (заказы, в которых chefId равен текущему chatId)
// Function to display "my orders" (orders where chefId equals current chatId)
async function displayMyOrders(chatId) {
    console.log(`[My Orders] Starting displayMyOrders for chatId: ${chatId}`);
    const ordersUrl = `http://api:5000/api/orders/chef/${chatId}`;

    try {
        console.log(`[My Orders] Requesting orders from URL: ${ordersUrl}`);
        const response = await axios.get(ordersUrl);

        let orders = Array.isArray(response.data) ? response.data :
            (response.data.orders || []);

        console.log(`[My Orders] Retrieved ${orders.length} orders for chef ${chatId}`);

        if (orders.length === 0) {
            await sendMessageWithDelete(chatId, 'У вас пока нет заказов, где вы указаны как повар.');
            return;
        }

        userState[chatId] = userState[chatId] || {};
        userState[chatId].orderListType = 'my_orders';

        // Создаем клавиатуру с заказами
        const inlineKeyboard = orders.map(order => {
            const orderIdShort = order._id.slice(-4);
            return [{
                text: `№${orderIdShort} • ${order.totalAmount} ₽ • ${order.status}`,
                callback_data: `view_order_${order._id}`
            }];
        });

        inlineKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_main' }]);

        const keyboardOptions = { inline_keyboard: inlineKeyboard };

        await sendMessageWithDelete(
            chatId,
            'Заказы, где вы указаны как повар:',
            { reply_markup: JSON.stringify(keyboardOptions) }
        );

    } catch (error) {
        console.error('[My Orders] Error fetching orders:', error);
        if (error.response) {
            console.error('[My Orders] Error response:', error.response.data);
        }
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
        try {
            const userRole = await getUserRole(chatId);
            if (userRole !== 'chef') {
                console.log(`[Управление] Отказано в доступе пользователю ${chatId}: недостаточно прав`);
                await sendMessageWithDelete(chatId, 'У вас нет доступа к этому разделу.');
                return;
            }

            const managementMenu = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: '➕ Добавить продукт', callback_data: 'add_product' }],
                        [{ text: '💰 Расходы', callback_data: 'expenses_menu' }], // Добавляем новую кнопку
                        [{ text: '👨‍🍳 Мои заказы', callback_data: 'my_orders' }],
                        [{ text: '⬅️ Назад', callback_data: 'back_to_main' }]
                    ],
                }),
            };
            await sendMessageWithDelete(chatId, 'Панель управления:', managementMenu);
        } catch (error) {
            console.error('[Управление] Ошибка:', error.message);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при доступе к панели управления.');
        }
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
    }
    else if (userState[chatId].step === 'add_expense_title') {
        userState[chatId].expenseTitle = text;
        userState[chatId].step = 'add_expense_amount';
        await sendMessageWithDelete(chatId, 'Введите сумму расхода:');
    }
    else if (userState[chatId].step === 'add_expense_amount') {
        const amount = parseFloat(text);
        if (isNaN(amount) || amount < 0) {
            await sendMessageWithDelete(chatId, 'Пожалуйста, введите корректную сумму.');
            return;
        }
        userState[chatId].expenseAmount = amount;
        userState[chatId].step = 'add_expense_category';
        await sendMessageWithDelete(chatId, 'Введите категорию расхода:');
    }
    else if (userState[chatId].step === 'add_expense_category') {
        userState[chatId].expenseCategory = text;
        userState[chatId].step = 'add_expense_description';
        await sendMessageWithDelete(chatId, 'Введите описание расхода (или отправьте "-" чтобы пропустить):');
    }
    else if (userState[chatId].step === 'add_expense_description') {
        try {
            const expenseData = {
                chefId: chatId.toString(),
                title: userState[chatId].expenseTitle,
                amount: userState[chatId].expenseAmount,
                category: userState[chatId].expenseCategory,
                description: text === '-' ? '' : text,
                date: new Date()
            };

            await axios.post('http://api:5000/api/expenses', expenseData);
            await sendMessageWithDelete(chatId, '✅ Расход успешно добавлен!');

            // Возвращаемся в меню расходов
            setTimeout(async () => {
                const expensesMenu = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{ text: '📊 Все расходы', callback_data: 'view_expenses' }],
                            [{ text: '➕ Добавить расход', callback_data: 'add_expense' }],
                            [{ text: '⬅️ Назад', callback_data: 'back_to_management' }]
                        ],
                    }),
                };
                await sendMessageWithDelete(chatId, 'Управление расходами:', expensesMenu);
            }, 1000);

            delete userState[chatId];
        } catch (error) {
            console.error('Error creating expense:', error);
            await sendMessageWithDelete(chatId, 'Произошла ошибка при создании расхода.');
        }
    }

    else if (userState[chatId].step === 'add_product_image' && msg.photo) {
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
        console.log(`[enter_quantity] Processing quantity for chat ${chatId}`);
        console.log(`[enter_quantity] Current state:`, userState[chatId]);

        const quantity = parseInt(text);
        if (isNaN(quantity) || quantity <= 0) {
            console.log(`[enter_quantity] Invalid quantity entered: ${text}`);
            await sendMessageWithDelete(chatId, 'Пожалуйста, введите корректное количество (положительное число).');
            return;
        }

        console.log(`[enter_quantity] Valid quantity entered: ${quantity}`);
        userState[chatId].quantity = quantity;
        userState[chatId].step = 'enter_description';
        console.log(`[enter_quantity] Updated state:`, userState[chatId]);

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
                statusHistory: [{ status: 'Новый', timestamp: new Date(), comment: 'Заказ создан через Telegram бота', updatedBy: 'system' }],
                chefId: userState[chatId].selectedProduct.chefId
            };

            console.log('[Order Creation] Creating order with data:', JSON.stringify(order, null, 2));
            const createResponse = await axios.post('http://api:5000/api/orders', order);
            const createdOrder = createResponse.data;

            // Формируем информацию о заказе
            let orderInfo = `Заказ успешно создан!\n\n` +
                `Продукт: ${userState[chatId].selectedProduct.name}\n` +
                `Количество: ${userState[chatId].quantity}\n` +
                `Сумма: ${order.totalAmount} ₽\n` +
                `Телефон: ${userState[chatId].phone}\n` +
                `Адрес доставки: ${text}\n` +
                `Описание: ${userState[chatId].description}\n\n` +
                `Статус: ${order.status}\n` +
                `Оплата: ${order.paymentStatus}\n\n` +
                `Состав заказа:\n`;

            order.products.forEach((prod, index) => {
                const prodName = prod.name || prod.productName || 'Неизвестный продукт';
                orderInfo += `  ${index + 1}. ${prodName} x ${prod.quantity} — ${prod.price} ₽ за шт, Итого: ${prod.price * prod.quantity} ₽\n`;
            });

            // Отправляем подтверждение клиенту
            await sendMessageWithDelete(chatId, orderInfo);

            // Отправляем уведомление повару
            if (order.chefId) {
                try {
                    const chefNotification =
                        `🔔 Новый заказ №${createdOrder._id || order._id}!\n\n` +
                        `📦 Продукт: ${userState[chatId].selectedProduct.name}\n` +
                        `📊 Количество: ${userState[chatId].quantity}\n` +
                        `💰 Сумма: ${order.totalAmount} ₽\n\n` +
                        `📝 Статус: ${order.status}\n` +
                        `📍 Адрес доставки: ${text}\n` +
                        `💭 Комментарий: ${order.description || 'Нет'}\n\n` +
                        `👤 Контакты клиента:\n` +
                        `📱 Телефон: ${order.contactPhone}\n` +
                        (order.telegramId ? `📧 Telegram: @${order.telegramId}` : '');

                    await bot.sendMessage(order.chefId, chefNotification);
                    console.log(`[Order Creation] Chef notification sent to ${order.chefId}`);
                } catch (notificationError) {
                    console.error('[Order Creation] Error sending chef notification:', notificationError);
                    // Не прерываем выполнение, так как основной заказ уже создан
                }
            }

            // Очищаем состояние и показываем главное меню
            setTimeout(async () => {
                await sendMessageWithDelete(chatId, 'Что желаете сделать дальше?', mainMenu);
            }, 2000);
            delete userState[chatId];

        } catch (error) {
            console.error('[Order Creation] Error:', error);
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
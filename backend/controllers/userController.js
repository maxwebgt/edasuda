const mongoose = require('mongoose');
const User = require('../models/userModel');

// Логгер для контроллера
const log = (method, message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [UserController:${method}] ${message}`,
        data ? JSON.stringify(data, null, 2) : '');
};

// Получение всех пользователей
exports.getAllUsers = async () => {
    log('getAllUsers', 'Request received');
    try {
        const users = await User.find({ isActive: true });
        log('getAllUsers', `Found ${users.length} users`);
        return users.map(user => user.toPublicJSON());
    } catch (error) {
        log('getAllUsers', 'Error occurred', { error: error.message });
        throw error;
    }
};

// Поиск или создание пользователя при входе в бот
exports.findOrCreateUser = async (telegramData) => {
    log('findOrCreateUser', 'Starting', {
        username: telegramData.username,
        chatId: telegramData.id,
        rawData: telegramData
    });

    try {
        // Поиск существующего пользователя
        let user = await User.findByAnyId(telegramData.username) ||
            await User.findByAnyId(telegramData.id);

        if (user) {
            log('findOrCreateUser', 'Existing user found', user.toPublicJSON());

            // Проверяем необходимость обновления данных
            const updates = {};
            if (!user.chatId || user.chatId !== String(telegramData.id)) {
                updates.chatId = String(telegramData.id);
            }
            if (!user.telegramId && telegramData.username) {
                updates.telegramId = telegramData.username;
            }
            if (!user.username && telegramData.username) {
                updates.username = telegramData.username;
            }
            updates.lastLoginAt = new Date();
            updates.isActive = true;

            if (Object.keys(updates).length > 0) {
                log('findOrCreateUser', 'Updating user data', updates);
                user = await User.findByIdAndUpdate(
                    user._id,
                    { $set: updates },
                    { new: true }
                );
                log('findOrCreateUser', 'User updated', user.toPublicJSON());
            }
        } else {
            // Создание нового пользователя
            log('findOrCreateUser', 'Creating new user', {
                telegramId: telegramData.username,
                chatId: String(telegramData.id)
            });

            user = new User({
                telegramId: telegramData.username,
                chatId: String(telegramData.id),
                username: telegramData.username,
                lastLoginAt: new Date(),
                isActive: true
            });

            await user.save();
            log('findOrCreateUser', 'New user created', user.toPublicJSON());
        }

        return user;
    } catch (error) {
        log('findOrCreateUser', 'Error occurred', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Поиск пользователя для создания заказа
exports.findUserForOrder = async (clientId) => {
    log('findUserForOrder', 'Starting search', {
        clientId,
        clientIdType: typeof clientId
    });

    try {
        const user = await User.findByAnyId(clientId);

        if (user) {
            log('findUserForOrder', 'User found', user.toPublicJSON());

            // Проверяем активность пользователя
            if (!user.isActive) {
                log('findUserForOrder', 'User is inactive');
                throw new Error('Пользователь неактивен');
            }
        } else {
            log('findUserForOrder', 'User not found');
        }

        return user;
    } catch (error) {
        log('findUserForOrder', 'Error occurred', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Обновление пользователя
exports.updateUser = async (userId, updateData) => {
    log('updateUser', 'Starting update', {
        userId,
        updateData
    });

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            log('updateUser', 'User not found');
            return null;
        }

        log('updateUser', 'User updated', user.toPublicJSON());
        return user;
    } catch (error) {
        log('updateUser', 'Error occurred', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Деактивация пользователя
exports.deactivateUser = async (userId) => {
    log('deactivateUser', 'Starting deactivation', { userId });

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { isActive: false } },
            { new: true }
        );

        if (!user) {
            log('deactivateUser', 'User not found');
            return null;
        }

        log('deactivateUser', 'User deactivated', user.toPublicJSON());
        return user;
    } catch (error) {
        log('deactivateUser', 'Error occurred', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};
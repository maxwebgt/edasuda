const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Логгер для маршрутов
const log = (method, path, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [UserRoutes:${method}] ${path}`,
        data ? JSON.stringify(data, null, 2) : '');
};

// Middleware для обработки ошибок
const errorHandler = (res, error, method) => {
    log(method, 'Error', {
        message: error.message,
        stack: error.stack
    });
    res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера',
        error: error.message
    });
};

// Получение всех пользователей
router.get('/', async (req, res) => {
    try {
        log('GET', '/', { query: req.query });
        const users = await userController.getAllUsers();
        res.json({ success: true, data: users });
    } catch (error) {
        errorHandler(res, error, 'GET /');
    }
});

// Поиск пользователя по ID
router.get('/:id', async (req, res) => {
    try {
        log('GET', '/:id', { params: req.params });
        const user = await userController.findUserForOrder(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
        errorHandler(res, error, 'GET /:id');
    }
});

// Создание или обновление пользователя из Telegram
router.post('/telegram', async (req, res) => {
    try {
        log('POST', '/telegram', { body: req.body });
        const user = await userController.findOrCreateUser(req.body);
        res.status(201).json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
        errorHandler(res, error, 'POST /telegram');
    }
});

// Обновление пользователя
router.put('/:id', async (req, res) => {
    try {
        log('PUT', '/:id', {
            params: req.params,
            body: req.body
        });

        const user = await userController.updateUser(req.params.id, req.body);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
        errorHandler(res, error, 'PUT /:id');
    }
});

// Деактивация пользователя
router.delete('/:id', async (req, res) => {
    try {
        log('DELETE', '/:id', { params: req.params });
        const user = await userController.deactivateUser(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            message: 'Пользователь деактивирован',
            data: user.toPublicJSON()
        });
    } catch (error) {
        errorHandler(res, error, 'DELETE /:id');
    }
});

// Логируем доступные методы при инициализации
log('INIT', 'Available controller methods', {
    methods: Object.keys(userController)
});

module.exports = router;
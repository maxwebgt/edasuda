const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Получение всех пользователей
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получение всех пользователей
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список всех пользователей
 *       500:
 *         description: Ошибка при получении пользователей
 */
router.get('/', userController.getAllUsers);

// Создание нового пользователя
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создание нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               telegramId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       500:
 *         description: Ошибка при создании пользователя
 */
router.post('/', userController.createUser);

// Получение пользователя по ID
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получение пользователя по ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 telegramId:
 *                   type: string
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка при получении пользователя
 */
router.get('/:id', userController.getUserById);

// Обновление пользователя
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновление информации о пользователе
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               telegramId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пользователь успешно обновлен
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка при обновлении пользователя
 */
router.put('/:id', userController.updateUser);

// Получение пользователя по telegramId
/**
 * @swagger
 * /api/users/telegram/{telegramId}:
 *   get:
 *     summary: Получение пользователя по telegramId
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: telegramId
 *         required: true
 *         schema:
 *           type: string
 *         description: Telegram ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 telegramId:
 *                   type: string
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка при получении пользователя
 */
router.get('/telegram/:telegramId', userController.getUserByTelegramId);

module.exports = router;

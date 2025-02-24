const express = require('express');
const router = express.Router();
const welcomeController = require('../controllers/welcomeController');

/**
 * @swagger
 * tags:
 *   name: Welcomes
 *   description: API для управления приветственными сообщениями
 */

/**
 * @swagger
 * /api/welcomes:
 *   post:
 *     summary: Создать новое приветствие
 *     tags: [Welcomes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Welcome'
 *     responses:
 *       201:
 *         description: Приветствие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Welcome'
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', welcomeController.create);

/**
 * @swagger
 * /api/welcomes:
 *   get:
 *     summary: Получить список всех приветствий
 *     tags: [Welcomes]
 *     responses:
 *       200:
 *         description: Список приветствий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Welcome'
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', welcomeController.getAll);

/**
 * @swagger
 * /api/welcomes/deactivate-all:
 *   put:
 *     summary: Деактивировать все приветствия
 *     tags: [Welcomes]
 *     responses:
 *       200:
 *         description: Все приветствия деактивированы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Ошибка сервера
 */
router.put('/deactivate-all', welcomeController.deactivateAll); // Переместили этот маршрут перед маршрутами с :id

/**
 * @swagger
 * /api/welcomes/{id}:
 *   get:
 *     summary: Получить приветствие по ID
 *     tags: [Welcomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID приветствия
 *     responses:
 *       200:
 *         description: Приветствие найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Welcome'
 *       404:
 *         description: Приветствие не найдено
 */
router.get('/:id', welcomeController.getOne);

/**
 * @swagger
 * /api/welcomes/{id}:
 *   put:
 *     summary: Обновить приветствие
 *     tags: [Welcomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID приветствия
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Welcome'
 *     responses:
 *       200:
 *         description: Приветствие обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Welcome'
 *       404:
 *         description: Приветствие не найдено
 */
router.put('/:id', welcomeController.update);

/**
 * @swagger
 * /api/welcomes/{id}:
 *   delete:
 *     summary: Удалить приветствие
 *     tags: [Welcomes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID приветствия
 *     responses:
 *       200:
 *         description: Приветствие успешно удалено
 *       404:
 *         description: Приветствие не найдено
 */
router.delete('/:id', welcomeController.delete);

module.exports = router;
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     NewsModel:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Заголовок новости
 *         content:
 *           type: string
 *           description: Содержание новости
 *         author:
 *           type: string
 *           description: Telegram ID автора
 *         image:
 *           type: string
 *           description: Путь к изображению
 *         status:
 *           type: string
 *           description: Статус новости (active, archived, draft)
 *           enum: [active, archived, draft]
 *         category:
 *           type: string
 *           description: Категория новости
 *         views:
 *           type: number
 *           description: Количество просмотров
 *         pinned:
 *           type: boolean
 *           description: Закреплена ли новость
 */

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Создать новость
 *     tags: [News]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsModel'
 *     responses:
 *       201:
 *         description: Новость создана
 */
router.post('/', newsController.createNews);

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Получить все новости
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Фильтр по категории
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Фильтр по автору
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список новостей
 */
router.get('/', newsController.getNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Получить новость по ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Новость найдена
 */
router.get('/:id', newsController.getNewsById);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Обновить новость
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsModel'
 *     responses:
 *       200:
 *         description: Новость обновлена
 */
router.put('/:id', newsController.updateNews);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Удалить новость
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Новость удалена
 */
router.delete('/:id', newsController.deleteNews);

/**
 * @swagger
 * /api/news/{id}/pin:
 *   put:
 *     summary: Закрепить/открепить новость
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Статус закрепления обновлен
 */
router.put('/:id/pin', newsController.togglePin);

module.exports = router;
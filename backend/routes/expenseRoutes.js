const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ExpenseModel:
 *       type: object
 *       required:
 *         - chefId
 *       properties:
 *         chefId:
 *           type: string
 *           description: Telegram ID повара
 *         title:
 *           type: string
 *           description: Название расхода
 *         amount:
 *           type: number
 *           description: Сумма расхода
 *         category:
 *           type: string
 *           description: Категория расхода
 *         date:
 *           type: string
 *           format: date-time
 *           description: Дата расхода
 *         description:
 *           type: string
 *           description: Описание расхода
 */

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Создать новый расход
 *     tags: [Expenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseModel'
 *     responses:
 *       201:
 *         description: Расход успешно создан
 */
router.post('/', expenseController.createExpense);

/**
 * @swagger
 * /api/expenses/chef/{chefId}:
 *   get:
 *     summary: Получить все расходы повара
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: chefId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список расходов
 */
router.get('/chef/:chefId', expenseController.getExpenses);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Получить расход по ID
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные расхода
 */
router.get('/:id', expenseController.getExpenseById);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Обновить расход
 *     tags: [Expenses]
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
 *             $ref: '#/components/schemas/ExpenseModel'
 *     responses:
 *       200:
 *         description: Расход обновлен
 */
router.put('/:id', expenseController.updateExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Удалить расход
 *     tags: [Expenses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Расход удален
 */
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
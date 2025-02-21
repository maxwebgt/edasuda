const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Получение всех заказов
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Получение всех заказов
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Список всех заказов
 *       500:
 *         description: Ошибка при получении заказов
 */
router.get('/', orderController.getAllOrders);

// Создание нового заказа
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Создание нового заказа
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               description:
 *                 type: string
 *                 description: Описание заказа
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               status:
 *                 type: string
 *                 default: 'В процессе'
 *               totalAmount:
 *                 type: number
 *               paymentStatus:
 *                 type: string
 *                 enum: ['Оплачено', 'Не оплачено', 'В процессе']
 *                 default: 'Не оплачено'
 *               paymentMethod:
 *                 type: string
 *                 enum: ['Наличные', 'Карта', 'Онлайн']
 *                 default: 'Наличные'
 *               shippingAddress:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Заказ успешно создан
 *       400:
 *         description: Неверный статус оплаты или метод оплаты
 *       500:
 *         description: Ошибка при создании заказа
 */
router.post('/', orderController.createOrder);

// Получение заказа по ID
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Получение заказа по ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заказа
 *     responses:
 *       200:
 *         description: Заказ найден
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Ошибка при получении заказа
 */
router.get('/:id', orderController.getOrderById);

// Обновление заказа
/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Обновление информации о заказе
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID заказа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               description:
 *                 type: string
 *                 description: Описание заказа
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               status:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               paymentStatus:
 *                 type: string
 *                 enum: ['Оплачено', 'Не оплачено', 'В процессе']
 *               paymentMethod:
 *                 type: string
 *                 enum: ['Наличные', 'Карта', 'Онлайн']
 *               shippingAddress:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Заказ успешно обновлен
 *       400:
 *         description: Неверный статус оплаты или метод оплаты
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Ошибка при обновлении заказа
 */
router.put('/:id', orderController.updateOrder);

module.exports = router;
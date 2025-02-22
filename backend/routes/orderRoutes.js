const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

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
 *                 description: ID клиента (если известен)
 *               telegramId:
 *                 type: string
 *                 description: Telegram ID клиента для поиска соответствующего пользователя (используется, если clientId не передан)
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                 description: Список продуктов заказа
 *               status:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               paymentStatus:
 *                 type: string
 *                 enum: [Оплачено, Не оплачено, В процессе]
 *               paymentMethod:
 *                 type: string
 *                 enum: [Наличные, Карта, Онлайн]
 *               shippingAddress:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               description:
 *                 type: string
 *                 description: Дополнительное описание заказа
 *     responses:
 *       201:
 *         description: Заказ успешно создан
 *       400:
 *         description: Ошибка валидации входных данных
 *       500:
 *         description: Ошибка при создании заказа
 */
router.post('/', orderController.createOrder);

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

/**
 * @swagger
 * /api/orders/client/{clientId}:
 *   get:
 *     summary: Получение заказов клиента по Telegram ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Telegram ID клиента
 *     responses:
 *       200:
 *         description: Список заказов клиента
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка при получении заказов клиента
 */
router.get('/client/:clientId', orderController.getClientOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Обновление заказа
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
 *                 enum: [Оплачено, Не оплачено, В процессе]
 *               paymentMethod:
 *                 type: string
 *                 enum: [Наличные, Карта, Онлайн]
 *               shippingAddress:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Заказ успешно обновлен
 *       404:
 *         description: Заказ не найден
 *       400:
 *         description: Ошибка валидации входных данных
 *       500:
 *         description: Ошибка при обновлении заказа
 */
router.put('/:id', orderController.updateOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Удаление заказа
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
 *         description: Заказ успешно удален
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Ошибка при удалении заказа
 */
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
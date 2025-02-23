const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * Order Routes
 * @author maxwebgt
 * @lastModified 2025-02-22 16:28:20 UTC
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - clientId
 *         - phone
 *         - products
 *         - totalAmount
 *         - shippingAddress
 *         - contactEmail
 *         - contactPhone
 *       properties:
 *         clientId:
 *           type: string
 *           description: ID клиента (chatId из Telegram)
 *         telegramId:
 *           type: string
 *           description: Username пользователя из Telegram
 *         phone:
 *           type: string
 *           description: Номер телефона клиента
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Новый, Принят в работу, Готовится, Готов к отправке, В доставке, Доставлен, Завершён, Отменён, Возврат]
 *           default: Новый
 *         totalAmount:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [Ожидает оплаты, Частично оплачен, Полностью оплачен, Ошибка оплаты, Возврат средств, Возврат выполнен, Платёж отклонён]
 *           default: Ожидает оплаты
 *         paymentMethod:
 *           type: string
 *           enum: [Наличные, Карта при получении, Онлайн оплата, СБП, Криптовалюта]
 *           default: Наличные
 *         paymentDetails:
 *           type: object
 *           properties:
 *             transactionId:
 *               type: string
 *             paidAmount:
 *               type: number
 *             paymentDate:
 *               type: string
 *               format: date-time
 *             paymentProvider:
 *               type: string
 *             receiptNumber:
 *               type: string
 *         shippingAddress:
 *           type: string
 *         deliveryInfo:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Самовывоз, Курьер, Почта, Транспортная компания]
 *             trackingNumber:
 *               type: string
 *             courierName:
 *               type: string
 *             courierPhone:
 *               type: string
 *             estimatedDeliveryDate:
 *               type: string
 *               format: date-time
 *             actualDeliveryDate:
 *               type: string
 *               format: date-time
 *             deliveryInstructions:
 *               type: string
 *         contactEmail:
 *           type: string
 *         contactPhone:
 *           type: string
 *         statusHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               comment:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *         chefId:
 *           type: string
 *           description: Идентификатор шефа, который ответственен за заказ
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Получить все заказы
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Список всех заказов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/client/{clientId}:
 *   get:
 *     summary: Получить заказы конкретного клиента
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID клиента (chatId из Telegram)
 *     responses:
 *       200:
 *         description: Список заказов клиента
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Ошибка сервера
 */
router.get('/client/:clientId', orderController.getOrdersByClientId);

/**
 * @swagger
 * /api/orders/chef/{chefId}:
 *   get:
 *     summary: Получить заказы по chefId
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: chefId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID шефа
 *     responses:
 *       200:
 *         description: Список заказов для указанного chefId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Ошибка сервера
 */
router.get('/chef/:chefId', orderController.getOrdersByChefId);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Получить заказ по ID
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
 *         description: Данные заказа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Создать новый заказ
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Заказ успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Неверные данные запроса
 *       500:
 *         description: Ошибка сервера
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Обновить заказ
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
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Заказ успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Заказ не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/:id', orderController.updateOrder);

module.exports = router;

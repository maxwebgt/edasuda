const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Получение всех продуктов
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получение всех продуктов
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список всех продуктов
 *       500:
 *         description: Ошибка при получении продуктов
 */
router.get('/', productController.getAllProducts);

// Создание нового продукта
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создание нового продукта
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *               stock:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [available, out_of_stock, pre_order]
 *                 default: available
 *               expirationDate:
 *                 type: string
 *               externalId:
 *                 type: string
 *               chefId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Продукт успешно создан
 *       500:
 *         description: Ошибка при создании продукта
 */
router.post('/', productController.createProduct);

// Получение продукта по ID
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получение продукта по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Продукт найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *                 category:
 *                   type: string
 *                 image:
 *                   type: string
 *                 stock:
 *                   type: number
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 status:
 *                   type: string
 *                 expirationDate:
 *                   type: string
 *                 externalId:
 *                   type: string
 *                 chefId:
 *                   type: string
 *       404:
 *         description: Продукт не найден
 *       500:
 *         description: Ошибка при получении продукта
 */
router.get('/:id', productController.getProductById);

// Обновление продукта
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновление информации о продукте
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID продукта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *               stock:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [available, out_of_stock, pre_order]
 *                 default: available
 *               expirationDate:
 *                 type: string
 *               externalId:
 *                 type: string
 *               chefId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Продукт успешно обновлен
 *       404:
 *         description: Продукт не найден
 *       500:
 *         description: Ошибка при обновлении продукта
 */
router.put('/:id', productController.updateProduct);

module.exports = router;

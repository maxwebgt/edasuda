const express = require('express');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
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
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', async (req, res) => {
    const { clientId, products } = req.body; // Продукты и клиент

    try {
        const client = await User.findById(clientId);
        if (!client || client.role !== 'client') {
            return res.status(400).json({ message: 'Client not found or invalid role' });
        }

        // Проверяем, что все продукты существуют и их можно заказать
        const productIds = products.map((item) => item.productId);
        const foundProducts = await Product.find({ _id: { $in: productIds } });
        if (foundProducts.length !== products.length) {
            return res.status(400).json({ message: 'One or more products not found' });
        }

        // Создаем заказ
        const newOrder = new Order({
            clientId,
            products,
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   clientId:
 *                     type: string
 *                   products:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                         quantity:
 *                           type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 */
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().populate('clientId').populate('products.productId');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

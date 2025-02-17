const express = require('express');
const Product = require('../models/productModel');
const User = require('../models/userModel'); // Для связи с поваром
const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the product
 *                   description:
 *                     type: string
 *                     description: Description of the product
 *                   price:
 *                     type: number
 *                     description: Price of the product
 *                   category:
 *                     type: string
 *                     description: Category of the product
 */
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
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
 *                 enum: [sosiki, vetchina, ryba]
 *               chefId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', async (req, res) => {
    const { name, description, price, category, chefId } = req.body;

    try {
        const chef = await User.findById(chefId); // Найдем повара по ID
        if (!chef || chef.role !== 'chef') {
            return res.status(400).json({ message: 'Chef not found or invalid role' });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            category,
            chef: chefId, // Привязываем повара к продукту
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

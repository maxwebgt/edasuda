const express = require('express');
const User = require('../models/userModel');  // Подключаем модель пользователя
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [chef, client]  # Роли: повар или клиент
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid role
 */
router.post('/', async (req, res) => {
    const { name, role } = req.body;

    try {
        if (!['chef', 'client'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be either chef or client.' });
        }

        const newUser = new User({
            name,
            role,
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The user ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [chef, client]
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

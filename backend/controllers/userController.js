const User = require('../models/userModel');

// Получение всех пользователей
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
};

// Создание нового пользователя
exports.createUser = async (req, res) => {
    const { name, email, password, role, telegramId } = req.body;

    try {
        const newUser = new User({
            name,
            email,
            password,  // Пароль будет захеширован автоматически
            role,
            telegramId,
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при создании пользователя' });
    }
};

// Получение пользователя по ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении пользователя' });
    }
};

// Обновление пользователя
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, telegramId } = req.body;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.password = password || user.password;  // Пароль будет захеширован        автоматически
        user.role = role || user.role;
        user.telegramId = telegramId || user.telegramId;

        await user.save();
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
};

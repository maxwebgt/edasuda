const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    telegramId: { type: String }, // Уникальный идентификатор в Telegram, не обязательный и не уникальный
    firstName: String,  // Имя пользователя
    lastName: String,   // Фамилия пользователя
    username: String,   // Логин пользователя в Telegram
    email: { type: String },  // Электронная почта пользователя (не обязательная и не уникальная)
    password: { type: String },  // Хэшированный пароль пользователя
    role: {
        type: String,
        enum: ['client', 'chef', 'moderator'],
        default: 'client'  // Роль по умолчанию
    }
});

// Хэшируем пароль перед сохранением пользователя, только если он был изменен и существует.
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Метод для проверки пароля
userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
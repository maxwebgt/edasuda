const mongoose = require('mongoose');

// Логгер для модели
const log = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [UserModel] ${message}`,
        data ? JSON.stringify(data, null, 2) : '');
};

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        sparse: true,
        index: true
    },
    chatId: {
        type: String,
        sparse: true,
        index: true
    },
    username: {
        type: String,
        sparse: true,
        index: true
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    strict: true
});

// Добавляем составной индекс для оптимизации поиска
userSchema.index({ telegramId: 1, chatId: 1 }, { sparse: true });

// Middleware перед сохранением
userSchema.pre('save', function(next) {
    log('Pre save middleware', {
        _id: this._id,
        telegramId: this.telegramId,
        chatId: this.chatId,
        username: this.username
    });
    next();
});

// Виртуальное поле для полного имени
userSchema.virtual('displayName').get(function() {
    return this.username || this.telegramId || this.chatId || 'Неизвестный пользователь';
});

// Методы экземпляра
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        telegramId: this.telegramId,
        chatId: this.chatId,
        username: this.username,
        displayName: this.displayName,
        isActive: this.isActive,
        lastLoginAt: this.lastLoginAt
    };
};

// Статические методы
userSchema.statics.findByAnyId = async function(id) {
    log('findByAnyId', { searchId: id });
    return this.findOne({
        $or: [
            { telegramId: id },
            { chatId: String(id) },
            { username: id }
        ]
    });
};

const User = mongoose.model('User', userSchema);

// Логируем инициализацию модели
log('Model initialized', {
    modelName: User.modelName,
    collectionName: User.collection.collectionName,
    indexes: userSchema.indexes()
});

module.exports = User;
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',  // Добавим дефолтное значение для описания
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        default: 'Uncategorized', // Если категория не указана, по умолчанию присваиваем 'Uncategorized'
    },
    image: {
        type: String,
        default: '',  // Поле для хранения URL изображения
    },
    video: {
        type: String,
        default: '',  // Поле для хранения URL видео
    },
    stock: {
        type: Number,
        default: 0,  // Количество в наличии
    },
    tags: {
        type: [String],  // Теги для классификации
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,  // Дата создания продукта
    },
    updatedAt: {
        type: Date,
        default: Date.now,  // Дата последнего обновления
    },
    status: {
        type: String,
        enum: ['available', 'out_of_stock', 'pre_order'],  // Статус товара
        default: 'available',
    },
    expirationDate: {
        type: String,  // Срок годности как строка (например, "31.12.2023")
        default: '',  // По умолчанию пустое значение
    },
    externalId: {
        type: String,
        // unique: true,  // Для внешних интеграций
        default: '',  // Оставляем пустым, если не используется
    },
    chefId: {
        type: String,  // ID пользователя, который создал продукт (например, айди повара)
        default: '',  // Значение по умолчанию пустая строка
    },
});

productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();  // Обновляем дату при каждом сохранении
    next();
});

module.exports = mongoose.model('Product', productSchema);
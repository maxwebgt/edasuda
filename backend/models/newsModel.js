const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    author: {
        type: String      // telegramId автора
    },
    image: {
        type: String      // путь к изображению или filename
    },
    status: {
        type: String,
        default: 'active' // active, archived, draft
    },
    category: {
        type: String      // категория новости
    },
    views: {
        type: Number,
        default: 0
    },
    pinned: {
        type: Boolean,
        default: false    // закреплена ли новость
    }
}, {
    timestamps: true      // автоматически добавит createdAt и updatedAt
});

// Индексы для оптимизации запросов
newsSchema.index({ createdAt: -1 }); // Для сортировки по дате
newsSchema.index({ category: 1 });    // Для фильтрации по категории
newsSchema.index({ author: 1 });      // Для фильтрации по автору
newsSchema.index({ pinned: 1 });      // Для фильтрации закрепленных новостей

const NewsModel = mongoose.model('News', newsSchema);

module.exports = NewsModel;
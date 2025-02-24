const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Welcome:
 *       type: object
 *       required: []
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный MongoDB ID
 *         title:
 *           type: string
 *           description: Заголовок приветствия
 *         photo:
 *           type: string
 *           description: URL или путь к фотографии
 *         video:
 *           type: string
 *           description: URL или путь к видео
 *         isActive:
 *           type: boolean
 *           description: Статус активности приветствия
 *           default: false
 *         description:
 *           type: string
 *           description: Описание приветствия
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления записи
 *       example:
 *         title: "Приветственное сообщение"
 *         photo: "https://example.com/photo.jpg"
 *         video: "https://example.com/video.mp4"
 *         isActive: false
 *         description: "Описание приветственного сообщения"
 */
const welcomeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    photo: {
        type: String,
        required: false
    },
    video: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Welcome', welcomeSchema);
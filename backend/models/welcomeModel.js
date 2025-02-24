const mongoose = require('mongoose');

const welcomeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    photo: {
        type: String,  // URL или путь к фото
        required: false
    },
    video: {
        type: String,  // URL или путь к видео
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
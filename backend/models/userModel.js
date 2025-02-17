const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['chef', 'client'], // Роли: повар и клиент
        required: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Продукты, за которые отвечает повар
});

const User = mongoose.model('User', userSchema);
module.exports = User;

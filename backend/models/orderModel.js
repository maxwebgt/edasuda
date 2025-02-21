const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
    },
    description: {  // Добавлено новое поле
        type: String,
        default: '', // Пустая строка по умолчанию
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    status: {
        type: String,
        default: 'В процессе',
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0, // Общая стоимость заказа, рассчитывается при создании заказа
    },
    paymentStatus: {
        type: String,
        enum: ['Оплачено', 'Не оплачено', 'В процессе'],
        default: 'Не оплачено',
    },
    paymentMethod: {
        type: String,
        enum: ['Наличные', 'Карта', 'Онлайн'],
        default: 'Наличные',
    },
    shippingAddress: {
        type: String,
        required: true,
    },
    contactEmail: {
        type: String,
        required: true,
    },
    contactPhone: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Дата создания заказа
    },
    updatedAt: {
        type: Date,
        default: Date.now, // Дата последнего обновления заказа
    },
});

// Автоматически обновляем updatedAt при каждом изменении
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', orderSchema);
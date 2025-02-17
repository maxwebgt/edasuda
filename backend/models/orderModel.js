const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true,
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
});

module.exports = mongoose.model('Order', orderSchema);

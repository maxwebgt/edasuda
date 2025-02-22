const mongoose = require('mongoose');

/**
 * Order Model
 * @author maxwebgt
 * @lastModified 2025-02-22 16:25:40 UTC
 */

const orderSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true
    },
    telegramId: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        required: true
    },
    products: [{
        productId: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: [
            'Новый',
            'Принят в работу',
            'Готовится',
            'Готов к отправке',
            'В доставке',
            'Доставлен',
            'Завершён',
            'Отменён',
            'Возврат'
        ],
        default: 'Новый'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: [
            'Ожидает оплаты',
            'Частично оплачен',
            'Полностью оплачен',
            'Ошибка оплаты',
            'Возврат средств',
            'Возврат выполнен',
            'Платёж отклонён'
        ],
        default: 'Ожидает оплаты'
    },
    paymentMethod: {
        type: String,
        enum: [
            'Наличные',
            'Карта при получении',
            'Онлайн оплата',
            'СБП',
            'Криптовалюта'
        ],
        default: 'Наличные'
    },
    paymentDetails: {
        transactionId: String,
        paidAmount: {
            type: Number,
            default: 0
        },
        paymentDate: Date,
        paymentProvider: String,
        receiptNumber: String
    },
    shippingAddress: {
        type: String,
        required: true
    },
    deliveryInfo: {
        type: {
            type: String,
            enum: ['Самовывоз', 'Курьер', 'Почта', 'Транспортная компания'],
            default: 'Курьер'
        },
        trackingNumber: String,
        courierName: String,
        courierPhone: String,
        estimatedDeliveryDate: Date,
        actualDeliveryDate: Date,
        deliveryInstructions: String
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String,
        required: true
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        comment: String,
        updatedBy: String
    }]
}, {
    timestamps: true
});

// Middleware для логирования
orderSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            comment: 'Статус изменен системой',
            updatedBy: 'system'
        });
    }

    console.log(`${new Date().toISOString()} [OrderModel:save] Saving order:`, {
        orderId: this._id,
        clientId: this.clientId,
        telegramId: this.telegramId,
        status: this.status,
        paymentStatus: this.paymentStatus,
        totalAmount: this.totalAmount
    });
    next();
});

module.exports = mongoose.model('Order', orderSchema);
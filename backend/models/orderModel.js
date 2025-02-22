const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: 'Количество должно быть целым числом'
            }
        }
    }],
    status: {
        type: String,
        required: true,
        enum: ['В обработке', 'Подтвержден', 'В процессе', 'Доставляется', 'Завершен', 'Отменен'],
        default: 'В процессе'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Оплачено', 'Не оплачено', 'В процессе'],
        default: 'Не оплачено'
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Наличные', 'Карта', 'Онлайн'],
        default: 'Наличные'
    },
    shippingAddress: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Простая валидация: 10-12 цифр
                return /^\d{10,12}$/.test(v);
            },
            message: props => `${props.value} не является корректным номером телефона!`
        }
    },
    contactEmail: {
        type: String,
        validate: {
            validator: function(v) {
                // Базовая валидация email
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} не является корректным email адресом!`
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Индексы для оптимизации поиска
orderSchema.index({ clientId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Middleware для обновления updatedAt перед сохранением
orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Виртуальное поле для полной информации о заказе
orderSchema.virtual('fullInfo').get(function() {
    return `Заказ #${this._id} - Клиент: ${this.clientId} - Статус: ${this.status} - Сумма: ${this.totalAmount}`;
});

// Метод для проверки возможности отмены заказа
orderSchema.methods.canBeCancelled = function() {
    const nonCancellableStatuses = ['Завершен', 'Доставляется'];
    return !nonCancellableStatuses.includes(this.status);
};

// Метод для подсчета общей суммы заказа
orderSchema.methods.calculateTotal = async function() {
    let total = 0;
    await this.populate('products.productId').execPopulate();

    this.products.forEach(item => {
        if (item.productId && item.productId.price) {
            total += item.productId.price * item.quantity;
        }
    });

    this.totalAmount = total;
    return total;
};

// Статический метод для поиска заказов клиента
orderSchema.statics.findByClient = function(clientId) {
    return this.find({ clientId })
        .populate('clientId', 'username email')
        .populate('products.productId', 'name price')
        .sort({ createdAt: -1 });
};

// Настройка toJSON для исключения служебных полей
orderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Order', orderSchema);
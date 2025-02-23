const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    chefId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    amount: {
        type: Number
    },
    category: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const ExpenseModel = mongoose.model('Expense', expenseSchema);

module.exports = ExpenseModel;
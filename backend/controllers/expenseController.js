const ExpenseModel = require('../models/expenseModel');

class ExpenseController {
    // Создание нового расхода
    async createExpense(req, res) {
        try {
            const expense = new ExpenseModel(req.body);
            await expense.save();
            res.status(201).json(expense);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Получение всех расходов конкретного повара
    async getExpenses(req, res) {
        try {
            const { chefId } = req.params;
            const expenses = await ExpenseModel.find({ chefId }).sort({ date: -1 });
            res.json(expenses);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Получение одного расхода по ID
    async getExpenseById(req, res) {
        try {
            const expense = await ExpenseModel.findById(req.params.id);
            if (!expense) {
                return res.status(404).json({ message: 'Расход не найден' });
            }
            res.json(expense);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Обновление расхода
    async updateExpense(req, res) {
        try {
            const expense = await ExpenseModel.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!expense) {
                return res.status(404).json({ message: 'Расход не найден' });
            }
            res.json(expense);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Удаление расхода
    async deleteExpense(req, res) {
        try {
            const expense = await ExpenseModel.findByIdAndDelete(req.params.id);
            if (!expense) {
                return res.status(404).json({ message: 'Расход не найден' });
            }
            res.json({ message: 'Расход успешно удален' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new ExpenseController();
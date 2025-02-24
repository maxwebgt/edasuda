const express = require('express');
const router = express.Router();
const welcomeController = require('../controllers/welcomeController');

// Создание новой записи
router.post('/', welcomeController.create);

// Получение всех записей
router.get('/', welcomeController.getAll);

// Получение одной записи по ID
router.get('/:id', welcomeController.getOne);

// Обновление записи
router.put('/:id', welcomeController.update);

// Удаление записи
router.delete('/:id', welcomeController.delete);

module.exports = router;
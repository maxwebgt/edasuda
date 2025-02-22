const Order = require('../models/orderModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
  console.log('\n=== Создание заказа ===');
  console.log('Время запроса:', new Date().toISOString());

  try {
    let {
      clientId,
      telegramId,
      products,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      shippingAddress,
      contactEmail,
      contactPhone,
      description
    } = req.body;

    // 1. Логирование входящих данных
    console.log('1. Входящие данные:');
    console.log('- clientId:', clientId, typeof clientId);
    console.log('- telegramId:', telegramId, typeof telegramId);
    console.log('- Остальные данные заказа:', {
      products,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      shippingAddress
    });

    // 2. Поиск пользователя
    let user = null;
    console.log('2. Поиск пользователя');

    // Пытаемся найти пользователя по разным параметрам
    try {
      if (telegramId) {
        console.log('- Поиск по переданному telegramId:', telegramId);
        user = await User.findOne({
          $or: [
            { telegramId: telegramId },
            { chatId: String(telegramId) }
          ]
        });
      }

      if (!user && clientId) {
        console.log('- Поиск по clientId:', clientId);
        if (mongoose.Types.ObjectId.isValid(clientId)) {
          user = await User.findById(clientId);
        } else {
          user = await User.findOne({
            $or: [
              { telegramId: clientId },
              { chatId: String(clientId) }
            ]
          });
        }
      }

      if (user) {
        console.log('- Пользователь найден:', {
          _id: user._id,
          telegramId: user.telegramId,
          chatId: user.chatId
        });
        clientId = user._id;
      } else {
        console.log('! Пользователь не найден');
        return res.status(400).json({
          message: 'Пользователь не найден. Необходима регистрация или корректный ID.'
        });
      }
    } catch (error) {
      console.error('Ошибка при поиске пользователя:', error);
      return res.status(500).json({ message: 'Ошибка при поиске пользователя' });
    }

    // 3. Валидация данных заказа
    console.log('3. Валидация данных заказа');

    const validPaymentStatuses = ['Оплачено', 'Не оплачено', 'В процессе'];
    const validPaymentMethods = ['Наличные', 'Карта', 'Онлайн'];

    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Неверный статус оплаты' });
    }

    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Неверный метод оплаты' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Необходимо указать продукты' });
    }

    // 4. Обработка продуктов
    console.log('4. Обработка продуктов');
    const productsWithObjectId = products.map(product => {
      console.log('- Проверка продукта:', product);

      if (!mongoose.Types.ObjectId.isValid(product.productId)) {
        console.error('! Неверный ID продукта:', product.productId);
        throw new Error(`Неверный ID продукта: ${product.productId}`);
      }

      if (!product.quantity || product.quantity <= 0) {
        console.error('! Неверное количество для продукта:', product.productId);
        throw new Error(`Неверное количество для продукта: ${product.productId}`);
      }

      return {
        ...product,
        productId: new mongoose.Types.ObjectId(product.productId)
      };
    });

    // 5. Создание заказа
    console.log('5. Создание заказа');
    const newOrder = new Order({
      clientId,
      products: productsWithObjectId,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      shippingAddress,
      contactEmail: contactEmail || user.email,
      contactPhone: contactPhone || user.phone,
      description: description || ''
    });

    // 6. Сохранение заказа
    console.log('6. Сохранение заказа');
    await newOrder.save();
    console.log('- Заказ успешно создан:', newOrder._id);

    res.status(201).json(newOrder);

  } catch (error) {
    console.error('! Ошибка при создании заказа:', error);
    res.status(500).json({
      message: error.message || 'Ошибка при создании заказа'
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
        .populate('clientId', 'username telegramId email')
        .populate('products.productId', 'name price');
    res.json(orders);
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
        .populate('clientId', 'username telegramId email')
        .populate('products.productId', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    console.error('Ошибка при получении заказа:', error);
    res.status(500).json({ message: 'Ошибка при получении заказа' });
  }
};

exports.getClientOrders = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    console.log('Поиск заказов для клиента:', clientId);

    // Поиск пользователя
    let user = null;
    if (mongoose.Types.ObjectId.isValid(clientId)) {
      user = await User.findById(clientId);
    } else {
      user = await User.findOne({
        $or: [
          { telegramId: clientId },
          { chatId: String(clientId) }
        ]
      });
    }

    if (!user) {
      console.log('Пользователь не найден:', clientId);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    console.log('Найден пользователь:', {
      _id: user._id,
      telegramId: user.telegramId,
      chatId: user.chatId
    });

    const orders = await Order.find({ clientId: user._id })
        .populate('products.productId', 'name price')
        .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Ошибка при получении заказов клиента:', error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.products) {
      updateData.products = updateData.products.map(product => ({
        ...product,
        productId: mongoose.Types.ObjectId.isValid(product.productId)
            ? product.productId
            : new mongoose.Types.ObjectId(product.productId)
      }));
    }

    const order = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    )
        .populate('clientId', 'username telegramId email')
        .populate('products.productId', 'name price');

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    console.error('Ошибка при обновлении заказа:', error);
    res.status(500).json({ message: 'Ошибка при обновлении заказа' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json({ message: 'Заказ успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении заказа:', error);
    res.status(500).json({ message: 'Ошибка при удалении заказа' });
  }
};
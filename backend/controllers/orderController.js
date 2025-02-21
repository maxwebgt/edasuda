const Order = require('../models/orderModel');
const mongoose = require('mongoose');

// Получение всех заказов
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении заказов' });
  }
};

// Создание нового заказа
exports.createOrder = async (req, res) => {
  const {
    clientId,
    products,
    status,
    totalAmount,
    paymentStatus,
    paymentMethod,
    shippingAddress,
    contactEmail,
    contactPhone,
    description // Добавлено новое поле
  } = req.body;

  // Проверка на корректность значений paymentStatus и paymentMethod
  const validPaymentStatuses = ['Оплачено', 'Не оплачено', 'В процессе'];
  const validPaymentMethods = ['Наличные', 'Карта', 'Онлайн'];

  if (!validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Неверный статус оплаты' });
  }

  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Неверный метод оплаты' });
  }

  // Проверка, что в products есть обязательные поля
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ message: 'Необходимо передать продукты' });
  }

  const productsWithObjectId = products.map(product => {
    // Проверка и преобразование productId в ObjectId
    if (!mongoose.Types.ObjectId.isValid(product.productId)) {
      return res.status(400).json({ message: `Неверный ID продукта: ${product.productId}` });
    }
    const { ObjectId } = mongoose.Types;
    console.log('Product ID:', product.productId);
    console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(product.productId));

    product.productId = new ObjectId(product.productId);
    // Проверка наличия quantity
    if (!product.quantity || product.quantity <= 0) {
      return res.status(400).json({ message: `Неверное количество для продукта с ID: ${product.productId}` });
    }

    return product;
  });

  try {
    const newOrder = new Order({
      clientId,
      products: productsWithObjectId,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      shippingAddress,
      contactEmail,
      contactPhone,
      description: description || '' // Добавлено новое поле с значением по умолчанию
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
};

// Получение заказа по ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении заказа' });
  }
};

// Обновление заказа
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const {
    clientId,
    products,
    status,
    totalAmount,
    paymentStatus,
    paymentMethod,
    shippingAddress,
    contactEmail,
    contactPhone,
    description // Добавлено новое поле
  } = req.body;

  // Проверка на корректность значений paymentStatus и paymentMethod
  const validPaymentStatuses = ['Оплачено', 'Не оплачено', 'В процессе'];
  const validPaymentMethods = ['Наличные', 'Карта', 'Онлайн'];

  if (!validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: 'Неверный статус оплаты' });
  }

  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ message: 'Неверный метод оплаты' });
  }

  // Преобразование productId в ObjectId для всех продуктов
  const productsWithObjectId = products.map(product => {
    if (!mongoose.Types.ObjectId.isValid(product.productId)) {
      return res.status(400).json({ message: `Неверный ID продукта: ${product.productId}` });
    }
    product.productId = new mongoose.Types.ObjectId(product.productId);
    return product;
  });

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    order.clientId = clientId || order.clientId;
    order.products = productsWithObjectId || order.products;
    order.status = status || order.status;
    order.totalAmount = totalAmount || order.totalAmount;
    order.paymentStatus = paymentStatus || order.paymentStatus;
    order.paymentMethod = paymentMethod || order.paymentMethod;
    order.shippingAddress = shippingAddress || order.shippingAddress;
    order.contactEmail = contactEmail || order.contactEmail;
    order.contactPhone = contactPhone || order.contactPhone;
    order.description = description !== undefined ? description : order.description; // Добавлено обновление description

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при обновлении заказа' });
  }
};
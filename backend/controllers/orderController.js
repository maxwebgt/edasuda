const Order = require('../models/orderModel');

/**
 * Order Controller
 * @author maxwebgt
 * @lastModified 2025-02-22 16:25:40 UTC
 */

// Логгер для контроллера
const log = (method, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [OrderController:${method}] ${message}`,
      data ? JSON.stringify(data, null, 2) : '');
};

// Получение всех заказов
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    log('getAllOrders', 'Error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов',
      error: error.message
    });
  }
};

// Получение заказов по clientId
exports.getOrdersByClientId = async (req, res) => {
  const { clientId } = req.params;
  log('getOrdersByClientId', 'Fetching orders', { clientId });

  try {
    const orders = await Order.find({ clientId: String(clientId) })
        .sort({ createdAt: -1 });

    log('getOrdersByClientId', `Found ${orders.length} orders`, { clientId });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    log('getOrdersByClientId', 'Error fetching orders', {
      error: error.message,
      clientId
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказов',
      error: error.message
    });
  }
};

// Получение заказа по ID
exports.getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    log('getOrderById', 'Error', { error: error.message, orderId: id });
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении заказа',
      error: error.message
    });
  }
};

// Создание заказа
exports.createOrder = async (req, res) => {
  log('createOrder', 'Received order data', req.body);

  try {
    const {
      clientId,
      telegramId,
      phone,
      products,
      description,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      paymentDetails,
      shippingAddress,
      deliveryInfo,
      contactEmail,
      contactPhone
    } = req.body;

    // Базовые проверки
    if (!clientId) {
      return res.status(400).json({ message: 'clientId обязателен' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'phone обязателен' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Необходимо указать продукты' });
    }

    // Создание заказа
    const newOrder = new Order({
      clientId: String(clientId),
      telegramId: telegramId || null,
      phone,
      products: products.map(product => ({
        productId: String(product.productId),
        quantity: Number(product.quantity),
        price: Number(product.price)
      })),
      description,
      status,
      totalAmount,
      paymentStatus,
      paymentMethod,
      paymentDetails,
      shippingAddress,
      deliveryInfo,
      contactEmail,
      contactPhone
    });

    log('createOrder', 'Order object before save', {
      clientId: newOrder.clientId,
      telegramId: newOrder.telegramId,
      phone: newOrder.phone,
      productsCount: newOrder.products.length
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Заказ успешно создан',
      order: newOrder
    });
  } catch (error) {
    log('createOrder', 'Error creating order', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании заказа',
      error: error.message
    });
  }
};

// Обновление заказа
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'products') {
          order.products = updateData.products.map(product => ({
            productId: String(product.productId),
            quantity: Number(product.quantity),
            price: Number(product.price)
          }));
        } else {
          order[key] = updateData[key];
        }
      }
    });

    await order.save();

    log('updateOrder', 'Order updated successfully', {
      orderId: order._id,
      clientId: order.clientId
    });

    res.json({
      success: true,
      message: 'Заказ успешно обновлен',
      order
    });
  } catch (error) {
    log('updateOrder', 'Error updating order', {
      error: error.message,
      orderId: id
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении заказа',
      error: error.message
    });
  }
};
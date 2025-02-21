const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');  // Подключаем маршруты для пользователей
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Настройка Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API for Order Management',
            version: '1.0.0',
            description: 'This is the API documentation for managing orders and products',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js', './routes/userRoutes.js'],  // Включаем файлы с аннотациями для Swagger
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Отображаем документацию Swagger на эндпоинте /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Отдаем HTML документ на корне
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Используем маршруты для продуктов, заказов и пользователей
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);  // Добавляем маршруты для пользователей

app.listen(5000, () => console.log('Server running on port 5000'));

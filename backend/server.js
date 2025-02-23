const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const newsRoutes = require('./routes/newsRoutes'); // Добавляем маршруты новостей
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
            description: 'This is the API documentation for managing orders, products, expenses and news',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
    },
    apis: ['./routes/*.js', './controllers/*.js', './routes/userRoutes.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Отображаем документацию Swagger на эндпоинте /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Отдаем HTML документ на корне
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/news', newsRoutes); // Добавляем маршруты новостей

app.listen(5000, () => console.log('Server running on port 5000'));
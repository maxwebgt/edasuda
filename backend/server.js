/**
 * Server configuration
 * @file server.js
 * @description Main server file for the application
 * @lastModified 2025-02-23 20:25:30
 * @user maxwebgt
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const newsRoutes = require('./routes/newsRoutes');
const videoRoutes = require('./routes/videoRoutes');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();

// Базовые middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Добавляем baseUrl middleware
app.use((req, res, next) => {
    res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
    next();
});

// Настройка Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API for Order Management',
            version: '1.0.0',
            description: 'This is the API documentation for managing orders, products, expenses, news and videos',
            contact: {
                name: 'maxwebgt',
                url: 'https://github.com/maxwebgt'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Video: {
                    type: 'object',
                    required: ['filename', 'originalName', 'contentType', 'size'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Уникальный идентификатор видео'
                        },
                        filename: {
                            type: 'string',
                            description: 'Имя файла в системе'
                        },
                        originalName: {
                            type: 'string',
                            description: 'Оригинальное имя файла'
                        },
                        title: {
                            type: 'string',
                            description: 'Название видео'
                        },
                        description: {
                            type: 'string',
                            description: 'Описание видео'
                        },
                        contentType: {
                            type: 'string',
                            description: 'MIME тип файла'
                        },
                        size: {
                            type: 'number',
                            description: 'Размер файла в байтах'
                        },
                        uploadedBy: {
                            type: 'string',
                            description: 'ID пользователя, загрузившего видео'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата и время создания'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата и время последнего обновления'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Сообщение об ошибке'
                        },
                        error: {
                            type: 'string',
                            description: 'Детали ошибки'
                        }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        tags: [
            {
                name: 'Videos',
                description: 'API эндпоинты для работы с видео'
            },
            {
                name: 'Products',
                description: 'API эндпоинты для работы с продуктами'
            },
            {
                name: 'Orders',
                description: 'API эндпоинты для работы с заказами'
            },
            {
                name: 'Users',
                description: 'API эндпоинты для работы с пользователями'
            },
            {
                name: 'News',
                description: 'API эндпоинты для работы с новостями'
            },
            {
                name: 'Expenses',
                description: 'API эндпоинты для работы с расходами'
            }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js', './models/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Отображение документации Swagger
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "API Documentation",
    customfavIcon: "/assets/favicon.ico"
}));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));
// Настройка статических файлов
app.use('/media', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.mp4')) {
            res.set({
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600'
            });
        }
    }
}));

// Создание необходимых директорий
const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/videos'),
    path.join(__dirname, 'uploads/images')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/videos', videoRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка 404
app.use((req, res, next) => {
    console.log(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        message: 'Маршрут не найден',
        path: req.url,
        method: req.method
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('[Error]', {
        message: err.message,
        stack: err.stack,
        path: req.url,
        method: req.method
    });

    res.status(err.status || 500).json({
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
/**
 * Video Routes
 * @file routes/videoRoutes.js
 * @description API routes for video operations
 * @lastModified 2025-02-23 21:36:07
 * @user maxwebgt
 */

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: API эндпоинты для работы с видео файлами
 *
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - filename
 *         - originalName
 *         - contentType
 *         - size
 *       properties:
 *         _id:
 *           type: string
 *           description: Уникальный идентификатор видео
 *         filename:
 *           type: string
 *           description: Имя файла в системе
 *         originalName:
 *           type: string
 *           description: Оригинальное имя файла
 *         title:
 *           type: string
 *           description: Название видео
 *         description:
 *           type: string
 *           description: Описание видео
 *         contentType:
 *           type: string
 *           description: MIME тип файла
 *         size:
 *           type: number
 *           description: Размер файла в байтах
 *         uploadedBy:
 *           type: string
 *           description: ID пользователя, загрузившего видео
 *         videoUrl:
 *           type: string
 *           description: URL для прямого доступа к видео
 *         streamUrl:
 *           type: string
 *           description: URL для стриминга видео
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления
 *
 *     VideoResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: File exists
 *         size:
 *           type: number
 *           example: 1048576
 *         path:
 *           type: string
 *           example: /app/uploads/videos/video.mp4
 *         isFile:
 *           type: boolean
 *           example: true
 *         permissions:
 *           type: number
 *           example: 33188
 *
 *     VideoStats:
 *       type: object
 *       properties:
 *         totalVideos:
 *           type: number
 *           description: Общее количество видео
 *         totalSize:
 *           type: number
 *           description: Общий размер всех видео в байтах
 *         averageSize:
 *           type: number
 *           description: Средний размер видео в байтах
 *
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Сообщение об ошибке
 *         error:
 *           type: string
 *           description: Детали ошибки
 *
 * /api/videos:
 *   get:
 *     summary: Получить список всех видео
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: Список видео успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/stats:
 *   get:
 *     summary: Получить статистику видео
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: Статистика успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoStats'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/upload:
 *   post:
 *     summary: Загрузить новое видео
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Видео файл
 *               title:
 *                 type: string
 *                 description: Название видео
 *               description:
 *                 type: string
 *                 description: Описание видео
 *     responses:
 *       201:
 *         description: Видео успешно загружено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Ошибка при загрузке
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/file/{filename}:
 *   get:
 *     summary: Получить видео файл по имени файла
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя файла видео
 *     responses:
 *       200:
 *         description: Видео файл
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Файл не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/{id}:
 *   get:
 *     summary: Получить видео по ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID видео
 *     responses:
 *       200:
 *         description: Видео найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Видео не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   put:
 *     summary: Обновить метаданные видео
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID видео
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Новое название видео
 *               description:
 *                 type: string
 *                 description: Новое описание видео
 *     responses:
 *       200:
 *         description: Видео обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Видео не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   delete:
 *     summary: Удалить видео
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID видео
 *     responses:
 *       200:
 *         description: Видео удалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Видео не найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/test/{filename}:
 *   get:
 *     summary: Тестовый эндпоинт для проверки доступа к видео файлу
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя файла для проверки
 *     responses:
 *       200:
 *         description: Информация о файле успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoResponse'
 *       404:
 *         description: Файл не найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/videos/test-stream/{filename}:
 *   get:
 *     summary: Тестовый эндпоинт для стриминга видео
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Имя файла для стриминга
 *     responses:
 *       200:
 *         description: Стрим видео файла
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Файл не найден
 *       500:
 *         description: Ошибка сервера при стриминге
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const videoController = require('../controllers/videoController');

// Настройка Multer для загрузки видео
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB максимальный размер файла
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Только видео файлы разрешены!'), false);
        }
    }
});

// Тестовый маршрут для проверки доступа к файлу
router.get('/test/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/videos', filename);

    console.log('Testing video access:', {
        requestedFile: filename,
        fullPath: filePath,
        exists: fs.existsSync(filePath)
    });

    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        console.log('File stats:', stat);
        res.json({
            message: 'File exists',
            size: stat.size,
            path: filePath,
            isFile: stat.isFile(),
            permissions: stat.mode
        });
    } else {
        res.status(404).json({
            message: 'File not found',
            path: filePath
        });
    }
});

// Тестовый маршрут для стриминга файла
router.get('/test-stream/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/videos', filename);

    console.log('[test-stream] Starting:', {
        filename,
        filePath,
        exists: fs.existsSync(filePath)
    });

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            message: 'File not found',
            path: filePath
        });
    }

    try {
        const stat = fs.statSync(filePath);
        const range = req.headers.range;

        if (!range) {
            console.log('[test-stream] Sending full file:', {
                size: stat.size,
                type: 'video/mp4'
            });

            res.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600'
            });

            const stream = fs.createReadStream(filePath);

            stream.on('open', () => console.log('[test-stream] Stream opened'));
            stream.on('end', () => console.log('[test-stream] Stream ended'));
            stream.on('error', (err) => {
                console.error('[test-stream] Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream error' });
                }
            });

            req.on('close', () => {
                console.log('[test-stream] Request closed');
                stream.destroy();
            });

            return stream.pipe(res);
        }

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;

        console.log('[test-stream] Sending range:', {
            start,
            end,
            chunksize,
            total: stat.size
        });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600'
        });

        const stream = fs.createReadStream(filePath, { start, end });

        stream.on('open', () => console.log('[test-stream] Range stream opened'));
        stream.on('end', () => console.log('[test-stream] Range stream ended'));
        stream.on('error', (err) => {
            console.error('[test-stream] Range stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Range stream error' });
            }
        });

        req.on('close', () => {
            console.log('[test-stream] Range request closed');
            stream.destroy();
        });

        return stream.pipe(res);

    } catch (error) {
        console.error('[test-stream] Error:', error);
        res.status(500).json({
            message: 'Error streaming video',
            error: error.message
        });
    }
});

// Основные API маршруты
router.get('/', videoController.getAllVideos);
router.get('/stats', videoController.getVideoStats);
router.post('/upload', upload.single('video'), videoController.uploadVideo);
router.get('/file/:filename', videoController.getVideoFileByFilename);
router.get('/:id', videoController.getVideoById);
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

module.exports = router;
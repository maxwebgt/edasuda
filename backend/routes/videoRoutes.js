const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: API endpoints for managing video files
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VideoUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the upload was successful
 *         video:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *               description: The name of the saved file
 *             originalname:
 *               type: string
 *               description: Original name of the uploaded file
 *             mimetype:
 *               type: string
 *               description: MIME type of the video
 *             size:
 *               type: number
 *               description: Size of the file in bytes
 *             url:
 *               type: string
 *               description: URL to access the video
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Always false for errors
 *         message:
 *           type: string
 *           description: Error message
 */

// Создаем абсолютный путь к директории с видео
const uploadDir = path.resolve(__dirname, '../uploads/videos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const debug = require('debug')('api:videos');
// Настройка хранилища для видео
// Настройка хранилища
// Настройка хранилища
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Настройка фильтра файлов
// Фильтр файлов
const fileFilter = (req, file, cb) => {
    console.log('[Video Upload] Received file:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
    });

    // Принимаем все видео форматы
    if (file.mimetype.startsWith('video/') ||
        file.originalname.match(/\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i)) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
}).single('video');

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a video file
 *     tags: [Videos]
 *     consumes:
 *       - multipart/form-data
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
 *                 description: Video file to upload (max 50MB)
 *     responses:
 *       200:
 *         description: Video successfully uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoUploadResponse'
 *       400:
 *         description: Invalid request or file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// В обработчике загрузки
router.get('/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    console.log('[Video Get] Request for video:', {
        filename,
        filePath,
        exists: fs.existsSync(filePath)
    });

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
        console.error(`[Video Get] File not found: ${filePath}`);
        return res.status(404).json({
            success: false,
            message: 'Video not found'
        });
    }

    try {
        // Получаем размер файла
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        // Настраиваем заголовки для стриминга
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('[Video Get] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending video file'
        });
    }
});

// Обработчик загрузки видео
router.post('/upload', (req, res) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('[Video Upload] Multer error:', err);
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            console.error('[Video Upload] Other error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file uploaded'
            });
        }

        // Возвращаем информацию о загруженном файле
        res.json({
            success: true,
            video: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: `/uploads/videos/${req.file.filename}`
            }
        });
    });
});


/**
 * @swagger
 * /api/videos/{filename}:
 *   delete:
 *     summary: Delete a video file
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Filename of the video to delete
 *     responses:
 *       200:
 *         description: Video successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Video deleted successfully
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:filename', async (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        await fs.promises.unlink(filePath);

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('[Video Delete] Error deleting video:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting video file'
        });
    }
});

// Middleware для обработки ошибок
router.use((error, req, res, next) => {
    console.error('[Video Router] Error:', error);

    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(413).json({
                    success: false,
                    message: 'File is too large. Maximum size is 50MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded. Maximum is 1 file'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${error.message}`
                });
        }
    }

    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error during video processing'
    });
});

module.exports = router;
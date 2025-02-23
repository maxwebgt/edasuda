/**
 * Video Controller
 * @file controllers/videoController.js
 * @description Controller for video operations
 * @lastModified 2025-02-23 21:34:16
 * @user maxwebgt
 */

const Video = require('../models/videoModel');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

/**
 * Get all videos
 */
const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find();
        const videosWithUrls = videos.map(video => ({
            ...video.toObject(),
            videoUrl: `${res.locals.baseUrl}/media/videos/${video.filename}`,
            streamUrl: `${res.locals.baseUrl}/api/videos/test-stream/${video.filename}`
        }));
        res.json(videosWithUrls);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении списка видео',
            error: error.message
        });
    }
};

/**
 * Get video statistics
 */
const getVideoStats = async (req, res) => {
    try {
        const totalCount = await Video.countDocuments();
        const totalSize = await Video.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$size' }
                }
            }
        ]);

        res.json({
            totalVideos: totalCount,
            totalSize: totalSize[0]?.total || 0,
            averageSize: totalCount > 0 ? (totalSize[0]?.total || 0) / totalCount : 0
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении статистики',
            error: error.message
        });
    }
};

/**
 * Upload a new video
 */
const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Видео не загружено' });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`;

        const video = new Video({
            filename: filename,
            originalName: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
            title: req.body.title || req.file.originalname,
            description: req.body.description || '',
            uploadedBy: req.body.uploadedBy || 'system'
        });

        const uploadsDir = path.join(__dirname, '../uploads/videos');
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, filename), req.file.buffer);

        await video.save();
        console.log('[VideoModel] Video saved:', video);

        const videoUrl = `${res.locals.baseUrl}/media/videos/${filename}`;

        res.status(201).json({
            message: 'Видео успешно загружено',
            video: {
                ...video.toObject(),
                videoUrl,
                streamUrl: `${res.locals.baseUrl}/api/videos/test-stream/${filename}`
            }
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({
            message: 'Ошибка при загрузке видео',
            error: error.message
        });
    }
};

/**
 * Stream video file by filename
 */
const getVideoFileByFilename = async (req, res) => {
    try {
        console.log(`[getVideoFileByFilename] Starting video stream for filename: ${req.params.filename}`);

        const filename = req.params.filename;
        const video = await Video.findOne({ filename });

        if (!video) {
            console.log(`[getVideoFileByFilename] Video not found in database: ${filename}`);
            return res.status(404).json({ message: 'Видео не найдено' });
        }

        const filePath = path.join(__dirname, '../uploads/videos', filename);
        console.log(`[getVideoFileByFilename] File path: ${filePath}`);

        try {
            await fs.access(filePath);
            console.log(`[getVideoFileByFilename] File exists: ${filePath}`);
        } catch (error) {
            console.error(`[getVideoFileByFilename] File access error:`, error);
            return res.status(404).json({
                message: 'Файл видео не найден',
                error: error.message
            });
        }

        const stat = await fs.stat(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        console.log(`[getVideoFileByFilename] File size: ${fileSize}, Range header: ${range}`);

        if (!range) {
            console.log('[getVideoFileByFilename] No range header, sending entire file');

            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': video.contentType || 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600'
            });

            const videoStream = fsSync.createReadStream(filePath);

            videoStream.on('open', () => console.log('[getVideoFileByFilename] Stream opened'));
            videoStream.on('end', () => console.log('[getVideoFileByFilename] Stream ended'));
            videoStream.on('error', (error) => {
                console.error('[getVideoFileByFilename] Stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        message: 'Ошибка при стриминге видео',
                        error: error.message
                    });
                }
            });

            req.on('close', () => {
                console.log('[getVideoFileByFilename] Request closed');
                videoStream.destroy();
            });

            return videoStream.pipe(res);
        }

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        console.log(`[getVideoFileByFilename] Streaming range: ${start}-${end}/${fileSize}`);

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': video.contentType || 'video/mp4',
            'Cache-Control': 'public, max-age=3600'
        });

        const videoStream = fsSync.createReadStream(filePath, { start, end });

        videoStream.on('open', () => console.log('[getVideoFileByFilename] Range stream opened'));
        videoStream.on('end', () => console.log('[getVideoFileByFilename] Range stream ended'));
        videoStream.on('error', (error) => {
            console.error('[getVideoFileByFilename] Range stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    message: 'Ошибка при стриминге видео',
                    error: error.message
                });
            }
        });

        req.on('close', () => {
            console.log('[getVideoFileByFilename] Range request closed');
            videoStream.destroy();
        });

        return videoStream.pipe(res);

    } catch (error) {
        console.error('[getVideoFileByFilename] Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Ошибка при получении видео',
                error: error.message
            });
        }
    }
};

/**
 * Get video by ID
 */
const getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Видео не найдено' });
        }

        const videoUrl = `${res.locals.baseUrl}/media/videos/${video.filename}`;

        res.json({
            ...video.toObject(),
            videoUrl,
            streamUrl: `${res.locals.baseUrl}/api/videos/test-stream/${video.filename}`
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении видео',
            error: error.message
        });
    }
};

/**
 * Update video metadata
 */
const updateVideo = async (req, res) => {
    try {
        const video = await Video.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                description: req.body.description
            },
            { new: true }
        );

        if (!video) {
            return res.status(404).json({ message: 'Видео не найдено' });
        }

        const videoUrl = `${res.locals.baseUrl}/media/videos/${video.filename}`;

        res.json({
            ...video.toObject(),
            videoUrl,
            streamUrl: `${res.locals.baseUrl}/api/videos/test-stream/${video.filename}`
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при обновлении видео',
            error: error.message
        });
    }
};

/**
 * Delete video
 */
const deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ message: 'Видео не найдено' });
        }

        const filePath = path.join(__dirname, '../uploads/videos', video.filename);
        try {
            await fs.unlink(filePath);
            console.log(`[deleteVideo] File deleted: ${filePath}`);
        } catch (error) {
            console.error('[deleteVideo] Error deleting file:', error);
        }

        await video.remove();
        res.json({ message: 'Видео успешно удалено' });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при удалении видео',
            error: error.message
        });
    }
};

module.exports = {
    getAllVideos,
    getVideoStats,
    uploadVideo,
    getVideoFileByFilename,
    getVideoById,
    updateVideo,
    deleteVideo
};
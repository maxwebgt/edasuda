/**
 * Video Controller Tests
 * @file controllers/videoController.test.js
 * @description Test suite for video controller operations
 * @lastModified 2025-02-24 12:18:23
 * @user maxwebgt
 */

const {
    getAllVideos,
    getVideoStats,
    uploadVideo,
    getVideoFileByFilename,
    getVideoById,
    updateVideo,
    deleteVideo
} = require('../controllers/videoController');
const Video = require('../models/videoModel');
const path = require('path');

// Mocking dependencies
jest.mock('../models/videoModel');
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockResolvedValue(undefined),
        access: jest.fn().mockResolvedValue(undefined),
        stat: jest.fn().mockResolvedValue({ size: 1000 }),
        unlink: jest.fn().mockResolvedValue(undefined)
    },
    createReadStream: jest.fn()
}));
jest.mock('path');

// Import fs after mocking
const fs = require('fs').promises;
const fsSync = require('fs');

describe('Video Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock request object
        req = {
            params: {},
            body: {},
            headers: {},
            file: {
                originalname: 'test.mp4',
                mimetype: 'video/mp4',
                size: 1024,
                buffer: Buffer.from('test')
            },
            on: jest.fn()
        };

        // Mock response object
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            writeHead: jest.fn(),
            locals: {
                baseUrl: 'http://localhost:3000'
            },
            headersSent: false
        };
    });

    describe('getAllVideos', () => {
        it('should return all videos with urls', async () => {
            // Ensure the mock video object has a top-level filename property
            const mockVideos = [
                {
                    filename: 'test1.mp4',
                    toObject: () => ({
                        _id: '1',
                        filename: 'test1.mp4',
                        title: 'Test Video 1'
                    })
                }
            ];

            Video.find.mockResolvedValue(mockVideos);

            await getAllVideos(req, res);

            expect(Video.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith([
                {
                    _id: '1',
                    filename: 'test1.mp4',
                    title: 'Test Video 1',
                    videoUrl: 'http://localhost:3000/media/videos/test1.mp4',
                    streamUrl: 'http://localhost:3000/api/videos/test-stream/test1.mp4'
                }
            ]);
        });

        it('should handle database errors', async () => {
            Video.find.mockRejectedValue(new Error('Database error'));

            await getAllVideos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при получении списка видео',
                error: 'Database error'
            });
        });
    });

    describe('getVideoStats', () => {
        it('should return correct video statistics', async () => {
            Video.countDocuments.mockResolvedValue(2);
            Video.aggregate.mockResolvedValue([{ total: 1000 }]);

            await getVideoStats(req, res);

            expect(res.json).toHaveBeenCalledWith({
                totalVideos: 2,
                totalSize: 1000,
                averageSize: 500
            });
        });

        it('should handle empty video collection', async () => {
            Video.countDocuments.mockResolvedValue(0);
            Video.aggregate.mockResolvedValue([]);

            await getVideoStats(req, res);

            expect(res.json).toHaveBeenCalledWith({
                totalVideos: 0,
                totalSize: 0,
                averageSize: 0
            });
        });

        it('should handle database errors', async () => {
            Video.countDocuments.mockRejectedValue(new Error('Database error'));

            await getVideoStats(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при получении статистики',
                error: 'Database error'
            });
        });
    });

    describe('uploadVideo', () => {
        it('should upload video successfully', async () => {
            const mockVideo = {
                filename: '123-test.mp4',
                toObject: () => ({
                    _id: '1',
                    filename: '123-test.mp4',
                    title: 'Test Video'
                }),
                save: jest.fn().mockResolvedValue(true)
            };

            Video.mockImplementation(() => mockVideo);
            path.join.mockReturnValue('/fake/path');

            await uploadVideo(req, res);

            expect(fs.mkdir).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Видео успешно загружено',
                video: expect.objectContaining({
                    _id: '1',
                    filename: '123-test.mp4'
                })
            }));
        });

        it('should handle missing file', async () => {
            req.file = null;

            await uploadVideo(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео не загружено'
            });
        });

        it('should handle file system errors', async () => {
            fs.mkdir.mockRejectedValue(new Error('File system error'));

            await uploadVideo(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при загрузке видео',
                error: 'File system error'
            });
        });
    });

    describe('getVideoFileByFilename', () => {
        it('should stream video file successfully for full file request', async () => {
            const mockVideo = {
                filename: 'test.mp4',
                contentType: 'video/mp4'
            };
            Video.findOne.mockResolvedValue(mockVideo);

            const mockStream = {
                pipe: jest.fn(),
                on: jest.fn((event, callback) => {
                    if (event === 'open') callback();
                    return mockStream;
                }),
                destroy: jest.fn()
            };
            fsSync.createReadStream.mockReturnValue(mockStream);
            req.params.filename = 'test.mp4';

            await getVideoFileByFilename(req, res);

            expect(res.writeHead).toHaveBeenCalled();
            expect(fsSync.createReadStream).toHaveBeenCalled();
        });

        it('should handle video not found in database', async () => {
            Video.findOne.mockResolvedValue(null);
            req.params.filename = 'nonexistent.mp4';

            await getVideoFileByFilename(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео не найдено'
            });
        });

        it('should stream video file for range requests', async () => {
            const mockVideo = {
                filename: 'test.mp4',
                contentType: 'video/mp4'
            };
            Video.findOne.mockResolvedValue(mockVideo);

            const mockStream = {
                pipe: jest.fn(),
                on: jest.fn().mockReturnThis(),
                destroy: jest.fn()
            };
            fsSync.createReadStream.mockReturnValue(mockStream);

            req.params.filename = 'test.mp4';
            req.headers.range = 'bytes=0-1000';

            await getVideoFileByFilename(req, res);

            expect(res.writeHead).toHaveBeenCalledWith(206, expect.any(Object));
            expect(fsSync.createReadStream).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
        });
    });

    describe('getVideoById', () => {
        it('should return video by id with urls', async () => {
            const mockVideo = {
                filename: 'test.mp4',
                toObject: () => ({
                    _id: '1',
                    filename: 'test.mp4',
                    title: 'Test Video'
                })
            };
            Video.findById.mockResolvedValue(mockVideo);
            req.params.id = '1';

            await getVideoById(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                _id: '1',
                filename: 'test.mp4',
                title: 'Test Video',
                videoUrl: expect.any(String),
                streamUrl: expect.any(String)
            }));
        });

        it('should handle video not found', async () => {
            Video.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await getVideoById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео не найдено'
            });
        });
    });

    describe('updateVideo', () => {
        it('should update video successfully', async () => {
            const mockUpdatedVideo = {
                filename: 'test.mp4',
                toObject: () => ({
                    _id: '1',
                    filename: 'test.mp4',
                    title: 'Updated Title',
                    description: 'Updated Description'
                })
            };
            Video.findByIdAndUpdate.mockResolvedValue(mockUpdatedVideo);

            req.params.id = '1';
            req.body = {
                title: 'Updated Title',
                description: 'Updated Description'
            };

            await updateVideo(req, res);

            expect(Video.findByIdAndUpdate).toHaveBeenCalledWith(
                '1',
                expect.objectContaining({
                    title: 'Updated Title',
                    description: 'Updated Description'
                }),
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                _id: '1',
                title: 'Updated Title',
                description: 'Updated Description'
            }));
        });

        it('should handle video not found', async () => {
            Video.findByIdAndUpdate.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await updateVideo(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео не найдено'
            });
        });
    });

    describe('deleteVideo', () => {
        it('should delete video successfully', async () => {
            const mockVideo = {
                filename: 'test.mp4',
                remove: jest.fn().mockResolvedValue(true)
            };
            Video.findById.mockResolvedValue(mockVideo);
            path.join.mockReturnValue('/fake/path');

            req.params.id = '1';

            await deleteVideo(req, res);

            expect(fs.unlink).toHaveBeenCalled();
            expect(mockVideo.remove).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео успешно удалено'
            });
        });

        it('should handle video not found', async () => {
            Video.findById.mockResolvedValue(null);
            req.params.id = 'nonexistent';

            await deleteVideo(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео не найдено'
            });
        });

        it('should handle file deletion error but still delete database entry', async () => {
            const mockVideo = {
                filename: 'test.mp4',
                remove: jest.fn().mockResolvedValue(true)
            };
            Video.findById.mockResolvedValue(mockVideo);
            fs.unlink.mockRejectedValue(new Error('File deletion error'));

            req.params.id = '1';

            await deleteVideo(req, res);

            expect(mockVideo.remove).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                message: 'Видео успешно удалено'
            });
        });
    });
});
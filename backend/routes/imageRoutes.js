const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');
const path = require('path');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       required:
 *         - filename
 *         - contentType
 *         - imageBase64
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the image
 *         filename:
 *           type: string
 *           description: The name of the image file
 *         title:
 *           type: string
 *           description: Title of the image
 *         description:
 *           type: string
 *           description: Description of the image
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tags
 *         contentType:
 *           type: string
 *           description: The MIME type of the image
 *         createdBy:
 *           type: string
 *           description: Username of the creator
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload a new image
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file
 *               title:
 *                 type: string
 *                 description: Title of the image
 *               description:
 *                 type: string
 *                 description: Description of the image
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/upload', upload.single('image'), imageController.uploadImage);

/**
 * @swagger
 * /api/images/search:
 *   get:
 *     summary: Search images by metadata
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for filename, title, description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator username
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of matching images
 *       500:
 *         description: Server error
 */
router.get('/search', imageController.searchImages);

/**
 * @swagger
 * /api/images/all:
 *   get:
 *     summary: Get all images with pagination
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of images per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, filename, title]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A paginated list of all images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                 totalImages:
 *                   type: integer
 *                   description: Total number of images
 *                 imagesPerPage:
 *                   type: integer
 *                   description: Number of images per page
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 */
router.get('/all', imageController.getAllImages);

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image data
 *       404:
 *         description: Image not found
 *   put:
 *     summary: Update an existing image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New image file (optional)
 *               title:
 *                 type: string
 *                 description: New title for the image
 *               description:
 *                 type: string
 *                 description: New description for the image
 *               tags:
 *                 type: string
 *                 description: New comma-separated tags
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       404:
 *         description: Image not found
 *       403:
 *         description: Not authorized to update this image
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 *       403:
 *         description: Not authorized to delete this image
 *       500:
 *         description: Server error
 */
router.get('/:id', imageController.getImageById);
router.get('/:id/file', imageController.getImageFileById);
router.put('/:id', upload.single('image'), imageController.updateImage);
router.delete('/:id', imageController.deleteImage);

// Новый маршрут для получения изображения по имени файла
router.get('/file/:filename', imageController.getImageFileByFilename);

module.exports = router;
const path = require('path');
const fs = require('fs');
const Image = require('../models/imageModel');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, tags } = req.body;
    const filename = req.file.originalname || 'unnamed-file';

    const newImage = new Image({
      filename,
      title: title || filename,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      contentType: req.file.mimetype || 'application/octet-stream',
      imageBase64: req.file.buffer.toString('base64'),
      createdBy: 'maxwebgt',
      createdAt: new Date('2025-02-21T11:27:53Z')
    });

    const savedImage = await newImage.save();
    res.status(201).json({
      message: 'Image uploaded successfully',
      image: {
        id: savedImage._id,
        filename: savedImage.filename,
        title: savedImage.title,
        description: savedImage.description,
        tags: savedImage.tags,
        contentType: savedImage.contentType,
        createdBy: savedImage.createdBy,
        createdAt: savedImage.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error uploading image',
      error: error.message
    });
  }
};

exports.getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving image', error: error.message });
  }
};

exports.getImageFileById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageBuffer = Buffer.from(image.imageBase64, 'base64');
    res.set({
      'Content-Type': image.contentType,
      'Content-Disposition': `inline; filename="${image.filename}"`,
      'Content-Length': imageBuffer.length
    });
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving image', error: error.message });
  }
};

exports.getImageFileByFilename = async (req, res) => {
  try {
    const filename = req.params.filename;
    const image = await Image.findOne({ filename });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageBuffer = Buffer.from(image.imageBase64, 'base64');
    res.set({
      'Content-Type': image.contentType,
      'Content-Disposition': `inline; filename="${image.filename}"`,
      'Content-Length': imageBuffer.length
    });
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving image', error: error.message });
  }
};

exports.searchImages = async (req, res) => {
  try {
    const {
      query,
      tags,
      createdBy,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (query) {
      filter.$text = { $search: query };
    }
    if (tags) {
      filter.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [images, total] = await Promise.all([
      Image.find(filter)
          .select('-imageBase64')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
      Image.countDocuments(filter)
    ]);

    res.status(200).json({
      images,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalImages: total,
      imagesPerPage: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching images', error: error.message });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const { title, description, tags } = req.body;

    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.createdBy !== 'maxwebgt') {
      return res.status(403).json({ message: 'Not authorized to update this image' });
    }

    const updateData = {
      title: title || image.title,
      description: description || image.description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : image.tags,
      updatedAt: new Date('2025-02-21T11:27:53Z')
    };

    if (req.file) {
      updateData.filename = req.file.originalname || image.filename;
      updateData.contentType = req.file.mimetype || image.contentType;
      updateData.imageBase64 = req.file.buffer.toString('base64');
    }

    const updatedImage = await Image.findByIdAndUpdate(
        imageId,
        updateData,
        { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Image updated successfully',
      image: {
        id: updatedImage._id,
        filename: updatedImage.filename,
        title: updatedImage.title,
        description: updatedImage.description,
        tags: updatedImage.tags,
        contentType: updatedImage.contentType,
        createdBy: updatedImage.createdBy,
        createdAt: updatedImage.createdAt,
        updatedAt: updatedImage.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating image',
      error: error.message
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.createdBy !== 'maxwebgt') {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }

    await Image.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [images, total] = await Promise.all([
      Image.find()
          .select('-imageBase64')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
      Image.countDocuments()
    ]);

    res.status(200).json({
      images,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalImages: total,
      imagesPerPage: parseInt(limit),
      timestamp: new Date('2025-02-21T11:27:53Z')
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error retrieving images',
      error: error.message,
      timestamp: new Date('2025-02-21T11:27:53Z')
    });
  }
};
/**
 * Video Model
 * @file models/videoModel.js
 * @description Mongoose model for video documents
 * @lastModified 2025-02-23 21:40:00
 * @user maxwebgt
 */

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);
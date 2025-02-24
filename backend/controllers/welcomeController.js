const Welcome = require('../models/welcomeModel');

exports.create = async (req, res) => {
    try {
        const welcome = new Welcome(req.body);
        const savedWelcome = await welcome.save();
        res.status(201).json(savedWelcome);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const welcomes = await Welcome.find();
        res.status(200).json(welcomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const welcome = await Welcome.findById(req.params.id);
        if (!welcome) {
            return res.status(404).json({ message: 'Welcome not found' });
        }
        res.status(200).json(welcome);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const welcome = await Welcome.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!welcome) {
            return res.status(404).json({ message: 'Welcome not found' });
        }
        res.status(200).json(welcome);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const welcome = await Welcome.findByIdAndDelete(req.params.id);
        if (!welcome) {
            return res.status(404).json({ message: 'Welcome not found' });
        }
        res.status(200).json({ message: 'Welcome deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
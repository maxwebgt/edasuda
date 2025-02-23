const Product = require('../models/productModel');

// Получение всех продуктов
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении продуктов' });
    }
};

// Создание нового продукта
exports.createProduct = async (req, res) => {
    const { name, description, price, category, image, video, stock, tags, status, expirationDate, externalId, chefId } = req.body;

    try {
        const newProduct = new Product({
            name,
            description,
            price,
            category,
            image,
            video,
            stock,
            tags,
            status,
            expirationDate,
            externalId,
            chefId
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при создании продукта' });
    }
};

// Получение продукта по ID
exports.getProductById = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при получении продукта' });
    }
};

// Обновление продукта
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, image, video, stock, tags, status, expirationDate, externalId, chefId } = req.body;

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.image = image || product.image;
        product.video = video || product.video;
        product.stock = stock || product.stock;
        product.tags = tags || product.tags;
        product.status = status || product.status;
        product.expirationDate = expirationDate || product.expirationDate;
        product.externalId = externalId || product.externalId;
        product.chefId = chefId || product.chefId;

        await product.save();
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка при обновлении продукта' });
    }
};
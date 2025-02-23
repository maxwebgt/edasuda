const NewsModel = require('../models/newsModel');

class NewsController {
    // Создание новости
    async createNews(req, res) {
        try {
            const news = new NewsModel(req.body);
            await news.save();
            res.status(201).json(news);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Получение всех новостей с возможностью фильтрации
    async getNews(req, res) {
        try {
            const filter = {};
            if (req.query.category) filter.category = req.query.category;
            if (req.query.author) filter.author = req.query.author;
            if (req.query.status) filter.status = req.query.status;

            const news = await NewsModel.find(filter)
                .sort({ pinned: -1, createdAt: -1 }); // Сначала закрепленные, потом по дате
            res.json(news);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Получение одной новости по ID
    async getNewsById(req, res) {
        try {
            const news = await NewsModel.findById(req.params.id);
            if (!news) {
                return res.status(404).json({ message: 'Новость не найдена' });
            }
            // Увеличиваем счетчик просмотров
            news.views += 1;
            await news.save();
            res.json(news);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Обновление новости
    async updateNews(req, res) {
        try {
            const news = await NewsModel.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!news) {
                return res.status(404).json({ message: 'Новость не найдена' });
            }
            res.json(news);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Удаление новости
    async deleteNews(req, res) {
        try {
            const news = await NewsModel.findByIdAndDelete(req.params.id);
            if (!news) {
                return res.status(404).json({ message: 'Новость не найдена' });
            }
            res.json({ message: 'Новость успешно удалена' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Закрепление/открепление новости
    async togglePin(req, res) {
        try {
            const news = await NewsModel.findById(req.params.id);
            if (!news) {
                return res.status(404).json({ message: 'Новость не найдена' });
            }
            news.pinned = !news.pinned;
            await news.save();
            res.json(news);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new NewsController();
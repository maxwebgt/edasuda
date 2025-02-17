const axios = require('axios');

// Асинхронная функция для получения данных с API
async function testApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/products');
        console.log('Продукты, полученные с API:', response.data);
    } catch (error) {
        console.error('Ошибка при получении данных с API:', error.message);
    }
}

// Вызов функции для тестирования
testApi();

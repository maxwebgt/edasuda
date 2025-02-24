const User = require('../models/userModel');
const userController = require('./userController');

// Мокаем модель User
jest.mock('../models/userModel');

// Подготовка mock-объектов для req и res
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (body = {}, params = {}) => ({
    body,
    params
});

// Тестовые данные
const mockUser = {
    _id: '123',
    firstName: 'Test User',
    email: 'test@test.com',
    password: 'hashedPassword',
    role: 'user',
    telegramId: '12345',
    save: jest.fn()
};

const mockUsers = [
    mockUser,
    {
        _id: '456',
        firstName: 'Another User',
        email: 'another@test.com',
        role: 'admin',
        telegramId: '67890'
    }
];

describe('UserController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should return all users successfully', async () => {
            User.find.mockResolvedValue(mockUsers);
            
            const req = mockRequest();
            const res = mockResponse();

            await userController.getAllUsers(req, res);

            expect(User.find).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockUsers);
        });

        it('should handle errors when getting all users', async () => {
            const error = new Error('Database error');
            User.find.mockRejectedValue(error);
            
            const req = mockRequest();
            const res = mockResponse();

            await userController.getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ 
                message: 'Ошибка при получении пользователей' 
            });
        });
    });

    describe('createUser', () => {
        const newUserData = {
            name: 'New User',
            email: 'new@test.com',
            password: 'password123',
            role: 'user',
            telegramId: '11111'
        };

        it('should create a new user successfully', async () => {
            const expectedSavedUser = {
                firstName: newUserData.name,
                email: newUserData.email,
                password: newUserData.password,
                role: newUserData.role,
                telegramId: newUserData.telegramId
            };

            const mockSave = jest.fn().mockResolvedValue(expectedSavedUser);
            User.mockImplementation(() => ({
                ...expectedSavedUser,
                save: mockSave
            }));

            const req = mockRequest(newUserData);
            const res = mockResponse();

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: newUserData.name,
                    email: newUserData.email,
                    role: newUserData.role,
                    telegramId: newUserData.telegramId
                })
            );
        });

        it('should handle errors when creating user', async () => {
            User.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            }));

            const req = mockRequest(newUserData);
            const res = mockResponse();

            await userController.createUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при создании пользователя'
            });
        });
    });

    describe('getUserById', () => {
        it('should return user by ID successfully', async () => {
            User.findById.mockResolvedValue(mockUser);

            const req = mockRequest({}, { id: '123' });
            const res = mockResponse();

            await userController.getUserById(req, res);

            expect(User.findById).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            const req = mockRequest({}, { id: 'nonexistent' });
            const res = mockResponse();

            await userController.getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Пользователь не найден'
            });
        });

        it('should handle errors when getting user by ID', async () => {
            User.findById.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({}, { id: '123' });
            const res = mockResponse();

            await userController.getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при получении пользователя'
            });
        });
    });

    describe('updateUser', () => {
        const updateData = {
            name: 'Updated Name',
            email: 'updated@test.com'
        };

        it('should update user successfully', async () => {
            const updatedUser = { ...mockUser, ...updateData };
            User.findById.mockResolvedValue({
                ...mockUser,
                save: jest.fn().mockResolvedValue(updatedUser)
            });

            const req = mockRequest(updateData, { id: '123' });
            const res = mockResponse();

            await userController.updateUser(req, res);

            expect(User.findById).toHaveBeenCalledWith('123');
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                firstName: updateData.name
            }));
        });

        it('should return 404 when updating non-existent user', async () => {
            User.findById.mockResolvedValue(null);

            const req = mockRequest(updateData, { id: 'nonexistent' });
            const res = mockResponse();

            await userController.updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Пользователь не найден'
            });
        });

        it('should handle errors when updating user', async () => {
            User.findById.mockRejectedValue(new Error('Database error'));

            const req = mockRequest(updateData, { id: '123' });
            const res = mockResponse();

            await userController.updateUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при обновлении пользователя'
            });
        });
    });

    describe('getUserByTelegramId', () => {
        it('should return user by telegram ID successfully', async () => {
            User.findOne.mockResolvedValue(mockUser);

            const req = mockRequest({}, { telegramId: '12345' });
            const res = mockResponse();

            await userController.getUserByTelegramId(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ telegramId: '12345' });
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('should return 404 when user with telegram ID not found', async () => {
            User.findOne.mockResolvedValue(null);

            const req = mockRequest({}, { telegramId: 'nonexistent' });
            const res = mockResponse();

            await userController.getUserByTelegramId(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Пользователь не найден'
            });
        });

        it('should handle errors when getting user by telegram ID', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            const req = mockRequest({}, { telegramId: '12345' });
            const res = mockResponse();

            await userController.getUserByTelegramId(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Ошибка при получении пользователя'
            });
        });
    });
});
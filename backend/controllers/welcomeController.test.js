const { create, getAll, getOne, update, delete: deleteWelcome, deactivateAll } = require('./welcomeController');
const Welcome = require('../models/welcomeModel');

// Мокаем модель Welcome
jest.mock('../models/welcomeModel');

describe('Welcome Controller', () => {
  let mockRequest;
  let mockResponse;
  let consoleErrorSpy;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Подавляем вывод console.error в тестах
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('create', () => {
    test('should create a new welcome successfully', async () => {
      const mockWelcome = { _id: '1', message: 'Welcome!' };
      const mockSave = jest.fn().mockResolvedValue(mockWelcome);
      Welcome.mockImplementation(() => ({
        save: mockSave
      }));

      mockRequest.body = { message: 'Welcome!' };

      await create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWelcome);
    });

    test('should handle errors during creation', async () => {
      const errorMessage = 'Creation failed';
      Welcome.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error(errorMessage))
      }));

      mockRequest.body = { message: 'Welcome!' };

      await create(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getAll', () => {
    test('should get all welcomes successfully', async () => {
      const mockWelcomes = [
        { _id: '1', message: 'Welcome 1' },
        { _id: '2', message: 'Welcome 2' }
      ];
      Welcome.find = jest.fn().mockResolvedValue(mockWelcomes);

      await getAll(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWelcomes);
    });

    test('should handle errors when getting all welcomes', async () => {
      const errorMessage = 'Database error';
      Welcome.find = jest.fn().mockRejectedValue(new Error(errorMessage));

      await getAll(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getOne', () => {
    test('should get one welcome successfully', async () => {
      const mockWelcome = { _id: '1', message: 'Welcome!' };
      Welcome.findById = jest.fn().mockResolvedValue(mockWelcome);

      mockRequest.params = { id: '1' };

      await getOne(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockWelcome);
    });

    test('should return 404 when welcome not found', async () => {
      Welcome.findById = jest.fn().mockResolvedValue(null);

      mockRequest.params = { id: '1' };

      await getOne(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Welcome not found' });
    });

    test('should handle database errors when getting one welcome', async () => {
      const errorMessage = 'Database error';
      Welcome.findById = jest.fn().mockRejectedValue(new Error(errorMessage));

      mockRequest.params = { id: '1' };

      await getOne(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('update', () => {
    test('should update welcome successfully', async () => {
      const mockUpdatedWelcome = { _id: '1', message: 'Updated Welcome!' };
      Welcome.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedWelcome);

      mockRequest.params = { id: '1' };
      mockRequest.body = { message: 'Updated Welcome!' };

      await update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedWelcome);
    });

    test('should return 404 when trying to update non-existent welcome', async () => {
      Welcome.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      mockRequest.params = { id: '1' };
      mockRequest.body = { message: 'Updated Welcome!' };

      await update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Welcome not found' });
    });

    test('should handle database errors when updating', async () => {
      const errorMessage = 'Database error';
      Welcome.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error(errorMessage));

      mockRequest.params = { id: '1' };
      mockRequest.body = { message: 'Updated Welcome!' };

      await update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('delete', () => {
    test('should delete welcome successfully', async () => {
      const mockDeletedWelcome = { _id: '1', message: 'Welcome!' };
      Welcome.findByIdAndDelete = jest.fn().mockResolvedValue(mockDeletedWelcome);

      mockRequest.params = { id: '1' };

      await deleteWelcome(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Welcome deleted successfully' });
    });

    test('should return 404 when trying to delete non-existent welcome', async () => {
      Welcome.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      mockRequest.params = { id: '1' };

      await deleteWelcome(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Welcome not found' });
    });

    test('should handle database errors when deleting', async () => {
      const errorMessage = 'Database error';
      Welcome.findByIdAndDelete = jest.fn().mockRejectedValue(new Error(errorMessage));

      mockRequest.params = { id: '1' };

      await deleteWelcome(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('deactivateAll', () => {
    test('should deactivate all welcomes successfully', async () => {
      Welcome.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

      await deactivateAll(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'All welcomes deactivated'
      });
    });

    test('should handle errors when deactivating all welcomes', async () => {
      const errorMessage = 'Database error';
      Welcome.updateMany = jest.fn().mockRejectedValue(new Error(errorMessage));

      await deactivateAll(mockRequest, mockResponse);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });
});
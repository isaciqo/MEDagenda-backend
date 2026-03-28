jest.mock('../../../src/database/models/example/exampleModel');
const Example = require('../../../src/database/models/example/exampleModel');
const ExampleRepository = require('../../../src/infrastructure/repositories/example/ExampleRepository');

describe('ExampleRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new ExampleRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should call Example.findOne with example_id', async () => {
      Example.findOne = jest.fn().mockResolvedValue({ example_id: '1' });
      const result = await repo.findById('1');
      expect(Example.findOne).toHaveBeenCalledWith({ example_id: '1' });
      expect(result).toEqual({ example_id: '1' });
    });
  });

  describe('findAll', () => {
    it('should call Example.find with empty filters by default', async () => {
      Example.find = jest.fn().mockResolvedValue([]);
      const result = await repo.findAll();
      expect(Example.find).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should call Example.find with provided filters', async () => {
      Example.find = jest.fn().mockResolvedValue([{ example_id: '1' }]);
      const result = await repo.findAll({ status: 'active' });
      expect(Example.find).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('findByOwner', () => {
    it('should call Example.find with owner_id', async () => {
      Example.find = jest.fn().mockResolvedValue([{ example_id: '1' }]);
      const result = await repo.findByOwner('user1');
      expect(Example.find).toHaveBeenCalledWith({ owner_id: 'user1' });
    });
  });

  describe('create', () => {
    it('should instantiate Example and call save', async () => {
      const mockSave = jest.fn().mockResolvedValue({ example_id: '1' });
      Example.mockImplementation(() => ({ save: mockSave }));
      const result = await repo.create({ example_id: '1', title: 'Test' });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({ example_id: '1' });
    });
  });

  describe('update', () => {
    it('should call Example.findOneAndUpdate', async () => {
      Example.findOneAndUpdate = jest.fn().mockResolvedValue({ example_id: '1', title: 'New' });
      const result = await repo.update('1', { title: 'New' });
      expect(Example.findOneAndUpdate).toHaveBeenCalledWith({ example_id: '1' }, { title: 'New' }, { new: true });
    });
  });

  describe('delete', () => {
    it('should call Example.findOneAndDelete', async () => {
      Example.findOneAndDelete = jest.fn().mockResolvedValue({ example_id: '1' });
      const result = await repo.delete('1');
      expect(Example.findOneAndDelete).toHaveBeenCalledWith({ example_id: '1' });
    });
  });
});

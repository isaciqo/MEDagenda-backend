jest.mock('../../../src/database/models/user/userModel');
const User = require('../../../src/database/models/user/userModel');
const UserRepository = require('../../../src/infrastructure/repositories/user/UserRepository');

describe('UserRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should call User.findOne with user_id', async () => {
      User.findOne = jest.fn().mockResolvedValue({ user_id: '1' });
      const result = await repo.findById('1');
      expect(User.findOne).toHaveBeenCalledWith({ user_id: '1' });
      expect(result).toEqual({ user_id: '1' });
    });
  });

  describe('findByEmail', () => {
    it('should call User.findOne with email', async () => {
      User.findOne = jest.fn().mockResolvedValue({ email: 'a@b.com' });
      const result = await repo.findByEmail('a@b.com');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(result).toEqual({ email: 'a@b.com' });
    });
  });

  describe('findByResetToken', () => {
    it('should call User.findOne with token and expiry check', async () => {
      User.findOne = jest.fn().mockResolvedValue({ user_id: '1' });
      const result = await repo.findByResetToken('token123');
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'token123',
        resetPasswordExpires: { $gt: expect.any(Number) },
      });
      expect(result).toEqual({ user_id: '1' });
    });
  });

  describe('create', () => {
    it('should instantiate User and call save', async () => {
      const mockSave = jest.fn().mockResolvedValue({ user_id: '1' });
      User.mockImplementation(() => ({ save: mockSave }));
      const result = await repo.create({ user_id: '1', name: 'John' });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual({ user_id: '1' });
    });
  });

  describe('update', () => {
    it('should call User.findOneAndUpdate', async () => {
      User.findOneAndUpdate = jest.fn().mockResolvedValue({ user_id: '1', name: 'Updated' });
      const result = await repo.update('1', { name: 'Updated' });
      expect(User.findOneAndUpdate).toHaveBeenCalledWith({ user_id: '1' }, { name: 'Updated' }, { new: true });
      expect(result).toEqual({ user_id: '1', name: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should call User.findOneAndDelete', async () => {
      User.findOneAndDelete = jest.fn().mockResolvedValue({ user_id: '1' });
      const result = await repo.delete('1');
      expect(User.findOneAndDelete).toHaveBeenCalledWith({ user_id: '1' });
      expect(result).toEqual({ user_id: '1' });
    });
  });
});

jest.mock('mongoose');
const mongoose = require('mongoose');
const connectDatabase = require('../../../src/database/connection');

describe('connectDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should connect successfully and log message', async () => {
    mongoose.connect.mockResolvedValue();
    await connectDatabase();
    expect(mongoose.connect).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Connected to MongoDB');
  });

  it('should log error and call process.exit(1) on failure', async () => {
    mongoose.connect.mockRejectedValue(new Error('Connection refused'));
    await connectDatabase();
    expect(console.error).toHaveBeenCalledWith('MongoDB connection error:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

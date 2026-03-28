const UpdateExampleOperation = require('../../../../src/app/operations/example/UpdateExampleOperation');

describe('UpdateExampleOperation', () => {
  let operation;
  let exampleRepository;

  beforeEach(() => {
    exampleRepository = { findById: jest.fn(), update: jest.fn() };
    operation = new UpdateExampleOperation({ exampleRepository });
  });

  it('should throw "Example not found" when example does not exist', async () => {
    exampleRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999', { title: 'New' })).rejects.toThrow('Example not found');
  });

  it('should update and return the example', async () => {
    exampleRepository.findById.mockResolvedValue({ example_id: '1' });
    const updated = { example_id: '1', title: 'New Title' };
    exampleRepository.update.mockResolvedValue(updated);

    const result = await operation.execute('1', { title: 'New Title' });

    expect(exampleRepository.update).toHaveBeenCalledWith('1', { title: 'New Title' });
    expect(result).toEqual(updated);
  });
});

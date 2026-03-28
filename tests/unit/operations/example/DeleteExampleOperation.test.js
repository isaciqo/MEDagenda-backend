const DeleteExampleOperation = require('../../../../src/app/operations/example/DeleteExampleOperation');

describe('DeleteExampleOperation', () => {
  let operation;
  let exampleRepository;

  beforeEach(() => {
    exampleRepository = { findById: jest.fn(), delete: jest.fn() };
    operation = new DeleteExampleOperation({ exampleRepository });
  });

  it('should throw "Example not found" when example does not exist', async () => {
    exampleRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999')).rejects.toThrow('Example not found');
  });

  it('should delete example and return success message', async () => {
    exampleRepository.findById.mockResolvedValue({ example_id: '1' });
    exampleRepository.delete.mockResolvedValue();

    const result = await operation.execute('1');

    expect(exampleRepository.delete).toHaveBeenCalledWith('1');
    expect(result).toEqual({ message: 'Example deleted successfully' });
  });
});

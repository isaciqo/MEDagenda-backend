const GetExampleOperation = require('../../../../src/app/operations/example/GetExampleOperation');

describe('GetExampleOperation', () => {
  let operation;
  let exampleRepository;

  beforeEach(() => {
    exampleRepository = { findById: jest.fn() };
    operation = new GetExampleOperation({ exampleRepository });
  });

  it('should throw "Example not found" when example does not exist', async () => {
    exampleRepository.findById.mockResolvedValue(null);
    await expect(operation.execute('999')).rejects.toThrow('Example not found');
  });

  it('should return example when found', async () => {
    const mockExample = { example_id: '1', title: 'Test' };
    exampleRepository.findById.mockResolvedValue(mockExample);
    const result = await operation.execute('1');
    expect(result).toEqual(mockExample);
  });
});

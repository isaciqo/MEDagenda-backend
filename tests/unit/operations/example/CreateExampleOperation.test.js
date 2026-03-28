const CreateExampleOperation = require('../../../../src/app/operations/example/CreateExampleOperation');

jest.mock('uuid', () => ({ v4: () => 'mocked-uuid' }));

describe('CreateExampleOperation', () => {
  let operation;
  let exampleRepository;

  beforeEach(() => {
    exampleRepository = { create: jest.fn() };
    operation = new CreateExampleOperation({ exampleRepository });
  });

  it('should create and return a new example', async () => {
    const mockExample = { example_id: 'mocked-uuid', title: 'Test', owner_id: 'user1' };
    exampleRepository.create.mockResolvedValue(mockExample);

    const result = await operation.execute({ title: 'Test', description: 'desc', owner_id: 'user1' });

    expect(exampleRepository.create).toHaveBeenCalledWith({
      example_id: 'mocked-uuid',
      title: 'Test',
      description: 'desc',
      owner_id: 'user1',
    });
    expect(result).toEqual(mockExample);
  });
});

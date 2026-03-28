const ListExamplesOperation = require('../../../../src/app/operations/example/ListExamplesOperation');

describe('ListExamplesOperation', () => {
  let operation;
  let exampleRepository;

  beforeEach(() => {
    exampleRepository = { findAll: jest.fn(), findByOwner: jest.fn() };
    operation = new ListExamplesOperation({ exampleRepository });
  });

  it('should return all examples when no owner_id is provided', async () => {
    exampleRepository.findAll.mockResolvedValue([{ example_id: '1' }]);
    const result = await operation.execute();
    expect(exampleRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ example_id: '1' }]);
  });

  it('should return examples by owner when owner_id is provided', async () => {
    exampleRepository.findByOwner.mockResolvedValue([{ example_id: '2' }]);
    const result = await operation.execute({ owner_id: 'user1' });
    expect(exampleRepository.findByOwner).toHaveBeenCalledWith('user1');
    expect(result).toEqual([{ example_id: '2' }]);
  });
});

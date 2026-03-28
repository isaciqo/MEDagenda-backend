const ExampleController = require('../../../src/interfaces/http/presentation/example/ExampleController');

describe('ExampleController', () => {
  let controller;
  let operations;
  let req, res;

  beforeEach(() => {
    operations = {
      createExampleOperation: { execute: jest.fn() },
      getExampleOperation: { execute: jest.fn() },
      listExamplesOperation: { execute: jest.fn() },
      updateExampleOperation: { execute: jest.fn() },
      deleteExampleOperation: { execute: jest.fn() },
    };
    controller = new ExampleController(operations);
    req = { body: {}, params: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('create should call operation and return 201', async () => {
    req.body = { title: 'Test', owner_id: 'u1' };
    operations.createExampleOperation.execute.mockResolvedValue({ example_id: '1' });
    await controller.create(req, res);
    expect(operations.createExampleOperation.execute).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('list should call operation and return 200', async () => {
    req.query = { owner_id: 'u1' };
    operations.listExamplesOperation.execute.mockResolvedValue([]);
    await controller.list(req, res);
    expect(operations.listExamplesOperation.execute).toHaveBeenCalledWith(req.query);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getById should call operation and return 200', async () => {
    req.params = { example_id: '1' };
    operations.getExampleOperation.execute.mockResolvedValue({ example_id: '1' });
    await controller.getById(req, res);
    expect(operations.getExampleOperation.execute).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('update should call operation and return 200', async () => {
    req.params = { example_id: '1' };
    req.body = { title: 'New' };
    operations.updateExampleOperation.execute.mockResolvedValue({ example_id: '1', title: 'New' });
    await controller.update(req, res);
    expect(operations.updateExampleOperation.execute).toHaveBeenCalledWith('1', { title: 'New' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('delete should call operation and return 200', async () => {
    req.params = { example_id: '1' };
    operations.deleteExampleOperation.execute.mockResolvedValue({ message: 'deleted' });
    await controller.delete(req, res);
    expect(operations.deleteExampleOperation.execute).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

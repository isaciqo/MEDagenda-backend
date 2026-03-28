const exampleSchemas = require('../../../src/interfaces/http/presentation/example/exampleSchemas')();

describe('exampleSchemas', () => {
  describe('create', () => {
    it('should pass for valid data', () => {
      const { error } = exampleSchemas.create.validate({ title: 'Test', owner_id: 'user1' });
      expect(error).toBeUndefined();
    });
    it('should fail when title is missing', () => {
      const { error } = exampleSchemas.create.validate({ owner_id: 'user1' });
      expect(error).toBeDefined();
    });
    it('should fail when owner_id is missing', () => {
      const { error } = exampleSchemas.create.validate({ title: 'Test' });
      expect(error).toBeDefined();
    });
    it('should pass with optional description', () => {
      const { error } = exampleSchemas.create.validate({ title: 'Test', owner_id: 'u1', description: 'desc' });
      expect(error).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should pass with at least one field', () => {
      const { error } = exampleSchemas.update.validate({ title: 'New Title' });
      expect(error).toBeUndefined();
    });
    it('should fail with no fields', () => {
      const { error } = exampleSchemas.update.validate({});
      expect(error).toBeDefined();
    });
    it('should pass with valid status', () => {
      const { error } = exampleSchemas.update.validate({ status: 'active' });
      expect(error).toBeUndefined();
    });
    it('should fail with invalid status', () => {
      const { error } = exampleSchemas.update.validate({ status: 'invalid' });
      expect(error).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should pass with example_id', () => {
      const { error } = exampleSchemas.getById.validate({ example_id: '1' });
      expect(error).toBeUndefined();
    });
    it('should fail without example_id', () => {
      const { error } = exampleSchemas.getById.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('list', () => {
    it('should pass with optional owner_id', () => {
      const { error } = exampleSchemas.list.validate({ owner_id: 'u1' });
      expect(error).toBeUndefined();
    });
    it('should pass with empty object', () => {
      const { error } = exampleSchemas.list.validate({});
      expect(error).toBeUndefined();
    });
  });
});

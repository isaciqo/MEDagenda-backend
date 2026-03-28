const userSchemas = require('../../../src/interfaces/http/presentation/user/userSchemas')();

describe('userSchemas', () => {
  describe('create', () => {
    it('should pass for valid data', () => {
      const { error } = userSchemas.create.validate({ name: 'John Doe', email: 'john@example.com', password: 'secret123' });
      expect(error).toBeUndefined();
    });
    it('should fail when name is missing', () => {
      const { error } = userSchemas.create.validate({ email: 'a@b.com', password: 'pass123' });
      expect(error).toBeDefined();
    });
    it('should fail for invalid email', () => {
      const { error } = userSchemas.create.validate({ name: 'John', email: 'not-email', password: 'pass123' });
      expect(error).toBeDefined();
    });
    it('should fail when password is too short', () => {
      const { error } = userSchemas.create.validate({ name: 'John', email: 'a@b.com', password: 'ab' });
      expect(error).toBeDefined();
    });
  });

  describe('login', () => {
    it('should pass for valid credentials', () => {
      const { error } = userSchemas.login.validate({ email: 'a@b.com', password: 'pass123' });
      expect(error).toBeUndefined();
    });
    it('should fail when email is missing', () => {
      const { error } = userSchemas.login.validate({ password: 'pass123' });
      expect(error).toBeDefined();
    });
  });

  describe('updateUser', () => {
    it('should pass with at least one field', () => {
      const { error } = userSchemas.updateUser.validate({ name: 'New Name' });
      expect(error).toBeUndefined();
    });
    it('should fail when no fields are provided', () => {
      const { error } = userSchemas.updateUser.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('changePassword', () => {
    it('should pass for valid data', () => {
      const { error } = userSchemas.changePassword.validate({ currentPassword: 'old123', newPassword: 'new123' });
      expect(error).toBeUndefined();
    });
    it('should fail when newPassword is too short', () => {
      const { error } = userSchemas.changePassword.validate({ currentPassword: 'old', newPassword: 'ab' });
      expect(error).toBeDefined();
    });
  });

  describe('confirmEmail', () => {
    it('should pass with a token', () => {
      const { error } = userSchemas.confirmEmail.validate({ token: 'abc123' });
      expect(error).toBeUndefined();
    });
    it('should fail without token', () => {
      const { error } = userSchemas.confirmEmail.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('requestPasswordReset', () => {
    it('should pass with a valid email', () => {
      const { error } = userSchemas.requestPasswordReset.validate({ email: 'a@b.com' });
      expect(error).toBeUndefined();
    });
    it('should fail with invalid email', () => {
      const { error } = userSchemas.requestPasswordReset.validate({ email: 'notvalid' });
      expect(error).toBeDefined();
    });
  });

  describe('confirmPasswordReset', () => {
    it('should pass for valid data', () => {
      const { error } = userSchemas.confirmPasswordReset.validate({ token: 'tok', newPassword: 'pass123' });
      expect(error).toBeUndefined();
    });
    it('should fail when token is missing', () => {
      const { error } = userSchemas.confirmPasswordReset.validate({ newPassword: 'pass123' });
      expect(error).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('should pass with a user_id', () => {
      const { error } = userSchemas.getUserById.validate({ user_id: 'some-uuid' });
      expect(error).toBeUndefined();
    });
    it('should fail without user_id', () => {
      const { error } = userSchemas.getUserById.validate({});
      expect(error).toBeDefined();
    });
  });
});

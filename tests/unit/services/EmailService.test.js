jest.mock('nodemailer');
const nodemailer = require('nodemailer');
const EmailService = require('../../../src/app/services/EmailService');

describe('EmailService', () => {
  const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

  beforeEach(() => {
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@test.com';
    process.env.EMAIL_PASS = 'password';
    process.env.APP_URL = 'http://localhost:3000';
    jest.clearAllMocks();
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
  });

  describe('sendConfirmationEmail', () => {
    it('should call sendMail with confirmation email content', async () => {
      const service = new EmailService();
      await service.sendConfirmationEmail({ email: 'user@test.com', name: 'John', token: 'abc123' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Confirm your email',
          html: expect.stringContaining('abc123'),
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should call sendMail with reset email content', async () => {
      const service = new EmailService();
      await service.sendPasswordResetEmail({ email: 'user@test.com', name: 'John', token: 'reset123' });
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Reset your password',
          html: expect.stringContaining('reset123'),
        })
      );
    });
  });
});

const { OAuth2Client } = require('google-auth-library');

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async verifyToken(credential) {
    const ticket = await this.client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      const err = new Error('E-mail do Google não verificado.');
      err.statusCode = 401;
      throw err;
    }

    return {
      googleId:  payload.sub,
      email:     payload.email,
      name:      payload.name || payload.email.split('@')[0],
      picture:   payload.picture || null,
    };
  }
}

module.exports = GoogleAuthService;

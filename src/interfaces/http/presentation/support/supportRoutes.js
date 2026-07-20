const authMiddleware = require('../../middlewares/authMiddleware');

module.exports = [
  {
    method: 'post',
    path: '/support/send',
    handler: 'supportController.send',
    middlewares: [authMiddleware],
    validation: {},
  },
];

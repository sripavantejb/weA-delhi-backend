const config = require('../config');
const { success } = require('../views/response');

const index = (req, res) => {
  return success(res, {
    message: 'Server is running',
    environment: config.env,
  });
};

const health = (req, res) => {
  return success(res, { status: 'ok', env: config.env });
};

module.exports = {
  index,
  health,
};

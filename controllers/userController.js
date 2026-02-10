const { User } = require('../models');
const { success, error } = require('../views/response');

const list = (req, res) => {
  const users = User.findAll();
  return success(res, { users });
};

const getById = (req, res) => {
  const user = User.findById(req.params.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
};

module.exports = {
  list,
  getById,
};

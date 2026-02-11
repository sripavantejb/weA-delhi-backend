const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loggedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

loginActivitySchema.index({ user: 1, loggedInAt: -1 });

const LoginActivity = mongoose.model('LoginActivity', loginActivitySchema);
module.exports = LoginActivity;

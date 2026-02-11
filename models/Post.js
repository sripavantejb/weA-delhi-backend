const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Video', 'Image', 'Text'], required: true },
    caption: { type: String, default: '' },
    date: { type: String, required: true },
    time: { type: String, default: '09:00' },
    platforms: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, date: 1 });

postSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;

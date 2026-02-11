const mongoose = require('mongoose');
const { Post } = require('../models');
const { success, error } = require('../views/response');

async function getPosts(req, res) {
  try {
    const userId = req.user._id;
    const { date, month, recent, limit } = req.query;
    let query = { user: userId };
    if (date) query.date = date;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNum] = month.split('-').map(Number);
      const start = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const end = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query.date = { $gte: start, $lte: end };
    }
    let q = Post.find(query).sort({ date: month ? 1 : -1, time: month ? 1 : -1 });
    if (recent === '1' || recent === 'true') {
      q = q.limit(Math.min(parseInt(limit, 10) || 4, 20));
    }
    const posts = await q.lean();
    const withId = posts.map((p) => ({ ...p, id: p._id.toString(), _id: undefined }));
    return success(res, { posts: withId });
  } catch (err) {
    console.error(err);
    return error(res, err.message || 'Failed to fetch posts', 500);
  }
}

async function createPost(req, res) {
  try {
    const userId = req.user._id;
    const { type, caption, date, time, platforms } = req.body;
    if (!date) return error(res, 'date is required', 400);
    const doc = await Post.create({
      user: userId,
      type: type || 'Text',
      caption: caption || '',
      date: String(date),
      time: time || '09:00',
      platforms: Array.isArray(platforms) ? platforms : ['Instagram'],
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
    });
    const withId = { ...doc.toObject(), id: doc._id.toString(), _id: undefined };
    return success(res, { post: withId }, 201);
  } catch (err) {
    console.error(err);
    return error(res, err.message || 'Failed to create post', 400);
  }
}

async function updatePost(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 'Invalid post id', 400);
    }
    const userId = req.user._id;
    const { type, caption, date, time, platforms } = req.body;
    const update = {};
    if (type !== undefined) update.type = type;
    if (caption !== undefined) update.caption = caption;
    if (date !== undefined) update.date = String(date);
    if (time !== undefined) update.time = time;
    if (platforms !== undefined) update.platforms = Array.isArray(platforms) ? platforms : [];
    const doc = await Post.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!doc) return error(res, 'Post not found', 404);
    const withId = { ...doc.toObject(), id: doc._id.toString(), _id: undefined };
    return success(res, { post: withId });
  } catch (err) {
    console.error(err);
    return error(res, err.message || 'Failed to update post', 400);
  }
}

async function deletePost(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error(res, 'Invalid post id', 400);
    }
    const userId = req.user._id;
    const result = await Post.findOneAndDelete({ _id: id, user: userId });
    if (!result) return error(res, 'Post not found', 404);
    return success(res, { deleted: true });
  } catch (err) {
    console.error(err);
    return error(res, err.message || 'Failed to delete post', 500);
  }
}

module.exports = { getPosts, createPost, updatePost, deletePost };

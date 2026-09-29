const { Post } = require('../models/post.model');
const { ApiError } = require('../utils/apierror');

async function createPost(userId, payload) {
  const { type, text, imageUrl, city } = payload;

  return Post.create({
    author: userId,
    type: type || 'story',
    text,
    imageUrl: imageUrl || null,
    city,
  });
}

// Newest-first feed, paginated via cursor-free offset (fine at this scale).
async function listPosts({ type, city, page = 1, limit = 20 } = {}) {
  const query = {};
  if (type) query.type = type;
  if (city) query.city = city;

  const pageNum = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Number(limit) || 20, 50);

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate('author', 'fullName avatarUrl')
      .populate('comments.user', 'fullName'),
    Post.countDocuments(query),
  ]);

  return { posts, total, page: pageNum, pageSize };
}

async function getPostById(postId) {
  const post = await Post.findById(postId)
    .populate('author', 'fullName avatarUrl')
    .populate('comments.user', 'fullName');
  if (!post) throw new ApiError(404, 'Post not found');
  return post;
}

async function toggleLike(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  const { liked } = post.toggleLike(userId);
  await post.save();
  return { liked, post };
}

async function addComment(postId, userId, text) {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  post.addComment(userId, text);
  await post.save();
  return post;
}

async function deletePost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');
  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the author can delete this post');
  }

  await post.deleteOne();
  return { deleted: true };
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  toggleLike,
  addComment,
  deletePost,
};

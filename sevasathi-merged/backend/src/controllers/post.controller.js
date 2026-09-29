const postService = require('../services/post.service');
const { asyncHandler } = require('../utils/asynchandler');

exports.create = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body);

  res.status(201).json({
    message: 'Post shared successfully',
    post,
  });
});

exports.list = asyncHandler(async (req, res) => {
  const { type, city, page, limit } = req.query;

  const { posts, total, page: pageNum, pageSize } = await postService.listPosts({ type, city, page, limit });

  res.status(200).json({
    message: 'Posts fetched successfully',
    count: posts.length,
    total,
    page: pageNum,
    pageSize,
    posts,
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);

  res.status(200).json({
    message: 'Post fetched successfully',
    post,
  });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const { liked, post } = await postService.toggleLike(req.params.id, req.user.id);

  res.status(200).json({
    message: liked ? 'Post liked' : 'Post unliked',
    liked,
    post,
  });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await postService.addComment(req.params.id, req.user.id, text);

  res.status(201).json({
    message: 'Comment added',
    post,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  await postService.deletePost(req.params.id, req.user.id);

  res.status(200).json({
    message: 'Post deleted',
  });
});

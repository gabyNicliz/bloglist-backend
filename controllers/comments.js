/* eslint-disable no-underscore-dangle */
const commentsRouter = require('express').Router();
const mongoose = require('mongoose');
const Blog = require('../models/blog');
const Comment = require('../models/comments');

mongoose.set('useFindAndModify', false);

commentsRouter.get('/:id/comments', async (request, response) => {
  const comments = await Comment.find({}).populate('blog', { id: 1 });
  response.json(comments.map((comment) => comment.toJSON()));
});

commentsRouter.post('/:id/comments', async (request, response) => {
  const { body } = request;
  const { id } = request.params;
  const blog = await Blog.findById(id);

  const comment = new Comment({
    content: body.content,
    blog: blog._id,
  });

  if (!comment.content) {
    return response
      .status(400)
      .json({ error: 'missing comment' })
      .end();
  }

  const savedComment = await comment.save();
  blog.comments = blog.comments.concat(savedComment._id);
  await blog.save();

  return response.status(200).json(savedComment.toJSON());
});

module.exports = commentsRouter;

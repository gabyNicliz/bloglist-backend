/* eslint-disable no-underscore-dangle */
const blogsRouter = require('express').Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user');

mongoose.set('useFindAndModify', false);

const getTokenFrom = (request) => {
  const authorization = request.get('authorization');

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
    .populate('comments', { content: 1 });
  response.json(blogs.map((blog) => blog.toJSON()));
});

blogsRouter.post('/', async (request, response) => {
  const { body } = request;
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id,
  });

  if (!blog.title || !blog.url) {
    return response
      .status(400)
      .json({ error: 'missing title or url' })
      .end();
  }

  if (!blog.likes) {
    blog.likes = 0;
  }

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  return response.status(200).json(savedBlog.toJSON());
});

blogsRouter.put('/:id', async (request, response, next) => {
  const { body } = request;

  const blog = {
    likes: body.likes,
  };

  try {
    const updatedBlog = await Blog
      .findByIdAndUpdate(request.params.id, blog, { new: true });
    response.json(updatedBlog.toJSON());
  } catch (error) { next(error); }
});

blogsRouter.delete('/:id', async (request, response) => {
  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!token || !decodedToken) {
    return response.status(401).json({ error: 'missing or invalid token' });
  }

  const blog = await Blog.findById(request.params.id);

  if (blog.user.toString() !== decodedToken.id.toString()) {
    return response.status(401).json({ error: 'unauthorized access' });
  }

  await Blog.findByIdAndRemove(request.params.id);
  return response.status(204).end();
});

module.exports = blogsRouter;

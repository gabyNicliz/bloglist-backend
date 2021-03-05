/* eslint-disable no-underscore-dangle */
const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: 'blog 1',
    author: 'author 1',
    url: 'url 1',
    likes: 1,
  },
  {
    title: 'blog 2',
    author: 'author 2',
    url: 'url 2',
    likes: 2,
  },
  {
    title: 'blog 3',
    author: 'author 3',
    url: 'url 3',
    likes: 3,
  },
];


const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

const nonExistingId = async () => {
  const blog = new Blog({ title: 'none' });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

module.exports = {
  initialBlogs,
  blogsInDb,
  usersInDb,
  nonExistingId,
};

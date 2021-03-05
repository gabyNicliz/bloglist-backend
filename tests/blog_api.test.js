/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const supertest = require('supertest');
const helper = require('./blog_helper');
const app = require('../app');

const api = supertest(app);

const Blog = require('../models/blog');
const User = require('../models/user');

let token;
let userId;

mongoose.set('useFindAndModify', false);

beforeEach(async () => {
  await User.deleteMany({});
  const user = new User({ username: 'root', password: 'secret' });
  await user.save();

  const response = await api.post('/api/login/').send({
    username: 'root',
    password: 'secret',
  });

  token = `bearer ${response.body.token}`;
  userId = user._id;
});

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogs
    .map((blog) => new Blog({
      title: blog.title,
      author: blog.author,
      url: blog.url,
      likes: blog.likes,
      user: userId,
    }));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe('when there is initially some blogs saved in the db', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body.length).toBe(helper.initialBlogs.length);
  });

  test("verify if blog identifier is called 'id'", async () => {
    const response = await api.get('/api/blogs');

    response.body.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });

  test('a valid blog can be added', async () => {
    const testBlog = {
      title: 'test title',
      author: 'test author',
      url: 'test url',
      likes: 1,
      user: userId,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(testBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContain('test title');
  });

  test('if "likes" property is missing, default value is zero', async () => {
    const newBlog = {
      title: 'new title',
      author: 'new author',
      url: 'new url',
      user: userId,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length + 1);

    const likes = blogsAtEnd.map((b) => b.likes);
    expect(likes).not.toContain(likes);
  });

  test('blog without title and url is not added', async () => {
    const newBlog = {
      author: 'new author',
      likes: 0,
      user: userId,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length);
  });

  test('update a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    blogToUpdate.likes = 42;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const likes = blogsAtEnd.map((blog) => blog.likes);

    expect(likes).not.toContain(undefined);
  });

  test('delete a single blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', token)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    const titles = blogsAtEnd.map((blog) => blog.title);

    expect(blogsAtEnd.length).toBe(helper.initialBlogs.length - 1);
    expect(titles).not.toContain(blogToDelete.title);
  });
});

describe('when there is initially one user saved in the db', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const user = new User({ username: 'root', password: 'secret' });
    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'gabenz',
      name: 'gabriel',
      password: 'password',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((user) => user.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'name',
      password: 'secret',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd.length).toBe(usersAtStart.length);
  });

  test('creation fails with no username', async () => {
    const newUser = {
      username: '',
      name: 'name',
      password: 'pass',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });

  test('creation fails with no password', async () => {
    const newUser = {
      username: 'name',
      name: 'name',
      password: '',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });

  test('creation fails with username with less than 3 characters', async () => {
    const newUser = {
      username: 'na',
      name: 'name',
      password: 'pass',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
  });

  test('creation fails with password with less than 3 characters', async () => {
    const newUser = {
      username: 'name',
      name: 'name',
      password: 'pa',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('invalid username or password');
  });
});


afterAll(() => {
  mongoose.connection.close();
});

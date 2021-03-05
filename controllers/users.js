const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', async (request, response) => {
  const users = await User.find({})
    .populate('blogs', {
      title: 1,
      author: 1,
      url: 1,
      likes: 1,
    });


  response.json(users.map((user) => user.toJSON()));
});

usersRouter.post('/', async (request, response) => {
  const { body } = request;

  if (!body.password || body.password.length < 3) {
    return response.status(400).json({ error: 'invalid username or password' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  });

  try {
    const savedUser = await user.save();
    return response.json(savedUser);
  } catch (error) {
    return response.status(400).json({ error });
  }
});

module.exports = usersRouter;

/* eslint-disable global-require */
const express = require('express');

const app = express();
require('express-async-errors');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const config = require('./utils/config');

const blogsRouter = require('./controllers/blogs');
const middleware = require('./utils/middleware');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const commentsRouter = require('./controllers/comments');

logger.info('Connecting to MongoDB');

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    logger.info('Connected To MongoDB');
  })
  .catch((error) => {
    logger.error('error connection to MongoDB', error.message);
  });

app.use(cors());
app.use(express.static('build'));
app.use(express.json());

app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/blogs', commentsRouter);

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(middleware.errorHandler);
app.use(middleware.unknownEndpoint);

module.exports = app;

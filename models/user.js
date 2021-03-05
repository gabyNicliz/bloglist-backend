/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const moongose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new moongose.Schema({
  username: {
    type: String,
    unique: true,
    minlength: 3,
  },
  name: String,
  passwordHash: String,
  blogs: [
    {
      type: moongose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
});

userSchema.plugin(uniqueValidator);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const User = moongose.model('User', userSchema);

module.exports = User;

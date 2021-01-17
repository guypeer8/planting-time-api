const { validationConstants } = require('@artista/constants');
const isEmail = require('validator/lib/isEmail');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { PWD_REGEX, PWD_MESSAGE } = validationConstants;

const userDiscriminatorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: v => PWD_REGEX.test(v),
      message: () => PWD_MESSAGE,
    },
  },
  email: {
    type: String,
    unique: [true, 'Email already exists'],
    validate: {
      validator: v => isEmail(v),
      message: props => `${props.value} is not a valid email!`
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'shop'],
    default: 'user',
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  active: { type: Boolean, default: true },
}, {
  toJSON: { virtuals: true },
});

userDiscriminatorSchema.statics.getUserByEmail = function(email) {
  return this.findOne({ email });
};

userDiscriminatorSchema.methods.checkPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userDiscriminatorSchema.pre('save', function(next) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(this.password, salt, (err, passwordHash) => {
      if (err) {
        return next(err);
      }
      this.password = passwordHash;
      next();
    });
  });
});

module.exports = mongoose.model('User', userDiscriminatorSchema);

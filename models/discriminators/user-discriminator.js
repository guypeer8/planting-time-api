const bcrypt = require('bcryptjs');
const { isBoolean } = require('lodash');
const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const { ROLES, PROVIDERS } = require('../../config');

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{8,}$/;
const PWD_MESSAGE = 'Password must contain at least 8 characters, including 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character [@#$!%*?&]';

const userDiscriminatorSchema = new mongoose.Schema({
  userId: { type: String },
  name: { type: String, required: true },
  password: {
    type: String,
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
  role: { type: String, enum: ROLES, default: ROLES[0] },
  provider: { type: String, enum: PROVIDERS, default: PROVIDERS[0] },
  active: { type: Boolean, default: true },
}, { 
  toJSON: { virtuals: true },
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userDiscriminatorSchema.statics.getUsers = async function({ 
  id = null, 
  ids = null, 
  role = null,
  email = null,
  active = null,
  provider = null,
  search_keyword = '',
  page = 1,
  limit = 30,
  sort = 'email',
} = {}) {
  const query = {};
  if (id) { 
      query._id = id;
  }
  if (ids) { 
      query._id = { $in: ids };
  }
  if (isBoolean(active)) {
    query.active = active;
  }
  if (role) { 
    query.role = role;
  }
  if (email) { 
    query.email = email;
  }
  if (provider) { 
    query.provider = provider;
  }
  if (search_keyword) {
      const search_re = { $regex: new RegExp(search_keyword), $options: 'i' };
      query.$or = [{ name: search_re }, { email: search_re }];
  }

  const users = await this
    .find(query)
    .limit(limit)
    .skip((page-1) * limit)
    .sort(sort)
    .select('-password')
    .lean({ virtuals: true });

  return users;
};

userDiscriminatorSchema.methods.checkPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userDiscriminatorSchema.statics.findOrCreate = function({ userId, provider = '', name, email } = {}) {
  return new Promise(async (resolve, reject) => {
      try {
          if (!PROVIDERS.includes(provider)) { 
              return reject(new Error('invalid'));
          }
          if (provider !== 'local' && !userId) {
              return reject(new Error('invalid'));
          }
          const userRecord = await this.findOne({ userId, provider, name });
          if (userRecord) { 
              return resolve({ user: userRecord, isNew: false });
          }
          const newUser = new this({ userId, provider, name, email });
          const newUserRecord = await newUser.save();
          resolve({ user: newUserRecord, isNew: true });
      } catch(err) {
          reject(err);
      }
  });
};

userDiscriminatorSchema.pre('save', function(next) {
  if (this.provider !== 'local' && !this.password) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(this.password, salt, (err, passwordHash) => {
      if (err) { return next(err); }
      this.password = passwordHash;
      next();
    });
  });
});

userDiscriminatorSchema.plugin(mongooseLeanVirtuals);

userDiscriminatorSchema.virtual('id').get(function() {
    return this._id.toString();
});

module.exports = mongoose.model('User', userDiscriminatorSchema);

const set = require('lodash/set');
const keys = require('lodash/keys');
const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');

const flattenObject = (o = {}, keyChain = '', flattenedObject = {}) => {
  keys(o).forEach(key => {
    const _keyChain = keyChain + key;
    if (!isPlainObject(o[key]) && !isArray(o[key])) {
      flattenedObject[_keyChain] = o[key];
    } else {
      flattenObject(o[key], `${_keyChain}.`, flattenedObject);
    }
  });
  return flattenedObject;
};

const expandObject = o => {
  const expandedObject = {};
  keys(o).forEach(key => {
    set(expandedObject, key, o[key]);
  });
  return expandedObject;
};

const rebuildFlattenedObject = (o, func) => {
  const rebuiltObject = {};
  keys(o).forEach(key => {
    rebuiltObject[key] = func(o[key]);
  });
  return rebuiltObject;
};

module.exports = {
  flattenObject,
  expandObject,
  rebuildFlattenedObject,
};

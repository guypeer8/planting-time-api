const sanitizeHtml = require('sanitize-html');
const { flattenObject, rebuildFlattenedObject, expandObject } = require('./object');

const sanitizeInput = hash => {
    const flattenedObject = flattenObject(hash);
    const rebuiltObject = rebuildFlattenedObject(flattenedObject, sanitizeHtml);
    return expandObject(rebuiltObject);
};

module.exports = {
    sanitizeInput,
};
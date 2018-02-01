const Smooch = require('smooch-core');
const config = require('../config');

const smooch = new Smooch({
    keyId: config.smoochAppKeyId,
    secret: config.smoochAppKeySecret,
    scope: 'app'
});

module.exports = smooch;

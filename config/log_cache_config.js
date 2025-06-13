const NodeCache = require('node-cache');
const requestCache = new NodeCache({stdTTL: 1200, checkperiod: 120});
module.exports = requestCache;
'use strict';

const util = require('util');

console.log(util.inspect(require('../index.js')('test'), { depth: 4 }));

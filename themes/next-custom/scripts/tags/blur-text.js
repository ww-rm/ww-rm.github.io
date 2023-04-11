/**
 * blur-text.js | Defined by ww-rm
 */

'use strict';

module.exports = ctx => function(args, content) {
  return `<span class="blur-text">${content}</span>`;
};

/**
 * black-curtain.js | Defined by ww-rm
 */

'use strict';

module.exports = ctx => function(args, content) {
  return `<span class="black-curtain">${content}</span>`;
};

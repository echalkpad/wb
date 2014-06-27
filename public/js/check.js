if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(['class'], function(Check){

  //abstract class -- a means of identifying derivatives
  var Check = Class.extend({
    className: 'Check'
  });

  return Check;
});

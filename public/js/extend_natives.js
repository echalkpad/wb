define(['underscore'], function(_){

  Array.prototype.as = function(){
    var args = _.toArray(arguments);
    return _.as.apply(this, [this].concat(args).concat(Array.begetters));
  };

  _.defaults(Array.prototype   , _.mixins.Array, _.mixins.Collection);
  _.defaults(Function.prototype, _.mixins.Function);
  _.defaults(String.prototype  , _.mixins.String);

  return _;
});
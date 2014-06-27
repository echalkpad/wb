define(function(){

  _.extend(jasmine.Matchers.prototype, {
    isArray: function(arr) {
      var isArray = _.isArray(this.actual);
      if (!arr) {
        return isArray;
      }
      var sameLength = arr.length == this.actual.length;
      var fn = function(value, idx){
        var other = arr[idx];
        return other == value;
      };
      return isArray && sameLength && this.actual.all(fn);
    },
    isDate: function(dt){
      return this.actual - dt === 0;
    }
  });

  return jasmine;

});

define(function(){
  return { // mixins are registered in separate modules
    promise: function(key){
      var self = this;
      return function(){
        return self[key];
      };
    }
  };
});

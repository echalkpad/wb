define(['hash'], function(Hash){

  var Dictionary = Hash.extend({
    className: 'Dictionary',
    validKey: function(key){
      return _.isString(key);
    },
    cast: function(array){
      return new Dictionary(array);
    }
  });

  return Dictionary;

});

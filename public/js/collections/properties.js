define(['collections/documents'], function(Documents){

  var Properties = Documents.extend({
    comparator: function(property) {
      return property.type() + property.id;
    },
    type: function(type){
      return this.select(function(c){
        return !type || c.isa(type);
      });
    },
    toString: function(){
      return this.map(function(model){
        return model.toString();
      }).join('; ');
    }
  });

  return Properties;

});

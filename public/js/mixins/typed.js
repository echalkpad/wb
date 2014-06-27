define(['mixins'], function(Mixins){

  var Typed = Mixins.Typed = {
    type: function(type){
      return this.select(function(model){
        return model.isa(type);
      });
    },
    types: function(){
      return this.all()
        .map(function(model){
          return model.types ? model.types() : model.type();
        })
        .flatten()
        .uniq();
    }
  };

  return Typed;

});

define(['class'], function(Class){

  var Constraint = Class.extend({
    init: function(tm){
      _.bindAll(this, 'check', 'isNew');
      this.scopes = ['constraints'];
      this.topic_map = function(){
        return tm;
      };
    },
    isNew: function(){
      return _.isUndefined(this.constraint);
    },
    check: function(model) { //abstract (override)
      return null;
    },
    source: function(constraint){
      this.constraint = constraint;
      return this;
    }
  },{
    deserialize: function(){ //abstract (override)
    }
  });

  return Constraint;

});
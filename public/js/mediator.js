define(['backbone'],function(Backbone){

  var Mediator = Backbone.Model.extend({
    initialize: function(attributes, options){
      _.bindAll(this);
    },
    topic_map: function(tm){
      return arguments.length === 1 ? this.set({topic_map: tm}) : this.get('topic_map');
    }
  });

  return Mediator;

});

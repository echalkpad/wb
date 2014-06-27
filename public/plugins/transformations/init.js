define(['models/topic', 'models/topic_map'], function(Topic, TopicMap){

  _.extend(Topic.prototype, {
    conform: function(){ //supply missing properties //TODO: param for required only or required and optional.
      this.suggested_properties().each(function(property){
        var method = this.property_type(property);
        this[method]({type: property});
      }, this);
      return this;
    },
    shed: function(){ //eliminate foreign properties
      var foreign = this.custom_properties();
      this.properties()
        .select(function(property){
          return foreign.contains(property.type());
        })
        .each(function(property){
          property.detach();
        });
      return this;
    },
    trim: function(){ //drop properties with no values
      this.properties().absent().each(function(property){
        property.detach();
      });
      return this;
    }
  });

  _.aspect(TopicMap.prototype, 'topic', function($super, data, fn){
    var topic = $super.call(this, data, fn);
    if (!this.readied) return topic;
    return topic.conform();
  });

  return TopicMap;

});
